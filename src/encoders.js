// 硬件编码器探测：有显卡/NPU 就用，没有就回退 CPU（libx264）。
// 判断标准不是「ffmpeg 列出这个编码器」，而是「实际能编码出一帧」——
// 列得出来但驱动缺失/权限不足的情况很常见，跑一次才算数。
import { execFile } from 'node:child_process'

const FFMPEG = process.env.STORY_DESK_FFMPEG || 'ffmpeg'

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
 * 想强制 CPU 就设 STORY_DESK_ENCODER=cpu。
 */
export async function resolveEncoder() {
  if (cached) return cached
  const forced = String(process.env.STORY_DESK_ENCODER || '').toLowerCase()
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

/** 给界面看的：本机用什么编码，探测过了没有。 */
export async function encoderInfo() {
  const enc = await resolveEncoder()
  return { id: enc.id, label: enc.label, hardware: Boolean(enc.hardware), forced: Boolean(enc.forced) }
}

/** 编码参数片段；硬件编码统一给它自己的参数，CPU 走 x264。 */
export async function encoderArgs() {
  const enc = await resolveEncoder()
  return enc.args
}

/** 已经探测过的结果，同步取用（渲染循环里避免重复 await 探测）。 */
export function encoderArgsSync() {
  return (cached ?? CPU).args
}

export function encoderIdSync() {
  return (cached ?? CPU).id
}
