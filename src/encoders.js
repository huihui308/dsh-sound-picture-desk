// 硬件编码器探测：有显卡/NPU 就用，没有就回退 CPU（libx264）。
// 判断标准不是「ffmpeg 列出这个编码器」，而是「实际能编码出一帧」——
// 列得出来但驱动缺失/权限不足的情况很常见，跑一次才算数。
import { execFile } from 'node:child_process'

const FFMPEG = process.env.PICTURE_DESK_FFMPEG || process.env.STORY_DESK_FFMPEG || 'ffmpeg'

/** 候选编码器，按优先级排。参数按各家自己的口径给，不能混用。 */
const CANDIDATES = [
  {
    id: 'h264_videotoolbox',
    label: 'Apple VideoToolbox（Mac 硬件编码）',
    // -q:v 只有 Apple Silicon + ffmpeg 4.4 以上才认；Intel Mac 上会直接报错，
    // 所以留一套按码率的参数做兜底（Intel Mac 只能这样）。
    args: ['-c:v', 'h264_videotoolbox', '-q:v', '55'],
    fallbackArgs: ['-c:v', 'h264_videotoolbox', '-b:v', '8M', '-maxrate', '10M', '-bufsize', '16M'],
    platform: 'darwin',
  },
  {
    id: 'h264_nvenc',
    label: 'NVIDIA NVENC',
    args: ['-c:v', 'h264_nvenc', '-preset', 'p4', '-cq', '21'],
    platform: 'any',
  },
  {
    id: 'h264_qsv',
    label: 'Intel Quick Sync',
    args: ['-c:v', 'h264_qsv', '-preset', 'medium', '-global_quality', '21'],
    platform: 'any',
  },
  {
    id: 'h264_amf',
    label: 'AMD AMF',
    args: ['-c:v', 'h264_amf', '-quality', 'balanced', '-qp_i', '21', '-qp_p', '21'],
    platform: 'any',
  },
]

const CPU = {
  id: 'libx264',
  label: 'CPU（x264）',
  args: ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21'],
  platform: 'any',
  hardware: false,
}

/** 真正跑一次编码，能出帧才算可用。 */
function canUse(enc, timeoutMs = 8000) {
  return new Promise(resolve => {
    const args = [
      '-hide_banner', '-loglevel', 'error',
      // 尺寸别给太小：NVENC 对最小画面尺寸有限制，128x128 会直接初始化失败，
      // 导致「明明有显卡却探测不到」
      '-f', 'lavfi', '-i', 'color=c=black:s=1280x720:d=0.1',
      ...enc.args,
      '-frames:v', '1', '-f', 'null', '-',
    ]
    execFile(FFMPEG, args, { timeout: timeoutMs }, (err, stdout, stderr) => {
      if (err) {
        resolve({ ok: false, reason: String(stderr || err.message).slice(0, 120) })
        return
      }
      resolve({ ok: true })
    })
  })
}

let cached = null

/**
 * 返回本机首选的编码器。结果缓存在进程内存里，探测只做一次。
 * 想强制 CPU 就设 PICTURE_DESK_ENCODER=cpu（旧名 STORY_DESK_ENCODER 仍认）。
 */
export async function resolveEncoder() {
  if (cached) return cached
  const forced = String(process.env.PICTURE_DESK_ENCODER || process.env.STORY_DESK_ENCODER || '').toLowerCase()
  if (forced === 'cpu' || forced === 'libx264') {
    cached = { ...CPU, hardware: false, forced: true }
    return cached
  }
  const platform = process.platform
  for (const enc of CANDIDATES) {
    if (enc.platform !== 'any' && enc.platform !== platform) continue
    const result = await canUse(enc)
    if (result.ok) {
      cached = { ...enc, hardware: true, forced: false }
      return cached
    }
    // 首套参数不成立时试兜底参数（Intel Mac 的 VideoToolbox 不支持 -q:v）
    if (enc.fallbackArgs) {
      const retry = await canUse({ ...enc, args: enc.fallbackArgs })
      if (retry.ok) {
        cached = { ...enc, args: enc.fallbackArgs, hardware: true, forced: false }
        return cached
      }
    }
  }
  cached = { ...CPU, hardware: false, forced: false }
  return cached
}

/** 给界面看的：本机用什么编码，探测过了没有，以及硬件是不是刚翻过车。 */
export async function encoderInfo() {
  const enc = await resolveEncoder()
  return {
    id: enc.id,
    label: enc.label,
    hardware: Boolean(enc.hardware),
    forced: Boolean(enc.forced),
    ...hardwareBrokenInfo(),
  }
}

/** 编码参数片段；硬件编码统一给它自己的参数，CPU 走 x264。 */
export async function encoderArgs() {
  const enc = await resolveEncoder()
  return enc.args
}

/**
 * 硬件编码器能同时开几路。
 * 消费级 GeForce 对并发的 NVENC 会话数有硬限制（驱动层面），
 * 开太多路会出现 OpenEncodeSessionEx failed / No capable devices found，
 * 所以并行数要夹在这个值以内。
 */
export function maxParallelSessions() {
  const enc = cached
  if (!enc?.hardware) return Number.POSITIVE_INFINITY
  if (enc.id === 'h264_nvenc') return 6
  if (enc.id === 'h264_videotoolbox') return 4 // media engine 数量有限
  if (enc.id === 'h264_qsv') return 4
  return 6
}

/**
 * 硬件编码中途翻车时把这一轮降级到 CPU，避免整条片子失败。
 * 记录带时间戳而不是永久布尔：驱动升级 / 设备恢复后不必重启进程，
 * TTL 到期自动允许再试硬件（30 分钟足够覆盖一条片子的重试窗口）。
 */
const HARDWARE_BROKEN_TTL_MS = 30 * 60 * 1000
let hardwareBrokenAt = 0
let hardwareBrokenReason = null

/** 故障还在有效期内才返回 true；过期视为可以重新尝试硬件。 */
export function isHardwareBroken() {
  return hardwareBrokenAt > 0 && Date.now() - hardwareBrokenAt < HARDWARE_BROKEN_TTL_MS
}

/** 硬件故障状态，供 encoderInfo 暴露给界面；没坏或已过期时字段为 null。 */
function hardwareBrokenInfo() {
  const broken = isHardwareBroken()
  return {
    broken,
    brokenReason: broken ? hardwareBrokenReason : null,
    brokenAt: broken ? new Date(hardwareBrokenAt).toISOString() : null,
  }
}

export function markHardwareBroken(reason) {
  // 有效期内只告警一次，避免每个镜头都刷一行日志；TTL 过期后再翻车会重新计时并告警
  if (isHardwareBroken()) return
  hardwareBrokenAt = Date.now()
  hardwareBrokenReason = String(reason ?? '').slice(0, 160) || null
  console.warn(`[sound-picture-desk] 硬件编码不可用，改用 CPU（${HARDWARE_BROKEN_TTL_MS / 60000} 分钟内不再尝试硬件）：${hardwareBrokenReason ?? '未知原因'}`)
}

/** 手动清掉故障 latch：换了驱动/硬件后不必等 TTL，也方便测试。 */
export function resetHardwareBroken() {
  hardwareBrokenAt = 0
  hardwareBrokenReason = null
}

/** 当前该用的编码参数：故障有效期内走 CPU。 */
export function activeEncoderArgs() {
  if (isHardwareBroken()) return CPU.args
  return (cached ?? CPU).args
}

/** 已经探测过的结果，同步取用（渲染循环里避免重复 await 探测）。 */
export function encoderArgsSync() {
  if (isHardwareBroken()) return CPU.args
  return (cached ?? CPU).args
}

/** CPU 兜底参数，硬件编码报错时重试用。 */
export const CPU_ENCODER_ARGS = CPU.args

/** 判断错误是不是「硬件编码这条路走不通」，值得换 CPU 重试。 */
export function isHardwareEncoderFailure(message) {
  const text = String(message || '')
  return /OpenEncodeSessionEx|No capable devices|nvenc|videotoolbox|qsv|amf|Cannot load|device.*not found|incompatible client key/i.test(text)
}

export function encoderIdSync() {
  return (cached ?? CPU).id
}
