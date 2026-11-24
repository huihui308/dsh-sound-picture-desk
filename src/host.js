// dsh-sound-picture-desk 的 Host 半片：/sound-picture-desk 接口、项目状态、生成编排。
// 文案走 DSH 当前模型，旁白走 MiMo TTS，画面走本机/平台生图，成片走 ffmpeg。
import { createReadStream } from 'node:fs'
import { execFile } from 'node:child_process'
import { appendFile, copyFile, cp, open, rename, stat, writeFile, readFile, rm, mkdir } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cpus, homedir } from 'node:os'

import { DEFAULT_SETTINGS, STAGES, STAGE_LABEL, Store, dshHome, newId, stageOf } from './store.js'
import { TONES, VISUAL_STYLES, styleLabel, writeScript } from './script.js'
import { TTS_PRESETS, TTS_VOICES, synthesize, testTtsChannel } from './tts.js'
import { encoderArgsSync, encoderInfo, maxParallelSessions, resolveEncoder } from './encoders.js'
import { IMAGE_PRESETS, generateImage, testImageChannel } from './images.js'
import { buildAss, buildSrt, burnSubtitles, concatShots, concatWithFade, probeDuration, renderIntroCard, renderShot } from './render.js'
import { callModel, extractJson, modelInfo } from './llm.js'
import { chatTurn } from './chat.js'
import { cancelTask, isBusy, isTaskLocked, publicTask, startTask } from './jobs.js'
import { PLATFORMS, PLATFORM_ORDER, RULE_VERSION, composeCopy, countVariant, normalizeTargets, sanitizeVariant, validateCopy, validateVideo, variantIsEmpty } from './publish/rules.js'
import { generateCopyVariants } from './publish/copy.js'
import { reviseCopy } from './publish/revise.js'
import { buildExport } from './publish/export.js'

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')
const MAX_JSON = 8_000_000
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.srt': 'text/plain; charset=utf-8', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8' }
const MEDIA_DIRS = new Set(['images', 'audio', 'renders', 'work', 'samples', 'anchors', 'covers', 'exports'])

/** ffmpeg/ffprobe 的口径与 encoders.js / render.js 一致：环境变量优先，旧名仍认。 */
const FFMPEG = process.env.PICTURE_DESK_FFMPEG || process.env.STORY_DESK_FFMPEG || 'ffmpeg'
const FFPROBE = process.env.PICTURE_DESK_FFPROBE || process.env.STORY_DESK_FFPROBE || 'ffprobe'

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

async function readBuffer(req, limit) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw Object.assign(new Error('内容太大'), { status: 413 })
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

/**
 * 解析请求体：空体按空对象处理；null / 数组 / 标量一律 400。
 * 直接返回 JSON.parse 的结果时，body 是字面 null 会让各分支 TypeError 变成 500。
 */
export function parseJsonBody(text) {
  const raw = String(text ?? '')
  if (!raw.trim()) return {}
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw Object.assign(new Error('请求不是有效的 JSON'), { status: 400 })
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw Object.assign(new Error('请求体必须是 JSON 对象'), { status: 400 })
  }
  return parsed
}

async function readJson(req) {
  const raw = await readBuffer(req, MAX_JSON)
  return parseJsonBody(raw.toString('utf8'))
}

/** 支持 Range，成片才能在页面里拖动进度条。 */
/**
 * 按文件头判断真实类型。生图服务常把 JPEG 直接回给我们，我们存成 .png，
 * 浏览器按 image/png 解码就会错乱——所以以字节为准，扩展名只作兜底。
 */
async function sniffType(file, fallback) {
  try {
    const handle = await open(file, 'r')
    try {
      const head = Buffer.alloc(12)
      await handle.read(head, 0, 12, 0)
      if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image/jpeg'
      if (head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
      if (head.subarray(0, 4).toString('ascii') === 'RIFF' && head.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
      if (head.subarray(0, 3).toString('ascii') === 'GIF') return 'image/gif'
    } finally {
      await handle.close()
    }
  } catch {
    // 读不到就用扩展名
  }
  return fallback
}

/**
 * 媒体名解码：客户端对路径每一段做 encodeURIComponent，服务端不解码的话中文文件名（如音色试听）必 404。
 * 解码之后再拦 '..'、斜杠、反斜杠——%2e%2e 只有先解码才会现形。
 * 任何一段解出来不合法就返回 null。
 */
export function decodeMediaName(parts) {
  const list = Array.isArray(parts) ? parts : String(parts ?? '').split('/')
  const names = []
  for (const part of list) {
    let name = String(part ?? '')
    try {
      name = decodeURIComponent(name)
    } catch {
      // 非法转义按原值走，交给下面的字符校验
    }
    if (!name || name === '.' || name.includes('..') || name.includes('/') || name.includes('\\') || name.includes('\0')) return null
    names.push(name)
  }
  return names.join('/')
}

/**
 * 把文件流接到响应上。stat 成功之后文件仍可能被删（回收站清理、重写稿、并发任务），
 * 或 fd 被用尽——流上的 error 没人监听会变成未捕获异常，整个 Host 进程都会被拖垮。
 */
function pipeFile(res, stream) {
  stream.on('error', () => {
    if (res.headersSent) {
      res.destroy()
      return
    }
    // 前面按 stat 设过 content-length/etag，回 JSON 前要清掉，否则响应长度对不上客户端
    res.removeHeader('content-length')
    res.removeHeader('content-range')
    res.removeHeader('etag')
    json(res, 500, { error: '读取文件失败' })
  })
  // 客户端中止 / 拖动进度条会提前断开：把流销毁，别把 fd 挂在已断开的连接上
  res.on('close', () => stream.destroy())
  // 连接已经断了就别再往里写，否则响应的 error 事件没人接会变成进程级异常
  res.on('error', () => stream.destroy())
  if (res.destroyed || res.writableEnded) {
    stream.destroy()
    return
  }
  stream.pipe(res)
}

async function sendFile(req, res, file) {
  const type = MIME[extname(file).toLowerCase()]
  if (!type) return json(res, 404, { error: '不支持的文件类型' })
  let info
  try {
    info = await stat(file)
  } catch {
    return json(res, 404, { error: '文件不存在' })
  }
  // 文件名是固定的（s001.png / video.mp4），重出后会覆盖同名文件。
  // 用 ETag + no-cache 让浏览器每次回来问一句，改过才重新下，没改只回 304。
  const etag = `W/"${info.size}-${Math.floor(info.mtimeMs)}"`
  res.setHeader('etag', etag)
  res.setHeader('cache-control', 'private, no-cache')
  if (req.headers['if-none-match'] === etag) {
    res.statusCode = 304
    return res.end()
  }
  res.setHeader('content-type', await sniffType(file, type))
  res.setHeader('accept-ranges', 'bytes')
  res.setHeader('x-content-type-options', 'nosniff')
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '')
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, info.size - Number(range[2]))
    const end = range[1] && range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1
    if (start >= info.size || start > end) {
      res.statusCode = 416
      res.setHeader('content-range', `bytes */${info.size}`)
      return res.end()
    }
    res.statusCode = 206
    res.setHeader('content-range', `bytes ${start}-${end}/${info.size}`)
    res.setHeader('content-length', end - start + 1)
    return pipeFile(res, createReadStream(file, { start, end }))
  }
  res.statusCode = 200
  res.setHeader('content-length', info.size)
  if (req.method === 'HEAD') return res.end()
  return pipeFile(res, createReadStream(file))
}

// ------------------------------------------------------------------ 状态视图

function findItem(state, id) {
  const item = state.items.find(row => row.id === id)
  if (!item) throw Object.assign(new Error('找不到这个项目'), { status: 404 })
  return item
}

/** 本进程或另一个 Host 进程正在跑这个项目：写操作要一起让路。 */
function taskBusy(itemId) {
  return isBusy(itemId) || isTaskLocked(itemId)
}

/**
 * 任务占用时的 409 错误：本窗口在跑 → 可以点「停止」；另一个 Host 持锁 → 本窗口停不了，
 * 只能去那个窗口完成或停止。两种情况的文案不能混，否则用户照提示点了「停止」却没反应。
 */
function busyConflictError(itemId, localMessage) {
  if (!taskBusy(itemId)) return null
  if (isBusy(itemId)) return Object.assign(new Error(localMessage), { status: 409 })
  return Object.assign(new Error('另一个窗口正在跑这个任务，请到那个窗口完成或停止（同一项目同时只能跑一个）'), { status: 409 })
}

/** 写路由统一拦截：任务跑着的时候改状态会和后台任务互相覆盖。 */
function assertNotBusy(itemId) {
  const conflict = busyConflictError(itemId, '项目正在跑任务，等结束再改；卡住就点「停止」')
  if (conflict) throw conflict
}

function segmentSummary(row, index) {
  return {
    id: row.id,
    idx: Number.isInteger(row.idx) ? row.idx : index,
    text: row.text,
    imagePrompt: row.imagePrompt,
    imagePath: row.imagePath ?? null,
    imageAt: row.imageAt ?? null,
    lastPrompt: row.lastPrompt ?? null,
    imageSize: row.imageSize ?? null,
    audioPath: row.audioPath ?? null,
    audioSecs: row.audioSecs ?? 0,
    error: row.error ?? null,
  }
}

/** 给界面看的项目：附带派生阶段与各步骤完成度。 */
function itemView(item) {
  const segments = item.segments ?? []
  const voiced = segments.filter(row => row.audioPath && row.audioSecs > 0).length
  const imaged = segments.filter(row => row.imagePath).length
  return {
    id: item.id,
    title: item.title,
    topic: item.topic ?? '',
    angle: item.angle ?? '',
    targetMinutes: item.targetMinutes ?? 5,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    stage: stageOf(item),
    stageLabel: STAGE_LABEL[stageOf(item)],
    counts: { segments: segments.length, voiced, imaged },
    totalSecs: segments.reduce((sum, row) => sum + (Number(row.audioSecs) || 0), 0),
    segments: segments.map((row, index) => segmentSummary(row, index)),
    settings: item.settings ?? {},
    samples: item.samples ?? {},
    references: item.references ?? [],
    model: item.model ?? null,
    anchors: item.anchors ?? [],
    cover: item.cover ?? null,
    render: item.render ?? null,
    task: publicTask(item.id),
  }
}

function publicSettings(settings) {
  // 密钥不进这里，界面只知道「有没有配过」
  return { ...settings }
}

/** 数值设置的合法区间：超界直接夹住，别把 2px 宽或 100000px 的画面塞给 ffmpeg。 */
const SETTING_LIMITS = {
  width: [240, 4320],
  height: [240, 4320],
  imageWidth: [512, 2048],
  imageHeight: [512, 2048],
  segmentSeconds: [12, 90],
  trashDays: [1, 365],
  renderWorkers: [0, 16],
}

/** 改这些设置会让已成片作废（画面/声音/字幕装配方式变了）。 */
const RENDER_SETTING_KEYS = new Set(['width', 'height', 'kenBurns', 'motion', 'grade', 'transition', 'intro', 'coverInVideo', 'burnSubtitles'])

function clampNumberSetting(key, value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const range = SETTING_LIMITS[key]
  if (!range) return n
  let out = Math.max(range[0], Math.min(range[1], n))
  // 视频宽高必须是偶数，否则编码器拒绝
  if (key === 'width' || key === 'height') out = Math.round(out / 2) * 2
  return out
}

// ------------------------------------------------------------------ 编排动作

function settingsFor(state) {
  return { ...DEFAULT_SETTINGS, ...state.settings }
}

/**
 * 项目自己的创作配置优先。同一个库里的书适合的画面风格不一样，
 * 所以风格/音色/画幅/节奏都按项目存，全局设置只当新建时的默认值。
 */
function effectiveSettings(state, item) {
  return { ...settingsFor(state), ...(item?.settings && typeof item.settings === 'object' ? item.settings : {}) }
}

/**
 * 参考视频只抓得到标题和简介——视频内容模型看不见。
 * 抓不到也不算错，链接本身照样进写稿上下文。
 */
// ------------------------------------------------------------------ 发布

/** 成片信息：时长、大小、画面尺寸。没有成片返回 null。 */
async function videoInfo(store, state, item) {
  if (!item.render?.path) return null
  const file = join(store.itemDir(item.id), item.render.path)
  const info = await stat(file).catch(() => null)
  if (!info) return null
  const settings = effectiveSettings(state, item)
  // 渲染时 probe 失败会把 secs 存成 0；发布检查时补 probe 一次，别让视频检查整体消失
  let secs = Number(item.render.secs) || 0
  if (!secs) secs = Math.max(0, Math.round(await probeDuration(file)))
  return {
    path: item.render.path,
    secs,
    bytes: info.size,
    width: Number(settings.width) || 1080,
    height: Number(settings.height) || 1920,
    at: item.render.at ?? null,
  }
}

/** 把平台规则跑成界面上的检查列表；error 会挡住导出，warn 只提示。 */
export function publishChecks(publish, targets, video, coverExists) {
  const checks = []
  for (const id of targets) {
    const platform = PLATFORMS[id]
    if (!platform) continue
    for (const check of validateCopy(id, publish.variants?.[id] ?? {})) {
      checks.push({ ...check, platform: id, platformLabel: platform.label })
    }
    if (video) {
      for (const check of validateVideo(id, video)) {
        checks.push({ ...check, platform: id, platformLabel: platform.label, label: platform.label + ' · ' + check.label })
      }
    }
  }
  if (targets.includes('xiaohongshu')) {
    const cover = publish.cover
    checks.push({
      id: 'cover',
      platform: 'xiaohongshu',
      platformLabel: PLATFORMS.xiaohongshu.label,
      label: '小红书 · 封面',
      state: coverExists ? 'ok' : 'warn',
      detail: coverExists
        ? cover.width + '×' + cover.height
        : cover?.path ? '封面文件不见了，重新生成' : '还没有 3:4 封面',
      fix: coverExists ? '' : '点「生成封面」',
    })
  }
  return checks
}

/** 给「发布」页的完整视图。导出前先看 blocking 项。 */
async function publishView(store, state, itemId) {
  const item = findItem(state, itemId)
  const publish = await store.readPublish(itemId)
  const targets = normalizeTargets(publish.targets)
  const video = await videoInfo(store, state, item)
  const coverPath = publish.cover?.path ? join(store.itemDir(itemId), publish.cover.path) : ''
  const coverExists = coverPath ? Boolean(await stat(coverPath).catch(() => null)) : false
  const checks = publishChecks(publish, targets, video, coverExists)
  const blocking = checks.filter(check => check.state === 'error').length
  return {
    id: item.id,
    schemaVersion: publish.schemaVersion,
    ruleVersion: RULE_VERSION,
    updatedAt: publish.updatedAt,
    targets,
    platforms: PLATFORM_ORDER.map(id => {
      const platform = PLATFORMS[id]
      return {
        id,
        label: platform.label,
        summary: platform.summary,
        composeUrl: platform.composeUrl,
        cover: platform.cover ?? null,
        video: platform.video,
        title: platform.title ?? null,
        body: platform.body ?? null,
        tags: platform.tags ?? null,
        comment: platform.comment ?? null,
        text: platform.text ?? null,
        thread: platform.thread ?? null,
      }
    }),
    variants: publish.variants,
    counts: { xiaohongshu: countVariant('xiaohongshu', publish.variants.xiaohongshu), x: countVariant('x', publish.variants.x) },
    copyTexts: {
      xiaohongshu: composeCopy('xiaohongshu', publish.variants.xiaohongshu),
      x: composeCopy('x', publish.variants.x),
    },
    cover: publish.cover,
    coverSources: coverSourceList(item),
    exports: publish.exports,
    records: publish.records,
    revisions: publish.revisions ?? [],
    checks,
    blocking,
    video,
    canExport: Boolean(video) && targets.length > 0 && blocking === 0,
    renderAt: item.render?.at ?? null,
  }
}

/** 参考链接抓取上限：网页正文用不到这么多，防止被超大响应拖住。 */
const REFERENCE_MAX_BYTES = 1_500_000
const REFERENCE_MAX_REDIRECTS = 3

/**
 * 本机 / 内网 / 链路本地 / 云元数据地址判断。参考链接是用户手填的，
 * 服务端直接去抓就等于把宿主所在网络暴露给页面，必须先挡掉。
 */
export function isPrivateAddress(host) {
  const raw = String(host ?? '').trim().toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '')
  if (!raw) return true
  if (raw === 'localhost' || raw.endsWith('.localhost') || raw.endsWith('.local')) return true
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(raw)
  if (v4) {
    const parts = v4.slice(1).map(Number)
    if (parts.some(n => n > 255)) return true
    const [a, b] = parts
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true // 链路本地，含云厂商元数据 169.254.169.254
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // 运营商级 NAT
    return false
  }
  if (raw.includes(':')) {
    // IPv6 只判断本机、ULA、链路本地三类，不展开整段网段
    if (raw === '::1' || raw === '::') return true
    if (raw.startsWith('fc') || raw.startsWith('fd')) return true
    if (/^fe[89ab]/.test(raw)) return true
    const mapped = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(raw)
    if (mapped) return isPrivateAddress(mapped[1])
    return false
  }
  return false
}

/** 只允许抓公网 http(s)；跳转的每一跳都要重新过一遍这个校验。 */
function allowedReferenceUrl(raw) {
  let parsed
  try {
    parsed = new URL(String(raw ?? '').trim())
  } catch {
    return { ok: false, error: '链接格式不对' }
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { ok: false, error: '不是 http 链接' }
  if (isPrivateAddress(parsed.hostname)) return { ok: false, error: '不支持抓取本机或内网地址' }
  return { ok: true, url: parsed.toString() }
}

/** 按字节预算读正文：先看 content-length，再边读边累计，超了立刻断开并只留已读部分。 */
async function readReferenceText(response, limit) {
  const declared = Number(response.headers.get('content-length') || 0)
  if (declared > limit) return ''
  if (!response.body) return String(await response.text()).slice(0, limit)
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = Buffer.from(value)
      size += chunk.length
      if (size > limit) {
        chunks.push(chunk.subarray(0, chunk.length - (size - limit)))
        await reader.cancel().catch(() => {})
        break
      }
      chunks.push(chunk)
    }
  } finally {
    reader.releaseLock?.()
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function inspectReference(url) {
  const clean = String(url ?? '').trim()
  const start = allowedReferenceUrl(clean)
  if (!start.ok) return { url: clean, title: '', error: start.error }
  try {
    const signal = AbortSignal.timeout(8000)
    let current = start.url
    let response = null
    // 跳转一律手动跟：'follow' 会绕过内网校验，第二跳就能跳进 127.0.0.1
    for (let hop = 0; hop <= REFERENCE_MAX_REDIRECTS; hop += 1) {
      const check = allowedReferenceUrl(current)
      if (!check.ok) throw new Error(check.error)
      response = await fetch(check.url, {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; dsh-sound-picture-desk/0.1)', accept: 'text/html' },
        signal,
        redirect: 'manual',
      })
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        await response.body?.cancel?.().catch(() => {})
        if (!location) throw new Error('跳转地址缺失')
        if (hop === REFERENCE_MAX_REDIRECTS) throw new Error('跳转次数太多')
        current = new URL(location, check.url).toString()
        response = null
        continue
      }
      break
    }
    if (!response) throw new Error('跳转次数太多')
    const html = (await readReferenceText(response, REFERENCE_MAX_BYTES)).slice(0, 400_000)
    const pick = pattern => {
      const match = pattern.exec(html)
      return match ? match[1].replace(/\s+/g, ' ').trim().slice(0, 120) : ''
    }
    const title = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)
      || pick(/<title[^>]*>([^<]+)/i)
    const desc = pick(/<meta[^>]+(?:property|name)=["'](?:og:)?description["'][^>]+content=["']([^"']+)/i)
    return { url: clean, title, desc, error: null }
  } catch (err) {
    return { url: clean, title: '', error: err?.message ?? '打不开' }
  }
}

async function createItem(store, body) {
  const topic = String(body.topic ?? '').trim()
  if (!topic) throw Object.assign(new Error('先写一个题材或书名'), { status: 400 })
  const rawText = String(body.rawText ?? '').trim().slice(0, 200_000)
  const targetMinutes = Math.max(1, Math.min(30, Number(body.targetMinutes) || 5))
  const item = {
    id: newId('bk'),
    title: topic.slice(0, 60),
    topic,
    rawText,
    angle: '',
    targetMinutes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    segments: [],
    render: null,
    log: [{ at: new Date().toISOString(), text: `立项：${topic}` }],
  }
  await store.ensureItemDirs(item.id)
  const { state } = await store.mutate(draft => {
    draft.items.unshift(item)
    return item.id
  })
  return { id: item.id, state }
}

/** 写稿：整篇稿子重写，旧的图/音全部作废（它们对不上新文字了）。 */
async function startScript(ctx, store, secrets, itemId) {
  const state = await store.read()
  const item = findItem(state, itemId)
  const settings = effectiveSettings(state, item)
  return startTask(itemId, 'script', 1, async ({ report, signal }) => {
    report(0, '正在写稿…', 1)
    const result = await writeScript(ctx, {
      topic: item.topic,
      rawText: item.rawText,
      settings: { ...settings, targetMinutes: item.targetMinutes },
      signal,
      route: item.model ?? null,
      references: item.references ?? [],
      // 推理型模型会先想很久，把「在思考」和「在写作」分开报，用户才知道没卡住
      onProgress: ({ reasoning, text }) => {
        if (text > 0) report(0, `正在写正文（已 ${text} 字，思考 ${reasoning} 字）`, 1)
        else if (reasoning > 0) report(0, `模型在推演（已想 ${reasoning} 字），还没开始落笔`, 1)
      },
    })
    const dirs = await store.ensureItemDirs(itemId)
    // 先把新稿原子落盘，成功后再清旧图：反过来做的话落盘失败时旧图已经被删，
    // 数据就真的没了。旧图换稿后不再被引用，清掉腾位置给同名新图。
    await store.mutate(draft => {
      const target = findItem(draft, itemId)
      target.title = result.title
      target.angle = result.angle
      target.segments = result.segments
      target.render = null
      target.updatedAt = new Date().toISOString()
      target.log.push({ at: new Date().toISOString(), text: `写稿：${result.segments.length} 段` })
      return result.segments.length
    })
    await rm(dirs.images, { recursive: true, force: true })
      .then(() => mkdir(dirs.images, { recursive: true }))
      .catch(err => {
        // 清旧图失败只记日志：新稿已经落盘，别把一次成功的写稿判成失败
        console.warn(`[sound-picture-desk] 清理旧分镜图失败：${String(err?.message ?? err).slice(0, 160)}`)
      })
    report(1, '稿件写好了')
    return { segments: result.segments.length, title: result.title }
  })
}

/** 配音核心：可被单独调用，也可被「配音并合成」复用。 */
async function runVoiceBody(store, secrets, itemId, onlyIds, report, signal) {
  const state = await store.read()
  const item = findItem(state, itemId)
  const settings = effectiveSettings(state, item)
  // 启动时记下每段文字：合成期间用户可能改稿，改过的段音频不能用
  const snapshot = new Map(item.segments.map(row => [row.id, row.text]))
  const targets = item.segments.filter(row => !onlyIds?.length || onlyIds.includes(row.id))
  const pending = onlyIds?.length ? targets : targets.filter(row => !row.audioPath)
  if (!targets.length) throw Object.assign(new Error('还没有分段，先写稿'), { status: 400 })
  const dirs = await store.ensureItemDirs(itemId)
  const key = secrets.ttsKey
  if (!key) throw Object.assign(new Error('还没有配置音频密钥，去设置里填一次'), { status: 400 })

  let done = 0
  for (const row of pending) {
    if (signal.aborted) throw new Error('已停止')
    report(done, `第 ${done + 1}/${pending.length} 段配音「${settings.voice}」`)
    const buffer = await synthesize({
      endpoint: settings.ttsEndpoint,
      model: settings.ttsModel,
      key,
      voice: settings.voice,
      text: row.text,
      signal,
    })
    const name = `s${String(row.idx + 1).padStart(3, '0')}.mp3`
    const file = join(dirs.audio, name)
    await writeFile(file, buffer)
    const secs = await probeDuration(file)
    if (!secs) throw new Error(`第 ${row.idx + 1} 段音频读不出时长，可能合成损坏`)
    await store.mutate(draft => {
      const target = findItem(draft, itemId)
      const seg = target.segments.find(s2 => s2.id === row.id)
      if (!seg) return null
      // 合成期间文字被改过：这段音频对新文字是错位的，丢弃并标出来，别覆盖用户改动
      if (seg.text !== snapshot.get(row.id)) {
        seg.error = '文字已改，音频作废'
        target.updatedAt = new Date().toISOString()
        return null
      }
      seg.audioPath = `audio/${name}`
      seg.audioSecs = Math.round(secs * 100) / 100
      seg.error = null
      target.updatedAt = new Date().toISOString()
      return null
    })
    done += 1
    report(done, `已完成 ${done}/${pending.length} 段`)
  }
  if (pending.length) {
    await store.mutate(draft => {
      const target = findItem(draft, itemId)
      target.render = null
      target.log.push({ at: new Date().toISOString(), text: `配音：${pending.length} 段 · ${settings.voice}` })
      return null
    })
  }
  return { done, total: pending.length }
}

async function startVoice(store, secrets, itemId, onlyIds) {
  const state = await store.read()
  const item = findItem(state, itemId)
  const targets = item.segments.filter(row => (!onlyIds?.length || onlyIds.includes(row.id)))
  if (!targets.length) throw Object.assign(new Error('还没有分段，先写稿'), { status: 400 })
  // 进度分母只算真正要合成的段：已配好的段不会重跑，不算进去
  const pending = onlyIds?.length ? targets.length : targets.filter(row => !row.audioPath).length
  return startTask(itemId, 'tts', pending, async ({ report, signal }) =>
    runVoiceBody(store, secrets, itemId, onlyIds, report, signal))
}

/**
 * 默认并行路数。每个镜头的滤镜是 CPU 密集的，ffmpeg 自己还会开几个线程，
 * 所以一路按 4 个逻辑核算比较稳；再夹在 2–8 之间，避免把小机器拖死或在大机器上排队。
 */
function autoRenderWorkers() {
  const cores = cpus()?.length || 4
  return Math.max(1, Math.min(8, Math.floor(cores / 4) || 1))
}

/** ffmpeg filter 参数里的路径要转义，否则冒号和反斜杠会拆坏参数。 */
function escapeFilterPath(path) {
  return String(path).replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'")
}

/** 封面标题用的字体：和字幕同一套，保证中文不缺字。 */
const COVER_FONT = process.env.PICTURE_DESK_FONT || process.env.STORY_DESK_FONT || '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'

/** 片头标题卡时长，渲染和字幕时间轴共用同一个值。 */
const INTRO_SECONDS = 3

/** 回收站保留天数，取设置里的值，默认 7。 */
function trashDays(state) {
  const n = Number(state.settings?.trashDays)
  return Number.isFinite(n) && n >= 1 && n <= 365 ? n : 7
}

/** 清理超过保留期的回收站项目。启动时和每次读状态时都跑一次。 */
async function purgeExpiredTrash(store) {
  const state = await store.read()
  const days = trashDays(state)
  const cutoff = Date.now() - days * 86400_000
  const expired = (state.items ?? []).filter(item =>
    item.deletedAt && Date.parse(item.deletedAt) < cutoff)
  if (!expired.length) return 0
  await store.mutate(draft => {
    const ids = new Set(expired.map(item => item.id))
    draft.items = draft.items.filter(row => !ids.has(row.id))
    return null
  })
  for (const item of expired) {
    await rm(store.itemDir(item.id), { recursive: true, force: true }).catch(() => {})
  }
  return expired.length
}

async function startImages(store, secrets, itemId, onlyIds, note) {
  const state = await store.read()
  const item = findItem(state, itemId)
  const settings = effectiveSettings(state, item)
  const targets = item.segments.filter(row => (!onlyIds?.length || onlyIds.includes(row.id)))
  if (!targets.length) throw Object.assign(new Error('还没有分段，先写稿'), { status: 400 })
  const dirs = await store.ensureItemDirs(itemId)
  const width = Number(settings.imageWidth) || 1024
  const height = Number(settings.imageHeight) || 1792

  return startTask(itemId, 'image', targets.length, async ({ report, signal }) => {
    let done = 0
    for (const row of targets) {
      if (signal.aborted) throw new Error('已停止')
      report(done, `第 ${done + 1}/${targets.length} 张画面`)
      const fix = note && targets.length === 1 ? String(note).trim() : ''
      // 修改要求放最前面：追加在长描述末尾时，模型往往当没看见
      const base = row.imagePrompt || row.text.slice(0, 400)
      const content = fix
        ? `画面要求：${fix}。${base}${anchorHint(item)}`
        : `${base}${anchorHint(item)}`
      const raw = await generateImage(settings, secrets, {
        content,
        width,
        height,
        signal,
      })
      const norm = await normalizeImageBuffer(raw, dirs, width, height, signal)
      const buffer = norm.buffer
      const name = `s${String(row.idx + 1).padStart(3, '0')}.png`
      await writeFile(join(dirs.images, name), buffer)
      await store.mutate(draft => {
        const target = findItem(draft, itemId)
        const seg = target.segments.find(s => s.id === row.id)
        if (seg) {
          seg.imagePath = `images/${name}`
          // 文件名固定会被浏览器缓存，带个时间戳让重出的图真正刷新
          seg.imageAt = Date.now()
          // 存下来，用户能核对「我的意见到底有没有被用上」
          seg.lastPrompt = content.slice(0, 800)
          seg.imageSize = `${norm.width}×${norm.height}`
          // 返回的图宽高和请求正好对调，说明模型给了一张横图，提示用户
          seg.error = norm.turned ? `模型返回了横图（${norm.width}×${norm.height}），建议重出` : null
        }
        target.updatedAt = new Date().toISOString()
        return null
      })
      done += 1
      report(done, `已完成 ${done}/${targets.length} 张`)
    }
    await store.mutate(draft => {
      const target = findItem(draft, itemId)
      target.render = null
      target.log.push({ at: new Date().toISOString(), text: `出图：${targets.length} 张 · ${styleLabel(settings.visualStyle)}` })
      return null
    })
    return { done, total: targets.length }
  })
}

/**
 * 五种画面风格各画一张同一题材的样图，摆在一起让用户挑。
 * 只看「电影写实」四个字选不出风格，看到图才知道哪张配这本书。
 */
async function startStyleSamples(store, secrets, itemId) {
  const state = await store.read()
  const item = findItem(state, itemId)
  const settings = effectiveSettings(state, item)
  const dirs = await store.ensureItemDirs(itemId)
  await mkdir(join(dirs.base, 'samples'), { recursive: true })
  const content = String(item.angle || item.segments[0]?.imagePrompt || item.topic || '一处旧时的场景').trim()
  const styleIds = Object.keys(VISUAL_STYLES)
  const width = Number(settings.imageWidth) || 1024
  const height = Number(settings.imageHeight) || 1792
  return startTask(itemId, 'style-samples', styleIds.length, async ({ report, signal }) => {
    let done = 0
    for (const styleId of styleIds) {
      if (signal.aborted) throw new Error('已停止')
      report(done, `正在画「${styleLabel(styleId)}」`)
      const rawStyle = await generateImage({ ...settings, visualStyle: styleId }, secrets, { content, width, height, signal })
      const { buffer } = await normalizeImageBuffer(rawStyle, dirs, width, height, signal)
      const rel = `samples/style-${styleId}.png`
      await writeFile(join(dirs.base, rel), buffer)
      await store.mutate(draft => {
        const target = findItem(draft, itemId)
        target.samples = target.samples ?? {}
        target.samples.style = { ...(target.samples.style ?? {}), [styleId]: rel }
        return null
      })
      done += 1
      report(done, `已画好 ${done}/${styleIds.length}`)
    }
    return { count: done }
  })
}

/** 每个音色合成同一句话，点着听，听完再定。 */
async function startVoiceSamples(store, secrets, itemId) {
  const state = await store.read()
  const item = findItem(state, itemId)
  const settings = effectiveSettings(state, item)
  const dirs = await store.ensureItemDirs(itemId)
  await mkdir(join(dirs.base, 'samples'), { recursive: true })
  if (!secrets.ttsKey) throw Object.assign(new Error('还没有配置音频密钥，去设置里填一次'), { status: 400 })
  const sample = String(item.segments[0]?.text || VOICE_SAMPLE_FALLBACK).slice(0, FIFTEEN_SECONDS_CHARS)
  const voices = TTS_VOICES.map(row => row.id)
  return startTask(itemId, 'voice-samples', voices.length, async ({ report, signal }) => {
    let done = 0
    for (const voice of voices) {
      if (signal.aborted) throw new Error('已停止')
      report(done, `正在合成「${voice}」`)
      const buffer = await synthesize({
        endpoint: settings.ttsEndpoint,
        model: settings.ttsModel,
        key: secrets.ttsKey,
        voice,
        text: sample,
        signal,
      })
      const rel = `samples/voice-${voice.replace(/[^\w\u4e00-\u9fa5-]/g, '_')}.mp3`
      await writeFile(join(dirs.base, rel), buffer)
      await store.mutate(draft => {
        const target = findItem(draft, itemId)
        target.samples = target.samples ?? {}
        target.samples.voice = { ...(target.samples.voice ?? {}), [voice]: rel }
        return null
      })
      done += 1
      report(done, `已合成 ${done}/${voices.length}`)
    }
    return { count: done }
  })
}

/**
 * 生图服务返回的字节不能直接落盘：
 * 常见它给的是 JPEG（我们存成 .png），还可能带 EXIF 旋转标记——
 * 浏览器尊重标记、ffmpeg 或别的看图工具不尊重，同一张图在两边方向就不一样。
 * 所以统一用 ffmpeg 转成标准 PNG：旋转烘进像素、元数据清掉，谁看都一样。
 */
async function normalizeImageBuffer(buffer, dirs, wantW, wantH, signal) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const raw = join(dirs.work, `raw-${stamp}.img`)
  const out = join(dirs.work, `norm-${stamp}.png`)
  try {
    await writeFile(raw, buffer)
    await new Promise((resolve, reject) => {
      execFile(FFMPEG, ['-y', '-v', 'error', '-i', raw, '-map_metadata', '-1', '-frames:v', '1', out],
        { timeout: 60_000, signal }, err => (err ? reject(err) : resolve()))
    })
    const png = await readFile(out)
    let width = 0
    let height = 0
    try {
      const dict = await new Promise((resolve, reject) => {
        execFile(FFPROBE, ['-v', 'error', '-select_streams', 'v:0',
          '-show_entries', 'stream=width,height', '-of', 'csv=p=0', out],
          { timeout: 20_000 }, (err, stdout) => (err ? reject(err) : resolve(String(stdout).trim())))
      })
      const [w, h] = dict.split(',').map(Number)
      width = w || 0
      height = h || 0
    } catch {
      // 读不到尺寸就交给调用方按未知处理
    }
    return { buffer: png, width, height, turned: Boolean(wantW && wantH && width === wantH && height === wantW) }
  } finally {
    await rm(raw, { force: true }).catch(() => {})
    await rm(out, { force: true }).catch(() => {})
  }
}

/** 试听样本文本：约 15 秒。实测这批音色 3.1 字/秒（64 字念了 20.5 秒），所以取 47 字。 */
const FIFTEEN_SECONDS_CHARS = 47
const VOICE_SAMPLE_FALLBACK = '话说这一桩旧事，得从头讲起，藏着一桩没人愿意提的往事。'

/** 定稿的参考图，转成一句话拼进分镜 prompt —— 保证人物前后长得像。 */
function anchorHint(item) {
  const approved = (item.anchors ?? []).filter(row => row.approved && row.desc)
  if (!approved.length) return ''
  return `；关键形象必须与下列设定一致：${approved.map(row => `${row.name}（${row.desc}）`).join('；')}`
}

/**
 * 从稿子里抽出该统一形象的人物与场景。
 * 只抽真正反复出现的：每段都提一次的主角和主场景，临时出现的路人不算。
 */
async function extractAnchors(ctx, store, itemId) {
  const state = await store.read()
  const item = findItem(state, itemId)
  // 有稿子就按稿子抽，没有就按题材推断——参考图页排在写稿之前
  const script = item.segments.length
    ? item.segments.map((row, index) => `#${index + 1} ${row.text}`).join('\n')
    : '（还没有稿子，请根据题材判断这类故事里通常必须出现、且需要统一形象的人物与主场景）'
  let text
  try {
    ({ text } = await callModel(ctx, {
      route: item.model ?? null,
      maxTokens: 3000,
      signal: AbortSignal.timeout(180_000),
      system: `你在为一部竖屏旁白成片建立「人物与场景参考表」。读完全部旁白，列出其中需要保持同一形象的对象。

只列两类：
- person：有名有姓、反复出现的角色（主角、关键对手）。路人、群众、无名士兵不要列。
- scene：反复出现的核心地点（宫门、大殿、战场），只列一次。

每个对象给一段用于画图的形象描述：年龄、体型、服饰形制（用形状写，不要只写朝代名）、发型、随身物件、伤痕或特征；场景写建筑形制、材质、光源、气氛。描述要能直接喂给画图模型，不写人名以外的文字。

最多 8 条，按重要程度排序。

只输出 JSON：{"anchors":[{"name":"李世民","kind":"person","desc":"..."}]}`,
      user: `题材：${item.topic}\n\n旁白全文：\n${script}`,
    }))
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw Object.assign(new Error('提取参考图超时（3 分钟），换个更快的模型再试'), { status: 504 })
    }
    throw err
  }
  const plan = extractJson(text)
  const rows = Array.isArray(plan.anchors) ? plan.anchors : []
  const dirs = await store.ensureItemDirs(itemId)
  await mkdir(join(dirs.base, 'anchors'), { recursive: true })

  let added = 0
  const { state: next } = await store.mutate(draft => {
    const target = findItem(draft, itemId)
    target.anchors = target.anchors ?? []
    const known = new Set(target.anchors.map(row => row.name))
    for (const row of rows.slice(0, 8)) {
      const name = String(row?.name ?? '').trim().slice(0, 30)
      const desc = String(row?.desc ?? '').trim().slice(0, 600)
      if (!name || !desc || known.has(name)) continue
      known.add(name)
      target.anchors.push({
        id: newId('anc'),
        name,
        kind: row?.kind === 'scene' ? 'scene' : 'person',
        desc,
        candidates: [],
        approved: null,
        at: new Date().toISOString(),
      })
      added += 1
    }
    return null
  })
  return { added, anchors: findItem(next, itemId).anchors ?? [] }
}

/** 给一个参考条目画一张候选图。 */
async function drawAnchor(store, secrets, itemId, anchorId, instruction) {
  const state = await store.read()
  const item = findItem(state, itemId)
  const target = (item.anchors ?? []).find(row => row.id === anchorId)
  if (!target) throw Object.assign(new Error('找不到这个参考条目'), { status: 404 })
  const settings = effectiveSettings(state, item)
  const dirs = await store.ensureItemDirs(itemId)
  await mkdir(join(dirs.base, 'anchors'), { recursive: true })
  const tail = String(instruction ?? '').trim()
  const content = [target.desc, tail && `调整：${tail}`].filter(Boolean).join('。')

  return startTask(itemId, 'anchor', 1, async ({ report, signal }) => {
    report(0, `正在画「${target.name}」`)
    const wantW = Number(settings.imageWidth) || 1024
    const wantH = Number(settings.imageHeight) || 1792
    const raw = await generateImage(settings, secrets, {
      content,
      width: wantW,
      height: wantH,
      signal,
    })
    const { buffer } = await normalizeImageBuffer(raw, dirs, wantW, wantH, signal)
    const name = `anchors/${anchorId}-${Date.now()}.png`
    await writeFile(join(dirs.base, name), buffer)
    await store.mutate(draft => {
      const row = findItem(draft, itemId)
      const hit = (row.anchors ?? []).find(a => a.id === anchorId)
      if (hit) {
        hit.candidates = [...(hit.candidates ?? []), name].slice(-6)
        // 用户改过描述就把改动留下，下次画图继续用
        if (tail) hit.desc = content.slice(0, 600)
      }
      return null
    })
    report(1, '画好了')
    return { path: name }
  })
}

/** 合成核心：调用前必须确保音画齐全（由调用方检查）。 */
async function runRenderBody(store, itemId, report, signal, offset = 0) {
  const state = await store.read()
  const item = findItem(state, itemId)
  const settings = effectiveSettings(state, item)
  // 启动快照：合成期间稿子若被改过，这一版就和当前稿子对不上，不能写回成片
  const snapshot = item.segments.map(row => ({ id: row.id, text: row.text }))
  const missingAudio = item.segments.filter(row => !row.audioPath)
  const missingImage = item.segments.filter(row => !row.imagePath)
  if (!item.segments.length) throw Object.assign(new Error('还没有分段，先写稿'), { status: 400 })
  if (missingAudio.length) throw Object.assign(new Error(`还有 ${missingAudio.length} 段没配音`), { status: 400 })
  if (missingImage.length) throw Object.assign(new Error(`还有 ${missingImage.length} 段没出图，先去出图`), { status: 400 })

  const dirs = await store.ensureItemDirs(itemId)
  const shots = new Array(item.segments.length)
  // 先确保编码器探测跑过，否则并发上限会误判成「无限制」
  await resolveEncoder()
  const wanted = Number(settings.renderWorkers) > 0
    ? Math.round(Number(settings.renderWorkers))
    : autoRenderWorkers()
  // 硬件编码有并发会话上限，开更多路只会让多出来的那几路被驱动拒绝
  const cap = maxParallelSessions()
  const workers = Math.max(1, Math.min(wanted, item.segments.length, cap))
  const capped = workers < wanted
  if (capped) {
    report(offset, `并行数从 ${wanted} 收到 ${workers}（硬件编码最多同时开 ${cap} 路）`)
  }
  let done = 0
  let cursor = 0
  // 本次渲染内是否发生过硬件→CPU 降级。不能只靠 encoders.js 的 30 分钟 TTL：
  // 长渲染跑到 TTL 过期后全局标记会变回 false，这一版镜头却真的混了两种编码。
  let encoderFallback = false
  report(offset, `合成 ${item.segments.length} 个镜头（${workers} 路并行）`)

  // 并发池：N 路同时跑，谁空谁领下一个；结果按下标放回 shots，拼接顺序不变。
  // 任何一路失败都要让其它路立刻停：Promise.all 会先 reject，但失败的那路并不会
  // 停掉别人，它们会继续往同一批 work 文件里写。所以任务内自建 AbortController。
  const inner = new AbortController()
  const onOuterAbort = () => inner.abort()
  if (signal.aborted) inner.abort()
  else signal.addEventListener('abort', onOuterAbort, { once: true })
  let firstError = null
  const runOne = async () => {
    for (;;) {
      if (inner.signal.aborted) throw new Error('已停止')
      const index = cursor
      cursor += 1
      if (index >= item.segments.length) return
      const row = item.segments[index]
      const output = join(dirs.work, `shot-${String(row.idx + 1).padStart(3, '0')}.mp4`)
      try {
        await renderShot({
          image: join(dirs.base, row.imagePath),
          audio: join(dirs.base, row.audioPath),
          output,
          seconds: row.audioSecs,
          width: settings.width,
          height: settings.height,
          kenBurns: settings.kenBurns !== false,
          motion: settings.motion || 'zoom-in',
          grade: settings.grade || 'none',
          signal: inner.signal,
          onHardwareFallback: () => { encoderFallback = true },
        })
      } catch (err) {
        // 记下首个错误并让其它 worker 一起停
        if (!firstError) firstError = err
        inner.abort()
        throw err
      }
      shots[index] = output
      done += 1
      report(offset + done, `已完成 ${done}/${item.segments.length} 个镜头`)
    }
  }
  try {
    await Promise.allSettled(Array.from({ length: workers }, runOne))
  } finally {
    signal.removeEventListener('abort', onOuterAbort)
  }
  if (firstError) throw firstError
  if (signal.aborted) throw new Error('已停止')

  report(offset + done, '正在拼接整片…')
  const plain = join(dirs.renders, 'video.mp4')
  const trans = settings.transition && settings.transition !== 'none' ? settings.transition : null
  const tmpPlain = join(dirs.work, 'plain.mp4')
  // 硬切拼接走 -c copy；但本轮降级过就不能 copy（混合编码流），强制统一重编码
  if (trans) await concatWithFade(shots, dirs.work, tmpPlain, { transition: trans, signal })
  else await concatShots(shots, dirs.work, tmpPlain, { signal, forceReencode: encoderFallback })
  await rename(tmpPlain, plain)
  done += 1

  // 片头/封面都可能失败，字幕偏移只能按「真的接上了」算，不能按设置算
  let introApplied = false
  let coverApplied = false

  // 片头：HyperFrames 渲染标题卡，接在整片前面
  if (settings.intro === 'title') {
    report(offset + done, '正在渲染片头…')
    const introFile = join(dirs.work, 'intro.mp4')
    try {
      await renderIntroCard({
        title: item.title,
        subtitle: item.angle ? String(item.angle).slice(0, 24) : '',
        workDir: dirs.work,
        output: introFile,
        width: settings.width,
        height: settings.height,
        seconds: INTRO_SECONDS,
        signal,
      })
      const withIntro = join(dirs.renders, 'video-with-intro.mp4')
      await concatShots([introFile, plain], dirs.work, withIntro, { signal, forceReencode: encoderFallback })
      await rm(plain, { force: true }).catch(() => {})
      await copyFile(withIntro, plain)
      await rm(withIntro, { force: true }).catch(() => {})
      introApplied = true
    } catch (err) {
      // 用户点了停止就真的停：别把「取消」当成「片头失败」跳过继续往下跑
      if (signal.aborted) throw err
      // 片头是锦上添花，装不上就跳过，别让整片失败
      await store.mutate(draft => {
        const target = findItem(draft, itemId)
        target.log.push({ at: new Date().toISOString(), text: `片头跳过：${String(err.message).slice(0, 80)}` })
        return null
      })
    }
  }

  // 封面：作为成片第一帧，平台抓封面时就有图可抓
  const COVER_SECONDS = 0.8
  const usesCover = Boolean(item.cover?.path) && settings.coverInVideo !== false
  if (usesCover) {
    report(offset + done, '正在把封面放进片头…')
    try {
      const coverClip = join(dirs.work, 'cover-clip.mp4')
      await renderCoverClip(join(dirs.base, item.cover.path), coverClip, {
        width: settings.width, height: settings.height, seconds: COVER_SECONDS, signal,
      })
      const withCover = join(dirs.renders, 'video-with-cover.mp4')
      await concatShots([coverClip, plain], dirs.work, withCover, { signal, forceReencode: encoderFallback })
      await rm(plain, { force: true }).catch(() => {})
      await copyFile(withCover, plain)
      await rm(withCover, { force: true }).catch(() => {})
      coverApplied = true
    } catch (err) {
      // 同上：取消不能被「封面跳过」吞掉
      if (signal.aborted) throw err
      await store.mutate(draft => {
        const target = findItem(draft, itemId)
        target.log.push({ at: new Date().toISOString(), text: `封面跳过：${String(err.message).slice(0, 80)}` })
        return null
      })
    }
  }

  // 字幕时间轴必须和成片对齐：转场会缩短全片、片头会让全片后移
  const hasFade = settings.transition && settings.transition !== 'none'
  const timelineOpts = {
    overlap: hasFade ? 0.4 : 0,
    offset: (introApplied ? INTRO_SECONDS : 0) + (coverApplied ? COVER_SECONDS : 0),
  }
  const srtFile = join(dirs.renders, 'video.srt')
  const assFile = join(dirs.renders, 'video.ass')
  await writeFile(srtFile, buildSrt(item.segments, timelineOpts), 'utf8')
  await writeFile(assFile, buildAss(item.segments, {
    width: settings.width, height: settings.height, ...timelineOpts,
  }), 'utf8')

  let finalPath = plain
  if (settings.burnSubtitles) {
    report(offset + done, '正在压字幕…')
    const burned = join(dirs.renders, 'video-subtitled.mp4')
    // 先写 .tmp，成功再改名。中途被打断只会留下临时文件，
    // 不会把上一版能播的成片覆盖成半成品。
    const tmpBurned = `${burned}.tmp.mp4`
    try {
      await burnSubtitles(plain, assFile, tmpBurned, { signal })
      await rename(tmpBurned, burned)
      finalPath = burned
    } catch (err) {
      await rm(tmpBurned, { force: true }).catch(() => {})
      throw err
    }
    done += 1
  }

  // finalPath 已经是绝对路径，不能再按项目目录拼一次
  const secs = await probeDuration(finalPath)
  const rel = finalPath.startsWith(dirs.base) ? finalPath.slice(dirs.base.length + 1) : finalPath
  // 写回前最后确认一次：用户可能刚点「停止」，别把半成品记成当前成片
  if (signal.aborted) throw new Error('已停止')
  await store.mutate(draft => {
    const target = findItem(draft, itemId)
    // 启动快照和当前分段不一致（合成期间改过稿）：这版作废，别把旧结果写成「当前成片」
    const then = snapshot.map(row => row.id + '\u0000' + row.text)
    const now = target.segments.map(row => row.id + '\u0000' + row.text)
    if (now.length !== then.length || now.some((key, index) => key !== then[index])) {
      throw new Error('合成期间稿子被改过，这一版作废，请重新点「合成」')
    }
    target.render = {
      path: rel,
      secs: secs ? Math.round(secs * 10) / 10 : 0,
      subtitles: Boolean(settings.burnSubtitles),
      srtPath: srtFile.slice(dirs.base.length + 1),
      at: new Date().toISOString(),
    }
    target.log.push({ at: new Date().toISOString(), text: `合成：${Math.round(secs || 0)} 秒` })
    target.updatedAt = new Date().toISOString()
    return null
  })
  report(offset + done, '合成完成')
  return { path: rel, secs }
}

/**
 * 生成视频封面：底图（分镜图 / 参考图）+ 标题文字，输出平台竖版尺寸。
 * 标题走 textfile 传，避免中文和特殊符号在 drawtext 里转义出错。
 */
async function renderCoverImage(store, itemId, { ref, title, width = 1206, height = 2160, maxText = 40, layout = 'bottom', fontScale = 1 } = {}) {
  const state = await store.read()
  const item = findItem(state, itemId)
  const dirs = await store.ensureItemDirs(itemId)
  const text = String(title ?? item.title ?? '').trim().slice(0, maxText)
  if (!text) throw Object.assign(new Error('封面标题不能为空'), { status: 400 })

  // 解析底图：允许 segment:<id> / anchor:<id> / 直接给相对路径
  let basePath = null
  if (typeof ref === 'string' && ref.startsWith('segment:')) {
    const seg = item.segments.find(row => row.id === ref.slice(8))
    if (seg?.imagePath) basePath = join(dirs.base, seg.imagePath)
  } else if (typeof ref === 'string' && ref.startsWith('anchor:')) {
    const anchorId = ref.slice(7)
    const row = (item.anchors ?? []).find(a => a.id === anchorId)
    // 没定稿也没候选图时保持 null，走下面的 400 提示：join(base, '') 会得到项目目录本身
    const picked = row ? (row.approved || row.candidates?.[0] || '') : ''
    if (picked) basePath = join(dirs.base, picked)
  } else if (typeof ref === 'string' && ref && !ref.includes('..')) {
    basePath = join(dirs.base, ref)
  }
  if (basePath) {
    // ref 可能来自旧数据或被手改过的 state：只允许读项目目录里的文件，
    // 否则 ffmpeg 会把项目外的任意本地图片/视频当底图复制进 covers/
    const relBase = relative(resolve(dirs.base), resolve(basePath))
    if (!relBase || isAbsolute(relBase) || relBase === '..' || relBase.startsWith('..' + sep)) {
      throw Object.assign(new Error('底图路径无效'), { status: 400 })
    }
    const info = await stat(basePath).catch(() => null)
    // 目录（包括解析到项目根目录的情况）等于没有底图
    if (!info || info.isDirectory()) basePath = null
  }
  if (!basePath) throw Object.assign(new Error('没有可用的底图，先出图或定一张参考图'), { status: 400 })

  await mkdir(join(dirs.base, 'covers'), { recursive: true })
  const stamp = Date.now()
  const outName = `covers/cover-${stamp}.png`
  const outPath = join(dirs.base, outName)
  const textFile = join(dirs.work, `cover-title-${stamp}.txt`)
  // 宽高/字号在 try 里算，finally 之后还得用，所以先声明
  let w = 0
  let h = 0
  let scale = 1
  try {
    await writeFile(textFile, text, 'utf8')

    // 编码器要求宽高为偶数
    w = Math.round(width / 2) * 2
    h = Math.round(height / 2) * 2
    // 标题越长字号越小：20 字标题也要能压在 1080 宽的封面上
    const textLength = [...text].length
    scale = Math.min(1.6, Math.max(0.6, Number(fontScale) || 1))
    const fontSize = Math.max(24, Math.min(Math.round(w * 0.085 * scale), Math.floor((w * 0.78) / Math.max(4, textLength))))
    const band = Math.round(h * 0.42)
    const boxY = layout === 'top' ? 0 : h - band
    const textY = layout === 'top' ? String(Math.round(h * 0.14)) : `h-${Math.round(h * 0.2)}-text_h/2`
    const vf = [
      `scale=${w}:${h}:force_original_aspect_ratio=increase`,
      `crop=${w}:${h}`,
      // 文字区压一层暗带，保证白字在亮画面上也看得清
      `drawbox=x=0:y=${boxY}:w=${w}:h=${band}:color=black@0.45:t=fill`,
      `drawtext=fontfile=${escapeFilterPath(COVER_FONT)}:textfile=${escapeFilterPath(textFile)}:` +
        `fontsize=${fontSize}:fontcolor=white:borderw=${Math.max(2, Math.round(fontSize * 0.06))}:` +
        `bordercolor=black@0.85:x=(w-text_w)/2:y=${textY}`,
    ].join(',')

    await new Promise((resolve, reject) => {
      execFile(FFMPEG, ['-y', '-v', 'error', '-i', basePath, '-vf', vf, '-frames:v', '1', outPath],
        { timeout: 60_000 }, err => (err ? reject(new Error(`封面生成失败：${String(err.message).slice(0, 160)}`)) : resolve()))
    })
  } finally {
    // ffmpeg 失败（如底图是坏文件）时也要删掉临时标题文件，别在 work/ 里越积越多
    await rm(textFile, { force: true }).catch(() => {})
  }

  return { path: outName, title: text, width: w, height: h, layout: layout === 'top' ? 'top' : 'bottom', fontScale: scale, sourceRef: String(ref ?? '') }
}

/** 成片首帧用的封面：沿用原来的 9:16 竖版封面，存到 item.cover。 */
async function makeCover(store, itemId, { ref, title, width = 1206, height = 2160 } = {}) {
  const cover = await renderCoverImage(store, itemId, { ref, title, width, height })
  await store.mutate(draft => {
    const target = findItem(draft, itemId)
    target.cover = { ...cover, source: String(ref || ''), at: new Date().toISOString() }
    target.updatedAt = new Date().toISOString()
    return null
  })
  return { cover }
}

/**
 * 封面底图引用还能不能用：重写稿后旧 segment id 会失效，
 * 复用旧 sourceRef 前必须按当前项目状态重新解析一遍，否则生成封面直接 400。
 */
async function coverRefUsable(store, item, ref) {
  const value = typeof ref === 'string' ? ref.trim() : ''
  if (!value) return false
  let rel = ''
  if (value.startsWith('segment:')) {
    const seg = item.segments.find(row => row.id === value.slice(8))
    if (!seg?.imagePath) return false
    rel = seg.imagePath
  } else if (value.startsWith('anchor:')) {
    const row = (item.anchors ?? []).find(a => a.id === value.slice(7))
    const picked = row ? (row.approved || row.candidates?.[0] || '') : ''
    if (!picked) return false
    rel = picked
  } else {
    if (value.includes('..')) return false
    rel = value
  }
  const info = await stat(join(store.itemDir(item.id), rel)).catch(() => null)
  return Boolean(info?.isFile())
}

/** 小红书发布封面：3:4，单独存 publish.cover，不覆盖成片首帧那张。 */
async function makePublishCover(store, itemId, { title, ref, layout, fontScale, textSource } = {}) {
  const state = await store.read()
  const item = findItem(state, itemId)
  const publish = await store.readPublish(itemId)
  const existing = publish.cover ?? null
  const fallbackTitle = String(publish.variants?.xiaohongshu?.title ?? item.title ?? '').trim()
  const typedTitle = typeof title === 'string' ? title.trim() : ''
  const useTitle = typedTitle || String(existing?.title ?? '').trim() || fallbackTitle || item.title
  // 复用上次的底图前先确认它还有效（重写稿后旧 segment id 已失效），不行就回落到当前分镜/参考图
  let sourceRef = typeof ref === 'string' && ref.trim() ? ref.trim() : String(existing?.sourceRef ?? '').trim()
  if (sourceRef && !(await coverRefUsable(store, item, sourceRef))) sourceRef = ''
  if (!sourceRef) sourceRef = defaultPublishCoverRef(item)
  const cover = await renderCoverImage(store, itemId, {
    ref: sourceRef,
    title: useTitle,
    width: PLATFORMS.xiaohongshu.cover.width,
    height: PLATFORMS.xiaohongshu.cover.height,
    maxText: 20,
    layout: layout || existing?.layout || 'bottom',
    fontScale: fontScale || existing?.fontScale || 1,
  })
  const source = textSource || (typedTitle ? 'manual' : (existing?.textSource || 'auto'))
  await store.mutatePublish(itemId, draft => {
    draft.cover = {
      path: cover.path,
      title: cover.title,
      width: cover.width,
      height: cover.height,
      at: new Date().toISOString(),
      sourceRef: cover.sourceRef,
      layout: cover.layout,
      fontScale: cover.fontScale,
      textSource: source,
    }
    return null
  })
  return cover
}

/** 封面底图候选：分镜图、已定稿参考图、已有成片封面。 */
function coverSourceList(item) {
  const list = []
  let index = 0
  for (const seg of item?.segments ?? []) {
    if (!seg?.imagePath) continue
    index += 1
    list.push({ ref: 'segment:' + seg.id, label: '分镜 ' + index, path: seg.imagePath })
  }
  for (const row of item?.anchors ?? []) {
    const imagePath = row?.approved || row?.candidates?.[0]
    if (!imagePath) continue
    list.push({ ref: 'anchor:' + row.id, label: '参考 ' + String(row.name || '场景'), path: imagePath })
  }
  if (item?.cover?.path) list.push({ ref: item.cover.path, label: '成片封面', path: item.cover.path })
  return list.slice(0, 24)
}

/** 生成提案时的旧值快照，只取本次 scope 的字段。 */
function revisionBefore(publish, scope) {
  const variant = publish.variants?.xiaohongshu ?? {}
  const out = {}
  if (scope.includes('title')) out.title = String(variant.title ?? '')
  if (scope.includes('body')) out.body = String(variant.body ?? '')
  if (scope.includes('coverText')) out.coverText = String(publish.cover?.title ?? '')
  return out
}

/** 采用前检查用户有没有在提案生成后又改过这些字段。 */
function revisionMismatch(publish, revision) {
  const variant = publish.variants?.xiaohongshu ?? {}
  const before = revision.before ?? {}
  const hit = []
  if (revision.scope.includes('title') && String(variant.title ?? '') !== String(before.title ?? '')) hit.push('标题')
  if (revision.scope.includes('body') && String(variant.body ?? '') !== String(before.body ?? '')) hit.push('正文')
  if (revision.scope.includes('coverText') && String(publish.cover?.title ?? '') !== String(before.coverText ?? '')) hit.push('封面大字')
  return hit
}

/** 发布封面默认用第一张分镜图，其次定稿参考图，最后才退回已有封面。 */
function defaultPublishCoverRef(item) {
  const segment = (item.segments ?? []).find(row => row.imagePath)
  if (segment) return 'segment:' + segment.id
  const list = item.anchors ?? []
  const anchor = list.find(row => row.approved) ?? list[0]
  if (anchor) return 'anchor:' + anchor.id
  if (item.cover?.path) return item.cover.path
  return ''
}

/**
 * 把封面图做成一小段静帧视频，拼在成片最前面。
 * 平台多数默认取第一帧当封面候选，这样就不用再单独上传一张。
 */
async function renderCoverClip(coverPath, output, { width, height, seconds = 0.8, signal } = {}) {
  const w = Math.round(width / 2) * 2
  const h = Math.round(height / 2) * 2
  await new Promise((resolve, reject) => {
    execFile(FFMPEG, ['-y', '-v', 'error',
      '-loop', '1', '-framerate', '30', '-i', coverPath,
      '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-t', seconds.toFixed(2),
      '-vf', `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},format=yuv420p`,
      '-r', '30',
      ...encoderArgsSyncFallback(),
      '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2',
      '-shortest', '-movflags', '+faststart', output,
    ], { timeout: 120_000, signal }, err => (err ? reject(err) : resolve()))
  })
  return output
}

/** 拿渲染用的编码参数；这里只做封面，用不到硬件编码的特殊处理。 */
function encoderArgsSyncFallback() {
  try {
    return encoderArgsSync()
  } catch {
    return ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21']
  }
}

async function startRender(store, itemId) {
  const state = await store.read()
  const item = findItem(state, itemId)
  const missingAudio = item.segments.filter(row => !row.audioPath)
  const missingImage = item.segments.filter(row => !row.imagePath)
  if (!item.segments.length) throw Object.assign(new Error('还没有分段，先写稿'), { status: 400 })
  if (missingAudio.length) throw Object.assign(new Error(`还有 ${missingAudio.length} 段没配音，先配音再合成`), { status: 400 })
  if (missingImage.length) throw Object.assign(new Error(`还有 ${missingImage.length} 段没出图，先出图再合成`), { status: 400 })
  const settings = effectiveSettings(state, item)
  // 分母 = 每个镜头 + 拼接 + 可选的字幕压制
  const total = item.segments.length + 1 + (settings.burnSubtitles ? 1 : 0)
  return startTask(itemId, 'render', total, async ({ report, signal }) =>
    runRenderBody(store, itemId, report, signal))
}

/** 最后一步：缺的配音补上，然后直接合成，一次点完。 */
async function startFinish(store, secrets, itemId) {
  const state = await store.read()
  const item = findItem(state, itemId)
  if (!item.segments.length) throw Object.assign(new Error('还没有分段，先写稿'), { status: 400 })
  const missingImage = item.segments.filter(row => !row.imagePath)
  if (missingImage.length) {
    throw Object.assign(new Error(`还有 ${missingImage.length} 段没出图，先去「分镜图」出图`), { status: 400 })
  }
  const pending = item.segments.filter(row => !row.audioPath)
  const settings = effectiveSettings(state, item)
  // 分母 = 待配段数 + 每个镜头 + 拼接 + 可选的字幕压制
  const total = pending.length + item.segments.length + 1 + (settings.burnSubtitles ? 1 : 0)
  return startTask(itemId, 'finish', total, async ({ report, signal }) => {
    if (pending.length) {
      report(0, `先配音 ${pending.length} 段…`, total)
      await runVoiceBody(store, secrets, itemId, null, (done, message) => report(done, message, total), signal)
    }
    report(pending.length, '配音就绪，开始合成…', total)
    return runRenderBody(store, itemId, report, signal, pending.length)
  })
}

async function route(ctx, store, req, res) {
  const url = new URL(req.url || '/', 'http://local')
  const path = url.pathname.replace(/^\/sound-picture-desk\/?/, '')
  const method = req.method || 'GET'

  // 媒体文件：/media/<itemId>/<images|audio|renders|work>/<name>
  if ((method === 'GET' || method === 'HEAD') && path.startsWith('media/')) {
    const rest = path.slice('media/'.length)
    const parts = rest.split('/')
    if (parts.length < 3) return json(res, 404, { error: '路径不完整' })
    const [itemId, dir, ...nameParts] = parts
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(itemId) || !MEDIA_DIRS.has(dir)) return json(res, 404, { error: '路径无效' })
    // 客户端是逐段 encodeURIComponent 的：先解码再校验，中文文件名才能对上
    const name = decodeMediaName(nameParts)
    if (!name) return json(res, 404, { error: '路径无效' })
    const file = normalize(join(store.itemDir(itemId), dir, name))
    const base = normalize(store.itemDir(itemId))
    if (!file.startsWith(`${base}${sep}`)) return json(res, 404, { error: '路径无效' })
    return sendFile(req, res, file)
  }

  if (method === 'GET') {
    if (path === 'state') {
      const state = await store.read()
      const settings = settingsFor(state)
      const secrets = await store.readSecrets()
      const model = modelInfo(ctx)
      return json(res, 200, {
        items: state.items.filter(item => !item.deletedAt).map(itemView),
        settings: publicSettings(settings),
        secrets: { ttsKey: Boolean(secrets.ttsKey), imageKey: Boolean(secrets.imageKey) },
        voices: TTS_VOICES,
        styles: Object.entries(VISUAL_STYLES).map(([id, row]) => ({ id, label: row.label })),
        tones: Object.entries(TONES).map(([id, row]) => ({ id, label: row.label })),
        stages: STAGES.map(id => ({ id, label: STAGE_LABEL[id] })),
        imagePresets: IMAGE_PRESETS,
        ttsPresets: TTS_PRESETS,
        engines: await listEngines(ctx),
        encoder: await encoderInfo(),
        trashCount: (state.items ?? []).filter(item => item.deletedAt).length,
        trashDays: trashDays(state),
        cpuCores: cpus()?.length || 0,
        autoWorkers: autoRenderWorkers(),
        maxWorkers: maxParallelSessions(),
        chat: (state.chat ?? []).slice(-60),
        model: model ? { provider: model.provider, model: model.model } : null,
        home: dshHome(),
      })
    }
    if (path === 'progress') {
      return json(res, 200, { task: publicTask(url.searchParams.get('id') ?? '') })
    }
    if (path === 'probe') {
      // 整体自检：按当前已保存的设置，两条通道各真打一次
      const state = await store.read()
      const settings = settingsFor(state)
      const secrets = await store.readSecrets()
      const [image, tts] = await Promise.all([
        testImageChannel({
          endpoint: settings.imageEndpoint,
          model: settings.imageModel,
          key: secrets.imageKey,
        }),
        testTtsChannel({
          endpoint: settings.ttsEndpoint,
          model: settings.ttsModel,
          key: secrets.ttsKey,
          voice: settings.voice,
        }),
      ])
      return json(res, 200, { image, tts, ffmpeg: await probeFfmpeg() })
    }
    if (path === 'engines') {
      // 把 DSH 里已接的提供方列出来，给可能的模型选择用
      const llm = ctx.get('llm')
      const providers = llm ? await llm.listProviders() : []
      const settled = await Promise.allSettled(providers.map(async p => ({
        provider: p.id,
        name: p.name,
        models: (await llm.listModels(p.id)).map(m => ({ id: m.id, name: m.name || m.id })),
      })))
      return json(res, 200, { providers: settled.filter(r => r.status === 'fulfilled').map(r => r.value).filter(p => p.models.length) })
    }
    return json(res, 404, { error: '接口不存在' })
  }

  if (method !== 'POST') return json(res, 405, { error: '不支持的方法' })

  // 所有写操作都拒绝跨站请求
  const site = req.headers['sec-fetch-site']
  if (site && site !== 'same-origin' && site !== 'none') return json(res, 403, { error: '拒绝跨站请求' })

  const body = await readJson(req)
  switch (path) {
    case 'export': {
      // 导出成片到用户指定的目录，文件名用项目标题
      const id = String(body.id ?? '')
      const state = await store.read()
      const item = findItem(state, id)
      if (!item.render?.path) throw Object.assign(new Error('还没有成片，先合成'), { status: 400 })
      const dir = String(body.dir ?? '').trim() || join(homedir(), 'Downloads')
      await mkdir(dir, { recursive: true })
      const safeName = String(item.title || id).replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 60) || id
      const videoOut = join(dir, `${safeName}.mp4`)
      await copyFile(join(store.itemDir(id), item.render.path), videoOut)
      let srtOut = null
      if (item.render.srtPath) {
        srtOut = join(dir, `${safeName}.srt`)
        await copyFile(join(store.itemDir(id), item.render.srtPath), srtOut).catch(() => { srtOut = null })
      }
      return json(res, 200, { video: videoOut, srt: srtOut, dir })
    }
    case 'voice-sample-one': {
      // 按需合成一个音色：用户点哪个听哪个，不必先等九个全出来
      const id = String(body.id ?? '')
      const voice = String(body.voice ?? '')
      const state = await store.read()
      const item = findItem(state, id)
      if (!TTS_VOICES.some(row => row.id === voice)) {
        throw Object.assign(new Error('没有这个音色'), { status: 400 })
      }
      const secrets = await store.readSecrets()
      if (!secrets.ttsKey) throw Object.assign(new Error('还没有配置音频密钥'), { status: 400 })
      const settings = effectiveSettings(state, item)
      const dirs = await store.ensureItemDirs(id)
      await mkdir(join(dirs.base, 'samples'), { recursive: true })
      const sample = String(item.segments[0]?.text || '话说这一桩旧事，得从头讲起，藏着一桩没人愿意提的往事。').slice(0, FIFTEEN_SECONDS_CHARS)
      const buffer = await synthesize({
        endpoint: settings.ttsEndpoint,
        model: settings.ttsModel,
        key: secrets.ttsKey,
        voice,
        text: sample,
      })
      const rel = `samples/voice-${voice.replace(/[^\w\u4e00-\u9fa5-]/g, '_')}.mp3`
      await writeFile(join(dirs.base, rel), buffer)
      await store.mutate(draft => {
        const target = findItem(draft, id)
        target.samples = target.samples ?? {}
        target.samples.voice = { ...(target.samples.voice ?? {}), [voice]: rel }
        return null
      })
      return json(res, 200, { voice, path: rel })
    }
    case 'anchors/extract': {
      assertNotBusy(String(body.id ?? ''))
      const result = await extractAnchors(ctx, store, String(body.id ?? ''))
      return json(res, 200, result)
    }
    case 'anchors/draw': {
      const secrets = await store.readSecrets()
      await drawAnchor(store, secrets, String(body.id ?? ''), String(body.anchorId ?? ''), body.instruction)
      return json(res, 200, { task: publicTask(String(body.id ?? '')) })
    }
    case 'anchors/approve': {
      // 定稿：记下选中的那张，同时把它绑定的描述固化
      const id = String(body.id ?? '')
      const anchorId = String(body.anchorId ?? '')
      const candidate = String(body.candidate ?? '')
      assertNotBusy(id)
      const { state } = await store.mutate(draft => {
        const row = findItem(draft, id)
        const hit = (row.anchors ?? []).find(a => a.id === anchorId)
        if (!hit) throw Object.assign(new Error('找不到这个参考条目'), { status: 404 })
        // 只能从这条已生成的候选里选：approved 会被封面渲染当文件路径用，不能收任意值
        if (candidate && !(hit.candidates ?? []).includes(candidate)) {
          throw Object.assign(new Error('只能选这个参考条目已生成的候选图'), { status: 400 })
        }
        hit.approved = candidate || (hit.candidates ?? []).slice(-1)[0] || null
        hit.at = new Date().toISOString()
        return null
      })
      return json(res, 200, { anchors: findItem(state, id).anchors ?? [] })
    }
    case 'anchors/remove': {
      const id = String(body.id ?? '')
      assertNotBusy(id)
      const { state } = await store.mutate(draft => {
        const row = findItem(draft, id)
        row.anchors = (row.anchors ?? []).filter(a => a.id !== String(body.anchorId ?? ''))
        return null
      })
      return json(res, 200, { anchors: findItem(state, id).anchors ?? [] })
    }
    case 'anchors/save': {
      // 直接改名字/描述
      const id = String(body.id ?? '')
      assertNotBusy(id)
      const { state } = await store.mutate(draft => {
        const row = findItem(draft, id)
        const hit = (row.anchors ?? []).find(a => a.id === String(body.anchorId ?? ''))
        if (hit) {
          if (typeof body.name === 'string' && body.name.trim()) hit.name = body.name.trim().slice(0, 30)
          if (typeof body.desc === 'string' && body.desc.trim()) hit.desc = body.desc.trim().slice(0, 600)
        }
        return null
      })
      return json(res, 200, { anchors: findItem(state, id).anchors ?? [] })
    }
    case 'reference-inspect': {
      return json(res, 200, await inspectReference(String(body.url ?? '')))
    }
    case 'item-raw': {
      // 原始材料可能有 20 万字，不能塞进每 1.5 秒轮询的 /state，单独按项目拉一次
      const id = String(body.id ?? '')
      const state = await store.read()
      const item = findItem(state, id)
      return json(res, 200, { rawText: item.rawText ?? '' })
    }
    case 'item-info': {
      // 选题页要能改题材与材料，否则「选题」这一页只是个摆设
      const id = String(body.id ?? '')
      assertNotBusy(id)
      const { state } = await store.mutate(draft => {
        const target = findItem(draft, id)
        if (typeof body.topic === 'string' && body.topic.trim()) target.topic = body.topic.trim().slice(0, 200)
        if (typeof body.rawText === 'string') target.rawText = body.rawText.slice(0, 200_000)
        if (Number(body.targetMinutes)) target.targetMinutes = Math.max(1, Math.min(30, Number(body.targetMinutes)))
        if (typeof body.title === 'string' && body.title.trim()) target.title = body.title.trim().slice(0, 60)
        if (Array.isArray(body.references)) target.references = body.references.slice(0, 12)
        if (body.model === null) target.model = null
        else if (body.model && typeof body.model.provider === 'string' && typeof body.model.model === 'string') {
          target.model = { provider: body.model.provider, model: body.model.model }
        }
        target.updatedAt = new Date().toISOString()
        return null
      })
      return json(res, 200, { item: itemView(findItem(state, id)) })
    }
    case 'item-settings': {
      // 只存创作相关的那几项，连接类配置仍走全局设置
      const id = String(body.id ?? '')
      assertNotBusy(id)
      const patch = body.settings && typeof body.settings === 'object' ? body.settings : {}
      const allowed = ['visualStyle', 'voice', 'tone', 'width', 'height', 'segmentSeconds', 'imageWidth', 'imageHeight', 'kenBurns', 'burnSubtitles', 'motion', 'grade', 'transition', 'intro', 'renderWorkers', 'coverInVideo']
      const clean = {}
      for (const key of allowed) {
        if (!(key in patch)) continue
        if (typeof DEFAULT_SETTINGS[key] === 'number') {
          const n = clampNumberSetting(key, patch[key])
          if (n !== null) clean[key] = n
        } else if (typeof DEFAULT_SETTINGS[key] === 'boolean') {
          clean[key] = Boolean(patch[key])
        } else if (typeof patch[key] === 'string') {
          clean[key] = patch[key].slice(0, 100)
        }
      }
      const { state } = await store.mutate(draft => {
        const target = findItem(draft, id)
        target.settings = { ...(target.settings ?? {}), ...clean }
        // 装配参数变了，旧成片就不代表当前设置，阶段回退到「分镜图」
        if (Object.keys(clean).some(key => RENDER_SETTING_KEYS.has(key))) target.render = null
        target.updatedAt = new Date().toISOString()
        return null
      })
      return json(res, 200, { item: itemView(findItem(state, id)) })
    }
    case 'style-samples': {
      const secrets = await store.readSecrets()
      await startStyleSamples(store, secrets, String(body.id ?? ''))
      return json(res, 200, { task: publicTask(String(body.id ?? '')) })
    }
    case 'voice-samples': {
      const secrets = await store.readSecrets()
      await startVoiceSamples(store, secrets, String(body.id ?? ''))
      return json(res, 200, { task: publicTask(String(body.id ?? '')) })
    }
    case 'chat': {
      const itemId = typeof body.itemId === 'string' ? body.itemId : undefined
      if (itemId) assertNotBusy(itemId)
      const result = await chatTurn(ctx, store, {
        itemId,
        message: body.message,
      })
      return json(res, 200, result)
    }
    case 'chat/clear': {
      const { state } = await store.mutate(draft => { draft.chat = []; return null })
      return json(res, 200, { chat: state.chat ?? [] })
    }
    case 'test': {
      // 检测用的是表单里当前的值，用户可以先测再存
      const state = await store.read()
      const settings = settingsFor(state)
      const secrets = await store.readSecrets()
      const target = String(body.target ?? '')
      if (target === 'image') {
        const result = await testImageChannel({
          endpoint: String(body.endpoint ?? settings.imageEndpoint),
          model: String(body.model ?? settings.imageModel),
          // 表单里没填新 key 就用已存的
          key: String(body.key ?? '').trim() || secrets.imageKey,
        })
        return json(res, 200, result)
      }
      if (target === 'tts') {
        const result = await testTtsChannel({
          endpoint: String(body.endpoint ?? settings.ttsEndpoint),
          model: String(body.model ?? settings.ttsModel),
          key: String(body.key ?? '').trim() || secrets.ttsKey,
          voice: String(body.voice ?? settings.voice),
        })
        return json(res, 200, result)
      }
      return json(res, 400, { ok: false, detail: 'target 只能是 image 或 tts' })
    }
    case 'create': {
      const { id, state } = await createItem(store, body)
      return json(res, 200, { id, items: state.items.map(itemView) })
    }
    case 'remove': {
      // 软删除：只打时间戳，文件和记录都留着，方便回收站恢复
      const id = String(body.id ?? '')
      const conflict = busyConflictError(id, '这个项目正在跑任务，等它结束或先点「停止」再删')
      if (conflict) throw conflict
      const state = await store.read()
      findItem(state, id)
      await store.mutate(draft => {
        const target = findItem(draft, id)
        target.deletedAt = new Date().toISOString()
        return null
      })
      return json(res, 200, { trashed: id })
    }
    case 'cover': {
      const id = String(body.id ?? '')
      // 出封面会读写项目文件，和后台任务并发会互相覆盖
      assertNotBusy(id)
      const result = await makeCover(store, id, {
        ref: body.ref,
        title: body.title,
        width: body.width,
        height: body.height,
      })
      return json(res, 200, result)
    }
    case 'publish/read': {
      const id = String(body.id ?? '')
      const state = await store.read()
      findItem(state, id)
      return json(res, 200, { publish: await publishView(store, state, id) })
    }
    case 'publish/generate': {
      const id = String(body.id ?? '')
      const state = await store.read()
      const item = findItem(state, id)
      if (!item.render?.path) throw Object.assign(new Error('还没有成片，先合成'), { status: 400 })
      const existing = await store.readPublish(id)
      const targets = normalizeTargets(body.targets ?? existing.targets)
      const needCover = targets.includes('xiaohongshu') && !existing.cover?.path
      const task = startTask(id, 'publish-copy', needCover ? 2 : 1, async ({ report, signal }) => {
        report(0, '正在写' + targets.map(platformId => PLATFORMS[platformId].label).join(' / ') + '文案…')
        const result = await generateCopyVariants(ctx, {
          item,
          targets,
          route: item.model ?? null,
          signal,
          onProgress: progress => {
            const written = Number(progress?.text) || 0
            const thought = Number(progress?.reasoning) || 0
            report(0, '正在写文案（已写 ' + written + ' 字' + (thought ? '，思考 ' + thought + ' 字' : '') + '）')
          },
        })
        const generated = result.variants ?? {}
        const generatedEmpty = targets.filter(platformId => variantIsEmpty(platformId, generated[platformId] ?? {}))
        if (generatedEmpty.length === targets.length) {
          throw new Error('模型没有返回可用的文案，点「一键生成」再试一次')
        }
        await store.mutatePublish(id, draft => {
          // 单平台重新生成只覆盖这个平台，不改发布范围；模型漏掉的平台保留旧文案
          draft.targets = [...PLATFORM_ORDER]
          for (const platformId of targets) {
            const next = generated[platformId] ?? {}
            if (!variantIsEmpty(platformId, next)) {
              draft.variants[platformId] = sanitizeVariant(platformId, next)
            }
          }
          return null
        })
        if (needCover) {
          report(1, '正在生成小红书封面…')
          await makePublishCover(store, id, {}).catch(() => null)
        }
        const keptLabel = generatedEmpty.map(platformId => PLATFORMS[platformId].label).join(' / ')
        const baseText = result.issues?.length
          ? '文案有 ' + result.issues.length + ' 处超限，请在页面上改'
          : '完成'
        report(needCover ? 2 : 1, baseText + (keptLabel ? '；' + keptLabel + ' 没生成，保留原文案' : ''))
        return { model: result.model, issues: result.issues ?? [], keptPlatforms: generatedEmpty }
      })
      return json(res, 200, { task: publicTask(id) })
    }
    case 'publish/save': {
      const id = String(body.id ?? '')
      const state = await store.read()
      findItem(state, id)
      // V1 界面固定两平台都进发布包，忽略客户端传来的 targets，避免旧数据/旧 bundle 把它改窄
      const variants = body.variants && typeof body.variants === 'object' ? body.variants : null
      await store.mutatePublish(id, draft => {
        draft.targets = [...PLATFORM_ORDER]
        if (variants) {
          for (const platformId of PLATFORM_ORDER) {
            if (!(platformId in variants)) continue
            draft.variants[platformId] = sanitizeVariant(platformId, { ...draft.variants[platformId], ...variants[platformId] })
          }
        }
        return null
      })
      return json(res, 200, { publish: await publishView(store, state, id) })
    }
    case 'publish/revise': {
      const id = String(body.id ?? '')
      const state = await store.read()
      const item = findItem(state, id)
      const publish = await store.readPublish(id)
      const allowed = ['title', 'body', 'coverText']
      const scope = [...new Set((Array.isArray(body.scope) ? body.scope : []).map(String).filter(id => allowed.includes(id)))]
      if (!scope.length) throw Object.assign(new Error('至少选择一个要修改的字段'), { status: 400 })
      const feedback = String(body.feedback ?? '').trim().slice(0, 500)
      if (feedback.length < 2) throw Object.assign(new Error('修改意见太短，至少写两个字'), { status: 400 })
      const conflict = busyConflictError(id, '正在跑任务，等结束再改')
      if (conflict) throw conflict
      // 新意见一提交就作废旧提案，避免旧提案弹窗和新任务同时存在
      await store.mutatePublish(id, draft => {
        draft.revisions = (draft.revisions ?? []).map(row => (row.status === 'proposed' ? { ...row, status: 'rejected' } : row))
        return null
      })
      const task = startTask(id, 'publish-revise', 1, async ({ report, signal }) => {
        report(0, '正在按意见修改' + scope.map(id => ({ title: '标题', body: '正文', coverText: '封面大字' }[id])).join(' / ') + '…')
        const result = await reviseCopy(ctx, {
          item,
          publish,
          scope,
          feedback,
          route: item.model ?? null,
          signal,
        }).catch(err => {
          const raw = String(err?.message ?? '') + ' ' + String(err?.cause?.code ?? '')
          if (/ETIMEDOUT|ECONNRESET|ECONNREFUSED|fetch failed|Request timed out|network/i.test(raw)) {
            throw new Error('模型请求超时（网络或模型通道不稳），已自动重试仍失败。稍后再点一次「提意见」；如果一直超时，去设置里换一个模型。')
          }
          throw err
        })
        const revision = {
          id: newId('rev'),
          at: new Date().toISOString(),
          scope,
          feedback,
          status: 'proposed',
          before: revisionBefore(publish, scope),
          after: result.after,
          model: result.model,
          note: result.note,
          appliedAt: null,
        }
        await store.mutatePublish(id, draft => {
          draft.revisions.push(revision)
          draft.revisions = draft.revisions.slice(-30)
          return null
        })
        report(1, '改好了，等你采用')
        return { revisionId: revision.id }
      })
      return json(res, 200, { task: publicTask(id) })
    }
    case 'publish/revise/apply': {
      const id = String(body.id ?? '')
      const revisionId = String(body.revisionId ?? '')
      const state = await store.read()
      findItem(state, id)
      const conflict = busyConflictError(id, '正在跑任务，等结束再采用')
      if (conflict) throw conflict
      const publish = await store.readPublish(id)
      const revision = (publish.revisions ?? []).find(row => row.id === revisionId)
      if (!revision) throw Object.assign(new Error('找不到这份修改提案'), { status: 404 })
      if (revision.status !== 'proposed') throw Object.assign(new Error('这份提案已经处理过了'), { status: 409 })
      const changed = revisionMismatch(publish, revision)
      if (changed.length && !body.force) {
        throw Object.assign(new Error('当前' + changed.join('、') + '已经改过，先确认是否仍采用这份提案'), { status: 409, code: 'changed' })
      }
      let renderedCover = null
      if (revision.scope.includes('coverText')) {
        const candidates = revision.after.coverTexts ?? []
        const index = Math.max(0, Math.min(candidates.length - 1, Number(body.coverTextIndex) || 0))
        const text = String(candidates[index] ?? '').trim()
        if (!text) throw Object.assign(new Error('没有可用的封面大字候选'), { status: 400 })
        renderedCover = await makePublishCover(store, id, { title: text, textSource: 'manual' })
      }
      await store.mutatePublish(id, draft => {
        if (revision.scope.includes('title') || revision.scope.includes('body')) {
          const next = { ...draft.variants.xiaohongshu }
          if (revision.scope.includes('title')) next.title = revision.after.title ?? ''
          if (revision.scope.includes('body')) next.body = revision.after.body ?? ''
          draft.variants.xiaohongshu = sanitizeVariant('xiaohongshu', next)
        }
        const target = (draft.revisions ?? []).find(row => row.id === revisionId)
        if (target) {
          target.status = 'accepted'
          target.appliedAt = new Date().toISOString()
          if (renderedCover) target.appliedCoverText = renderedCover.title
        }
        return null
      })
      return json(res, 200, { publish: await publishView(store, state, id) })
    }
    case 'publish/revise/discard': {
      const id = String(body.id ?? '')
      const revisionId = String(body.revisionId ?? '')
      const state = await store.read()
      findItem(state, id)
      await store.mutatePublish(id, draft => {
        const target = (draft.revisions ?? []).find(row => row.id === revisionId)
        if (target && target.status === 'proposed') target.status = 'rejected'
        return null
      })
      return json(res, 200, { publish: await publishView(store, state, id) })
    }
    case 'publish/revise/revert': {
      const id = String(body.id ?? '')
      const revisionId = String(body.revisionId ?? '')
      const state = await store.read()
      findItem(state, id)
      const conflict = busyConflictError(id, '正在跑任务，等结束再回滚')
      if (conflict) throw conflict
      const publish = await store.readPublish(id)
      const revision = (publish.revisions ?? []).find(row => row.id === revisionId)
      if (!revision) throw Object.assign(new Error('找不到这份历史提案'), { status: 404 })
      if (revision.status !== 'accepted') throw Object.assign(new Error('只有已采用的提案可以回滚'), { status: 409 })
      if (revision.scope.includes('coverText') && revision.before.coverText) {
        await makePublishCover(store, id, { title: revision.before.coverText, textSource: 'manual' })
      }
      await store.mutatePublish(id, draft => {
        const next = { ...draft.variants.xiaohongshu }
        if (revision.scope.includes('title')) next.title = revision.before.title ?? ''
        if (revision.scope.includes('body')) next.body = revision.before.body ?? ''
        draft.variants.xiaohongshu = sanitizeVariant('xiaohongshu', next)
        const target = (draft.revisions ?? []).find(row => row.id === revisionId)
        if (target) target.status = 'reverted'
        return null
      })
      return json(res, 200, { publish: await publishView(store, state, id) })
    }
    case 'publish/cover': {
      const id = String(body.id ?? '')
      const state = await store.read()
      findItem(state, id)
      const conflict = busyConflictError(id, '正在跑任务，等结束再生成封面')
      if (conflict) throw conflict
      await makePublishCover(store, id, {
        title: body.title,
        ref: body.ref,
        layout: body.layout,
        fontScale: body.fontScale,
        textSource: body.textSource,
      })
      return json(res, 200, { publish: await publishView(store, state, id) })
    }
    case 'publish/export': {
      const id = String(body.id ?? '')
      const state = await store.read()
      const item = findItem(state, id)
      if (!item.render?.path) throw Object.assign(new Error('还没有成片，先合成'), { status: 400 })
      const conflict = busyConflictError(id, '正在跑任务，等结束再导出')
      if (conflict) throw conflict
      const targets = [...PLATFORM_ORDER]
      await store.mutatePublish(id, draft => { draft.targets = targets; return null })
      let fresh = await store.readPublish(id)
      // 小红书封面在发布包里是独立文件；没有就顺手补一张，补不出来再交给检查项提示
      let coverAbs = fresh.cover?.path ? join(store.itemDir(id), fresh.cover.path) : ''
      if (targets.includes('xiaohongshu') && !(coverAbs && await stat(coverAbs).catch(() => null))) {
        await makePublishCover(store, id, {}).catch(() => null)
        fresh = await store.readPublish(id)
        coverAbs = fresh.cover?.path ? join(store.itemDir(id), fresh.cover.path) : ''
      }
      const video = await videoInfo(store, state, item)
      const checks = publishChecks(fresh, targets, video, Boolean(coverAbs && await stat(coverAbs).catch(() => null)))
      const blocking = checks.filter(check => check.state === 'error')
      if (!video) throw Object.assign(new Error('成片文件不见了，重新合成一次'), { status: 400 })
      if (blocking.length) {
        const first = blocking[0]
        throw Object.assign(new Error('还有 ' + blocking.length + ' 项超过平台限制，先改文案：' + first.label + ' ' + first.detail), { status: 400 })
      }
      const exportItem = video.secs && video.secs !== item.render?.secs
        ? { ...item, render: { ...item.render, secs: video.secs } }
        : item
      const result = await buildExport({
        baseDir: store.itemDir(id),
        item: exportItem,
        publish: fresh,
        targets,
        ruleVersion: RULE_VERSION,
      })
      await store.mutatePublish(id, draft => {
        draft.exports = [...(draft.exports ?? []), {
          at: new Date().toISOString(),
          stamp: result.stamp,
          dir: result.relDir,
          targets,
        }].slice(-20)
        return null
      })
      let copied = null
      const dir = String(body.dir ?? '').trim()
      if (dir) {
        try {
          await mkdir(dir, { recursive: true })
          const dest = join(dir, result.folderName)
          const relToSource = relative(resolve(result.absDir), resolve(dest))
          if (!relToSource.startsWith('..')) {
            throw Object.assign(new Error('导出目录不能放在发布包自己里面'), { status: 400 })
          }
          await cp(result.absDir, dest, { recursive: true })
          copied = dest
        } catch (err) {
          copied = { error: String(err.message || err).slice(0, 200) }
        }
      }
      return json(res, 200, {
        export: {
          stamp: result.stamp,
          relDir: result.relDir,
          folderName: result.folderName,
          files: result.files.map(file => ({ path: file.path, name: file.name, bytes: file.bytes })),
          copied,
        },
        publish: await publishView(store, state, id),
      })
    }
    case 'publish/record': {
      const id = String(body.id ?? '')
      const platformId = String(body.platform ?? '')
      if (!PLATFORMS[platformId]) throw Object.assign(new Error('不支持的平台'), { status: 400 })
      const state = await store.read()
      findItem(state, id)
      const status = body.status === 'published' ? 'published' : 'pending'
      await store.mutatePublish(id, draft => {
        const rest = (draft.records ?? []).filter(row => row.platform !== platformId)
        if (status === 'published' || body.url || body.note) {
          rest.push({
            platform: platformId,
            status,
            url: String(body.url ?? ''),
            note: String(body.note ?? ''),
            at: new Date().toISOString(),
            metrics: body.metrics && typeof body.metrics === 'object' ? body.metrics : {},
          })
        }
        draft.records = rest
        return null
      })
      return json(res, 200, { publish: await publishView(store, state, id) })
    }
    case 'trash-list': {
      const state = await store.read()
      const days = trashDays(state)
      const rows = await Promise.all((state.items ?? [])
        .filter(item => item.deletedAt)
        .sort((a, b) => String(b.deletedAt).localeCompare(String(a.deletedAt)))
        .map(async item => ({
          id: item.id,
          title: item.title,
          deletedAt: item.deletedAt,
          expiresAt: new Date(Date.parse(item.deletedAt) + days * 86400_000).toISOString(),
          segments: (item.segments ?? []).length,
          hasRender: Boolean(item.render?.path),
        })))
      return json(res, 200, { items: rows, days })
    }
    case 'trash-restore': {
      const id = String(body.id ?? '')
      await store.mutate(draft => {
        const target = draft.items.find(row => row.id === id)
        if (!target) throw Object.assign(new Error('回收站里没有这一项'), { status: 404 })
        delete target.deletedAt
        return null
      })
      return json(res, 200, { restored: id })
    }
    case 'trash-purge': {
      // 单个彻底删除，或传 all 清空
      const id = String(body.id ?? '')
      const state = await store.read()
      const victims = body.all
        ? (state.items ?? []).filter(item => item.deletedAt)
        : (state.items ?? []).filter(item => item.id === id && item.deletedAt)
      if (!victims.length) throw Object.assign(new Error('没有可删除的项'), { status: 404 })
      await store.mutate(draft => {
        const ids = new Set(victims.map(item => item.id))
        draft.items = draft.items.filter(row => !ids.has(row.id))
        return null
      })
      for (const item of victims) {
        await rm(store.itemDir(item.id), { recursive: true, force: true }).catch(() => {})
      }
      return json(res, 200, { purged: victims.map(item => item.id) })
    }
    case 'script': {
      const id = String(body.id ?? '')
      await store.read()
      const secrets = await store.readSecrets()
      const task = await startScript(ctx, store, secrets, id)
      return json(res, 200, { task: publicTask(id) ?? { kind: 'script', running: true }, started: Boolean(task) })
    }
    case 'segments': {
      // 手改稿：只动文字和画面提示词，已有音画保留（改了文字会提示重新配音）
      const id = String(body.id ?? '')
      assertNotBusy(id)

      // 单段更新：客户端只提交自己这一段。两段连着改时不会用旧快照覆盖前一段。
      if (body.segment && typeof body.segment === 'object') {
        const segId = String(body.segment.id ?? '')
        if (!segId) throw Object.assign(new Error('缺少分段 id'), { status: 400 })
        const { state } = await store.mutate(draft => {
          const target = findItem(draft, id)
          const seg = target.segments.find(row => row.id === segId)
          if (!seg) throw Object.assign(new Error('找不到这一段'), { status: 404 })
          if (typeof body.segment.text === 'string') {
            const text = body.segment.text.trim()
            if (!text) throw Object.assign(new Error('旁白不能为空'), { status: 400 })
            if (text !== seg.text) {
              seg.text = text
              seg.audioPath = null
              seg.audioSecs = 0
            }
          }
          if (typeof body.segment.imagePrompt === 'string') {
            seg.imagePrompt = body.segment.imagePrompt.trim()
          }
          seg.error = null
          target.render = null
          target.updatedAt = new Date().toISOString()
          return null
        })
        return json(res, 200, { item: itemView(findItem(state, id)) })
      }

      const rows = Array.isArray(body.segments) ? body.segments : []
      const { state } = await store.mutate(draft => {
        const target = findItem(draft, id)
        const byId = new Map(target.segments.map(row => [row.id, row]))
        const next = []
        for (const row of rows) {
          const text = String(row?.text ?? '').trim()
          if (!text) continue
          const existing = byId.get(row.id)
          const base = existing ?? { id: newId('seg'), audioPath: null, audioSecs: 0, imagePath: null }
          const textChanged = base.text !== text
          next.push({
            ...base,
            id: base.id,
            text,
            imagePrompt: String(row.imagePrompt ?? base.imagePrompt ?? '').trim(),
            // 文字变了，旧音频就作废；画面提示词变了，旧图不一定对，但先留着等用户决定
            ...(textChanged ? { audioPath: null, audioSecs: 0 } : {}),
            error: null,
          })
        }
        next.forEach((row, index) => { row.idx = index })
        target.segments = next
        target.render = null
        target.updatedAt = new Date().toISOString()
        return null
      })
      const id2 = String(body.id ?? '')
      return json(res, 200, { item: itemView(findItem(state, id2)) })
    }
    case 'tts': {
      const id = String(body.id ?? '')
      const secrets = await store.readSecrets()
      const only = Array.isArray(body.only) ? body.only.map(String) : null
      await startVoice(store, secrets, id, only)
      return json(res, 200, { task: publicTask(id) })
    }
    case 'image': {
      const id = String(body.id ?? '')
      const secrets = await store.readSecrets()
      const only = Array.isArray(body.only) ? body.only.map(String) : null
      await startImages(store, secrets, id, only, typeof body.note === 'string' ? body.note.slice(0, 300) : '')
      return json(res, 200, { task: publicTask(id) })
    }
    case 'finish': {
      // 最后一步：缺的音补上、然后合成，一次点完
      const id = String(body.id ?? '')
      const conflict = busyConflictError(id, '这个项目正在跑任务，等它结束')
      if (conflict) throw conflict
      const secrets = await store.readSecrets()
      await startFinish(store, secrets, id)
      return json(res, 200, { task: publicTask(id) })
    }
    case 'render': {
      const id = String(body.id ?? '')
      await startRender(store, id)
      return json(res, 200, { task: publicTask(id) })
    }
    case 'cancel': {
      const id = String(body.id ?? '')
      const cancelled = cancelTask(id)
      if (cancelled) return json(res, 200, { cancelled })
      // 任务在另一个 Host 进程里跑：本窗口没有它的句柄，只能去那个窗口停
      if (isTaskLocked(id)) {
        return json(res, 200, { cancelled: false, lockedByOther: true, message: '任务在另一个窗口里跑，本窗口停不了；去那个窗口点停止' })
      }
      return json(res, 200, { cancelled: false })
    }
    case 'settings': {
      const patch = body.settings && typeof body.settings === 'object' ? body.settings : {}
      const allowed = Object.keys(DEFAULT_SETTINGS)
      const clean = {}
      for (const key of allowed) {
        if (!(key in patch)) continue
        const value = patch[key]
        if (typeof DEFAULT_SETTINGS[key] === 'number') {
          const n = clampNumberSetting(key, value)
          if (n !== null) clean[key] = n
        } else if (typeof DEFAULT_SETTINGS[key] === 'boolean') {
          clean[key] = Boolean(value)
        } else if (typeof value === 'string') {
          clean[key] = value.slice(0, 500)
        }
      }
      const { state } = await store.mutate(draft => {
        draft.settings = { ...draft.settings, ...clean }
        return null
      })
      return json(res, 200, { settings: publicSettings(settingsFor(state)) })
    }
    case 'secrets': {
      // 只写不读：接口永远不回显密钥本身
      const patch = {}
      if (typeof body.ttsKey === 'string') patch.ttsKey = body.ttsKey.trim()
      if (typeof body.imageKey === 'string') patch.imageKey = body.imageKey.trim()
      if (!Object.keys(patch).length) return json(res, 400, { error: '没有要保存的密钥' })
      const secrets = await store.writeSecrets(patch)
      return json(res, 200, { secrets: { ttsKey: Boolean(secrets.ttsKey), imageKey: Boolean(secrets.imageKey) } })
    }
    default:
      return json(res, 404, { error: '接口不存在' })
  }
}

/** 把 DSH 里已接的提供方和模型列出来，写稿时可以换。 */
async function listEngines(ctx) {
  const llm = ctx.get('llm')
  if (!llm) return []
  const providers = await llm.listProviders()
  const settled = await Promise.allSettled(providers.map(async provider => ({
    provider: provider.id,
    name: provider.name || provider.id,
    models: (await llm.listModels(provider.id)).map(row => ({ id: row.id, name: row.name || row.id })),
  })))
  return settled.filter(row => row.status === 'fulfilled').map(row => row.value).filter(row => row.models.length)
}

async function probeFfmpeg() {
  return new Promise(resolve => {
    execFile(FFMPEG, ['-version'], { timeout: 5000 }, (err, stdout) => {
      if (err) return resolve({ ok: false, detail: '找不到 ffmpeg' })
      const line = String(stdout).split('\n')[0] ?? ''
      resolve({ ok: true, detail: line.replace('ffmpeg version ', 'ffmpeg ') })
    })
  })
}

/**
 * Web 服务不会替插件路由鉴权，所以每个请求都要自己走一遍 Host/Origin 和登录凭证检查。
 * 拿不到鉴权服务时一律拒绝。
 */
export function requestRejection(ctx, req) {
  const connection = ctx.get('connection')
  if (typeof connection?.requestRejection !== 'function') return 403
  return connection.requestRejection({ headers: req.headers })
}

export const name = 'dsh-sound-picture-desk'

/**
 * 只观察不干预：万一进程真的崩了，至少留一份现场。
 * uncaughtExceptionMonitor 不改变退出行为，纯记录。
 */
let crashHooked = false
function hookCrashLog() {
  if (crashHooked) return
  crashHooked = true
  const write = (kind, payload) => {
    try {
      const dir = join(dshHome(), 'sound-picture-desk')
      mkdir(dir, { recursive: true })
        .then(() => appendFile(join(dir, 'crash.log'), `${new Date().toISOString()} ${kind} ${payload}\n`))
        .catch(() => {})
    } catch {
      // 记日志失败就算了，不能因为日志再出事
    }
  }
  process.on('uncaughtExceptionMonitor', (err, origin) => {
    write('uncaught', `${origin} | ${err?.stack || err?.message || String(err)}`)
  })
}

export default {
  inject: ['webServer', 'connection'],
  apply(ctx) {
    hookCrashLog()
    const store = new Store()
    // 首次启动时把 story-video-pipeline 已配好的密钥接过来，省一次手工填写
    store.importLegacySecrets().catch(() => {})
    // 回收站里过期的项目顺手清掉；之后每小时再看一次
    purgeExpiredTrash(store).catch(() => {})
    const trashTimer = setInterval(() => { purgeExpiredTrash(store).catch(() => {}) }, 3600_000)
    if (typeof trashTimer.unref === 'function') trashTimer.unref()
    ctx.effect(() => ctx.webServer.register({
      kind: 'prefix',
      path: '/sound-picture-desk',
      handler: async (req, res) => {
        try {
          const rejection = requestRejection(ctx, req)
          if (rejection) {
            json(res, rejection, { error: '未授权' })
            return
          }
          await route(ctx, store, req, res)
        } catch (err) {
          if (res.headersSent) {
            res.end()
            return
          }
          json(res, err.status || 500, { error: err.message })
        }
      },
    }), 'dsh-sound-picture-desk: /sound-picture-desk routes')
  },
}
