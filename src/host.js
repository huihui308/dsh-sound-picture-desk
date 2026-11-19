// dsh-story-desk 的 Host 半片：/story-desk 接口、项目状态、生成编排。
// 文案走 DSH 当前模型，旁白走 MiMo TTS，画面走本机/平台生图，成片走 ffmpeg。
import { createReadStream } from 'node:fs'
import { execFile } from 'node:child_process'
import { appendFile, copyFile, open, stat, writeFile, readFile, rm, mkdir } from 'node:fs/promises'
import { dirname, extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

import { DEFAULT_SETTINGS, STAGES, STAGE_LABEL, Store, dshHome, newId, stageOf } from './store.js'
import { VISUAL_STYLES, styleLabel, writeScript } from './script.js'
import { TTS_PRESETS, TTS_VOICES, synthesize, testTtsChannel } from './tts.js'
import { encoderInfo } from './encoders.js'
import { IMAGE_PRESETS, generateImage, testImageChannel } from './images.js'
import { buildAss, buildSrt, burnSubtitles, concatShots, concatWithFade, probeDuration, renderIntroCard, renderShot } from './render.js'
import { callModel, extractJson, modelInfo } from './llm.js'
import { chatTurn } from './chat.js'
import { cancelTask, isBusy, publicTask, startTask } from './jobs.js'

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')
const MAX_JSON = 8_000_000
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.srt': 'text/plain; charset=utf-8', '.json': 'application/json' }
const MEDIA_DIRS = new Set(['images', 'audio', 'renders', 'work', 'samples', 'anchors'])

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

async function readJson(req) {
  const raw = await readBuffer(req, MAX_JSON)
  if (!raw.length) return {}
  try {
    return JSON.parse(raw.toString('utf8'))
  } catch {
    throw Object.assign(new Error('请求不是有效的 JSON'), { status: 400 })
  }
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

async function sendFile(req, res, file) {
  const type = MIME[extname(file).toLowerCase()]
  if (!type) return json(res, 404, { error: '不支持的文件类型' })
  let info
  try {
    info = await stat(file)
  } catch {
    return json(res, 404, { error: '文件不存在' })
  }
  res.setHeader('content-type', await sniffType(file, type))
  res.setHeader('accept-ranges', 'bytes')
  res.setHeader('cache-control', 'private, max-age=600')
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
    return createReadStream(file, { start, end }).pipe(res)
  }
  res.statusCode = 200
  res.setHeader('content-length', info.size)
  if (req.method === 'HEAD') return res.end()
  return createReadStream(file).pipe(res)
}

// ------------------------------------------------------------------ 状态视图

function findItem(state, id) {
  const item = state.items.find(row => row.id === id)
  if (!item) throw Object.assign(new Error('找不到这个项目'), { status: 404 })
  return item
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
    render: item.render ?? null,
    task: publicTask(item.id),
  }
}

function publicSettings(settings) {
  // 密钥不进这里，界面只知道「有没有配过」
  return { ...settings }
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
async function inspectReference(url) {
  const clean = String(url ?? '').trim()
  if (!/^https?:\/\//i.test(clean)) return { url: clean, title: '', error: '不是 http 链接' }
  try {
    const response = await fetch(clean, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; dsh-story-desk/0.1)', accept: 'text/html' },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    })
    const html = (await response.text()).slice(0, 400_000)
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
    report(0, '正在写说书稿…', 1)
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
    // 旧图属于上一版稿子，换稿后一律作废；目录留着，别让后续写图踩 ENOENT
    await rm(dirs.images, { recursive: true, force: true }).catch(() => {})
    await mkdir(dirs.images, { recursive: true })
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
    report(1, '稿件写好了')
    return { segments: result.segments.length, title: result.title }
  })
}

/** 配音核心：可被单独调用，也可被「配音并合成」复用。 */
async function runVoiceBody(store, secrets, itemId, onlyIds, report, signal) {
  const state = await store.read()
  const item = findItem(state, itemId)
  const settings = effectiveSettings(state, item)
  const targets = item.segments.filter(row => (!onlyIds?.length || onlyIds.includes(row.id)) && (!onlyIds?.length ? true : true))
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
      if (seg) {
        seg.audioPath = `audio/${name}`
        seg.audioSecs = Math.round(secs * 100) / 100
        seg.error = null
      }
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
  return startTask(itemId, 'tts', targets.length, async ({ report, signal }) =>
    runVoiceBody(store, secrets, itemId, onlyIds, report, signal))
}

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
      })
      const norm = await normalizeImageBuffer(raw, dirs, width, height)
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
      const rawStyle = await generateImage({ ...settings, visualStyle: styleId }, secrets, { content, width, height })
      const { buffer } = await normalizeImageBuffer(rawStyle, dirs, width, height)
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
async function normalizeImageBuffer(buffer, dirs, wantW, wantH) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const raw = join(dirs.work, `raw-${stamp}.img`)
  const out = join(dirs.work, `norm-${stamp}.png`)
  try {
    await writeFile(raw, buffer)
    await new Promise((resolve, reject) => {
      execFile('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-map_metadata', '-1', '-frames:v', '1', out],
        { timeout: 60_000 }, err => (err ? reject(err) : resolve()))
    })
    const png = await readFile(out)
    let width = 0
    let height = 0
    try {
      const dict = await new Promise((resolve, reject) => {
        execFile('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
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
  const { text } = await callModel(ctx, {
    route: item.model ?? null,
    maxTokens: 3000,
    system: `你在为一部说书短视频建立「人物与场景参考表」。读完全部旁白，列出其中需要保持同一形象的对象。

只列两类：
- person：有名有姓、反复出现的角色（主角、关键对手）。路人、群众、无名士兵不要列。
- scene：反复出现的核心地点（宫门、大殿、战场），只列一次。

每个对象给一段用于画图的形象描述：年龄、体型、服饰形制（用形状写，不要只写朝代名）、发型、随身物件、伤痕或特征；场景写建筑形制、材质、光源、气氛。描述要能直接喂给画图模型，不写人名以外的文字。

最多 8 条，按重要程度排序。

只输出 JSON：{"anchors":[{"name":"李世民","kind":"person","desc":"..."}]}`,
    user: `题材：${item.topic}\n\n旁白全文：\n${script}`,
  })
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

  return startTask(itemId, 'anchor', 1, async ({ report }) => {
    report(0, `正在画「${target.name}」`)
    const wantW = Number(settings.imageWidth) || 1024
    const wantH = Number(settings.imageHeight) || 1792
    const raw = await generateImage(settings, secrets, {
      content,
      width: wantW,
      height: wantH,
    })
    const { buffer } = await normalizeImageBuffer(raw, dirs, wantW, wantH)
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
  const missingAudio = item.segments.filter(row => !row.audioPath)
  const missingImage = item.segments.filter(row => !row.imagePath)
  if (!item.segments.length) throw Object.assign(new Error('还没有分段，先写稿'), { status: 400 })
  if (missingAudio.length) throw Object.assign(new Error(`还有 ${missingAudio.length} 段没配音`), { status: 400 })
  if (missingImage.length) throw Object.assign(new Error(`还有 ${missingImage.length} 段没出图，先去出图`), { status: 400 })

  const dirs = await store.ensureItemDirs(itemId)
  const shots = []
  let done = 0
  for (const row of item.segments) {
    if (signal.aborted) throw new Error('已停止')
    report(offset + done, `合成第 ${done + 1}/${item.segments.length} 个镜头`)
    const output = join(dirs.work, `shot-${String(row.idx + 1).padStart(3, '0')}.mp4`)
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
    })
    shots.push(output)
    done += 1
    report(offset + done, `已合成 ${done}/${item.segments.length} 个镜头`)
  }

  report(offset + done, '正在拼接整片…')
  const plain = join(dirs.renders, 'video.mp4')
  const trans = settings.transition && settings.transition !== 'none' ? settings.transition : null
  if (trans) await concatWithFade(shots, dirs.work, plain, { transition: trans })
  else await concatShots(shots, dirs.work, plain)
  done += 1

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
      })
      const withIntro = join(dirs.renders, 'video-with-intro.mp4')
      await concatShots([introFile, plain], dirs.work, withIntro)
      await rm(plain, { force: true }).catch(() => {})
      await copyFile(withIntro, plain)
      await rm(withIntro, { force: true }).catch(() => {})
    } catch (err) {
      // 片头是锦上添花，装不上就跳过，别让整片失败
      await store.mutate(draft => {
        const target = findItem(draft, itemId)
        target.log.push({ at: new Date().toISOString(), text: `片头跳过：${String(err.message).slice(0, 80)}` })
        return null
      })
    }
  }

  // 字幕时间轴必须和成片对齐：转场会缩短全片、片头会让全片后移
  const hasFade = settings.transition && settings.transition !== 'none'
  const timelineOpts = {
    overlap: hasFade ? 0.4 : 0,
    offset: settings.intro === 'title' ? INTRO_SECONDS : 0,
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
    await burnSubtitles(plain, assFile, burned)
    finalPath = burned
  }

  // finalPath 已经是绝对路径，不能再按项目目录拼一次
  const secs = await probeDuration(finalPath)
  const rel = finalPath.startsWith(dirs.base) ? finalPath.slice(dirs.base.length + 1) : finalPath
  await store.mutate(draft => {
    const target = findItem(draft, itemId)
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
  return { path: rel, secs }
}

async function startRender(store, itemId) {
  const state = await store.read()
  const item = findItem(state, itemId)
  const missingAudio = item.segments.filter(row => !row.audioPath)
  const missingImage = item.segments.filter(row => !row.imagePath)
  if (!item.segments.length) throw Object.assign(new Error('还没有分段，先写稿'), { status: 400 })
  if (missingAudio.length) throw Object.assign(new Error(`还有 ${missingAudio.length} 段没配音，先配音再合成`), { status: 400 })
  if (missingImage.length) throw Object.assign(new Error(`还有 ${missingImage.length} 段没出图，先出图再合成`), { status: 400 })
  return startTask(itemId, 'render', item.segments.length + 2, async ({ report, signal }) =>
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
  const total = pending.length + item.segments.length + 2
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
  const path = url.pathname.replace(/^\/story-desk\/?/, '')
  const method = req.method || 'GET'

  // 媒体文件：/media/<itemId>/<images|audio|renders|work>/<name>
  if ((method === 'GET' || method === 'HEAD') && path.startsWith('media/')) {
    const rest = path.slice('media/'.length)
    const parts = rest.split('/')
    if (parts.length < 3) return json(res, 404, { error: '路径不完整' })
    const [itemId, dir, ...nameParts] = parts
    const name = nameParts.join('/')
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(itemId) || !MEDIA_DIRS.has(dir)) return json(res, 404, { error: '路径无效' })
    if (name.includes('..') || name.includes('\\') || name.startsWith('/')) return json(res, 404, { error: '路径无效' })
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
        stages: STAGES.map(id => ({ id, label: STAGE_LABEL[id] })),
        imagePresets: IMAGE_PRESETS,
        ttsPresets: TTS_PRESETS,
        engines: await listEngines(ctx),
        encoder: await encoderInfo(),
        trashCount: (state.items ?? []).filter(item => item.deletedAt).length,
        trashDays: trashDays(state),
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
      const { state } = await store.mutate(draft => {
        const row = findItem(draft, id)
        const hit = (row.anchors ?? []).find(a => a.id === anchorId)
        if (hit) {
          hit.approved = candidate || (hit.candidates ?? []).slice(-1)[0] || null
          hit.at = new Date().toISOString()
        }
        return null
      })
      return json(res, 200, { anchors: findItem(state, id).anchors ?? [] })
    }
    case 'anchors/remove': {
      const id = String(body.id ?? '')
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
    case 'item-info': {
      // 选题页要能改题材与材料，否则「选题」这一页只是个摆设
      const id = String(body.id ?? '')
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
      const patch = body.settings && typeof body.settings === 'object' ? body.settings : {}
      const allowed = ['visualStyle', 'voice', 'width', 'height', 'segmentSeconds', 'imageWidth', 'imageHeight', 'kenBurns', 'burnSubtitles', 'motion', 'grade', 'transition', 'intro']
      const clean = {}
      for (const key of allowed) {
        if (!(key in patch)) continue
        if (typeof DEFAULT_SETTINGS[key] === 'number') {
          const n = Number(patch[key])
          if (Number.isFinite(n)) clean[key] = n
        } else if (typeof DEFAULT_SETTINGS[key] === 'boolean') {
          clean[key] = Boolean(patch[key])
        } else if (typeof patch[key] === 'string') {
          clean[key] = patch[key].slice(0, 100)
        }
      }
      const { state } = await store.mutate(draft => {
        const target = findItem(draft, id)
        target.settings = { ...(target.settings ?? {}), ...clean }
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
      const result = await chatTurn(ctx, store, {
        itemId: typeof body.itemId === 'string' ? body.itemId : undefined,
        message: body.message,
      })
      return json(res, 200, result)
    }
    case 'chat/clear': {
      const { state } = await store.mutate(draft => { draft.chat = []; return null }, { undoable: false })
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
      const state = await store.read()
      findItem(state, id)
      await store.mutate(draft => {
        const target = findItem(draft, id)
        target.deletedAt = new Date().toISOString()
        return null
      })
      return json(res, 200, { trashed: id })
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
      if (isBusy(id)) throw Object.assign(new Error('这个项目正在跑任务，等它结束'), { status: 409 })
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
      return json(res, 200, { cancelled: cancelTask(id) })
    }
    case 'settings': {
      const patch = body.settings && typeof body.settings === 'object' ? body.settings : {}
      const allowed = Object.keys(DEFAULT_SETTINGS)
      const clean = {}
      for (const key of allowed) {
        if (!(key in patch)) continue
        const value = patch[key]
        if (typeof DEFAULT_SETTINGS[key] === 'number') {
          const n = Number(value)
          if (Number.isFinite(n)) clean[key] = n
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
    execFile(process.env.STORY_DESK_FFMPEG || 'ffmpeg', ['-version'], { timeout: 5000 }, (err, stdout) => {
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

export const name = 'dsh-story-desk'

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
      const dir = join(homedir(), '.dsh', 'story-desk')
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
      path: '/story-desk',
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
    }), 'dsh-story-desk: /story-desk routes')
  },
}
