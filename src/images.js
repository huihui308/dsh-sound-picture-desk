// 生图：默认走本机 Qwen-Image（免费），可选 OpenAI 兼容平台接口。
import { VISUAL_STYLES } from './script.js'

function trimSlash(value) {
  return String(value ?? '').replace(/\/+$/, '')
}

/** 拼最终画面提示词：内容描述 + 风格后缀 + 竖屏约束。 */
export function buildPrompt(content, styleId) {
  const style = VISUAL_STYLES[styleId] ?? VISUAL_STYLES.cinematic
  const body = String(content ?? '').trim().replace(/\s+/g, ' ')
  return `${body}. ${style.suffix}`
}

/** MiniMax 原生接口的 prompt 上限（官方 1500 字符，超了整个请求直接 400）。 */
const MINIMAX_PROMPT_MAX = 1500

/**
 * MiniMax 原生通道的 prompt 截断。以前从尾部盲截 1500 字，正文一长就先丢风格后缀
 * （后缀里带着竖屏 9:16、no text、no watermark），画面就丢了风格约束。
 * 这里保头保尾：前面留内容描述，后面完整保留风格后缀，只截内容的中后段。
 */
export function truncatePrompt(prompt, suffix, max = MINIMAX_PROMPT_MAX) {
  const text = String(prompt ?? '')
  if (text.length <= max) return text
  const tail = String(suffix ?? '').trim()
  if (!tail) return text.slice(0, max)
  const suffixPart = `. ${tail}`
  const budget = max - suffixPart.length
  // 极端配置下（后缀本身接近上限）退化成只保后缀，至少风格不丢
  if (budget <= 0) return suffixPart.slice(-max)
  const head = text.slice(0, budget).replace(/[.。；;，,\s]+$/, '')
  return `${head}${suffixPart}`
}

/**
 * 带超时的请求。外层传进来的 signal（用户点「停止」）也要能立刻中断，
 * 否则出图要等满 300 秒，界面上的停止按钮等于没用。
 */
function combineSignals(a, b) {
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([a, b])
  // 老一点的 Node 没有 AbortSignal.any：手动跟随任一信号
  const controller = new AbortController()
  for (const source of [a, b]) {
    if (source.aborted) { controller.abort(); break }
    source.addEventListener('abort', () => controller.abort(), { once: true })
  }
  return controller.signal
}

async function withTimeout(fn, ms, label, outer) {
  const timeout = AbortSignal.timeout(ms)
  const signal = outer ? combineSignals(outer, timeout) : timeout
  try {
    return await fn(signal, label)
  } catch (err) {
    if (outer?.aborted) throw new Error(`${label}已停止`)
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw new Error(`${label}超时（${Math.round(ms / 1000)} 秒）`)
    }
    throw err
  }
}

/** 生图尺寸统一夹到合法区间，避免把 0 或 9999 直接发给服务端。 */
export function clampImageSize(value, fallback) {
  const n = Math.round(Number(value) || fallback)
  return Math.max(512, Math.min(2048, n))
}

/** 把各家五花八门的报错翻成人话，并说清下一步该干什么。 */
function describeFailure(status, raw, endpoint) {
  const local = /^https?:\/\/(127\.0\.0\.1|localhost)/i.test(String(endpoint ?? ''))
  let message = ''
  try {
    const parsed = JSON.parse(raw)
    message = parsed?.error?.message || parsed?.message || ''
  } catch {
    message = String(raw ?? '').slice(0, 160)
  }
  if (status === 503 && /comfy|不可达|unreachable/i.test(message)) {
    return `本机生图模型没启动：${message}。到 Gen Studio 控制台（127.0.0.1:8090）启动 Qwen-Image，或在设置里换成平台通道。`
  }
  if (status === 401 || status === 403) {
    return `生图密钥被拒绝（HTTP ${status}），地址是通的：${message || '换一个 key 试试'}`
  }
  if (status === 404) {
    return `生图路径不对（HTTP 404），地址要填到 /v1 为止：${message}`
  }
  if (status === 429) return `生图通道限流（HTTP 429）：${message}`
  if (status >= 500) {
    return local
      ? `本机生图服务出错（HTTP ${status}）：${message || '看 Gen Studio 的状态页'}`
      : `生图服务出错（HTTP ${status}）：${message || raw.slice(0, 120)}`
  }
  return `生图失败（HTTP ${status}）：${message || raw.slice(0, 160)}`
}

function isLocalEndpoint(endpoint) {
  return /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(?::|\/|$)/i.test(String(endpoint ?? ''))
}

async function generatePlatform({ endpoint, key, model, prompt, width, height, signal }) {
  // 本机自建服务免密钥；平台通道必须填 key
  if (!key && !isLocalEndpoint(endpoint)) throw new Error('还没有配置平台生图密钥')
  // 读 body 也要算进超时：b64 大图有上百 KB，卡在读取阶段时只包住建连是没用的
  const { response, raw } = await withTimeout(
    async signal => {
      const hit = await fetch(`${trimSlash(endpoint)}/images/generations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
        body: JSON.stringify({ model, prompt, size: `${width}x${height}`, response_format: 'b64_json', n: 1 }),
        signal,
      })
      return { response: hit, raw: await hit.text() }
    },
    300_000,
    '平台生图',
    signal,
  )
  if (!response.ok) throw new Error(describeFailure(response.status, raw, endpoint))
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('平台生图返回的不是 JSON')
  }
  const b64 = parsed?.data?.[0]?.b64_json
  if (typeof b64 !== 'string' || !b64) throw new Error('平台生图没有返回图片数据')
  return Buffer.from(b64, 'base64')
}

/** image-01 系列只活在 MiniMax 原生接口上，OpenAI 兼容入口不认它。 */
const MINIMAX_NATIVE_MODEL = /^image-01(-live)?$/i

export function isMinimaxNativeModel(model) {
  return MINIMAX_NATIVE_MODEL.test(String(model ?? '').trim())
}

/**
 * MiniMax 原生接口 POST /v1/image_generation（下划线，不是 /images/generations）。
 * 只有这条能吃 image-01，也正是它便宜的原因：固定 ¥0.025/张，与分辨率无关。
 * 请求体认 width/height（512–2048，8 的倍数），响应在 data.image_base64[] 里。
 */
async function generateMinimaxNative({ endpoint, key, model, prompt, suffix, width, height, signal }) {
  if (!key) throw new Error('还没有配置平台生图密钥')
  const { response, raw } = await withTimeout(
    async signal => {
      const hit = await fetch(`${trimSlash(endpoint)}/image_generation`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          // 官方上限 1500 字符，超了整个请求直接 400；截断时要保住完整风格后缀
          prompt: truncatePrompt(prompt, suffix),
          // 官方范围 512–2048、8 的倍数；越界会直接 400
          width: Math.round(clampImageSize(width, 1024) / 8) * 8,
          height: Math.round(clampImageSize(height, 1792) / 8) * 8,
          response_format: 'base64',
          n: 1,
        }),
        signal,
      })
      return { response: hit, raw: await hit.text() }
    },
    300_000,
    '平台生图',
    signal,
  )
  if (!response.ok) throw new Error(describeFailure(response.status, raw, endpoint))
  let parsed = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('平台生图返回的不是 JSON')
  }
  // 这条接口连鉴权失败都回 HTTP 200，真正的结论在 base_resp 里
  if (parsed?.base_resp) {
    const code = Number(parsed.base_resp.status_code)
    const detail = String(parsed.base_resp.status_msg ?? '').slice(0, 160)
    if (code === 1004 || code === 1008) throw new Error(`生图密钥被拒绝（${code}），地址是通的：${detail || '换一个 key 试试'}`)
    if (code === 1002) throw new Error(`生图通道限流（${code}）：${detail}`)
    if (code !== 0) throw new Error(`MiniMax 生图失败（${code}）：${detail}`)
  }
  const b64 = parsed?.data?.image_base64?.[0]
  if (typeof b64 !== 'string' || !b64) throw new Error('平台生图没有返回图片数据')
  return Buffer.from(b64, 'base64')
}

/** 生成一张分镜图，返回图片字节（PNG/JPEG 不论，调用方会统一规范化）。 */
export async function generateImage(settings, secrets, { content, width, height, signal }) {
  const endpoint = settings.imageEndpoint
  const model = settings.imageModel
  const key = secrets?.imageKey
  const style = VISUAL_STYLES[settings.visualStyle] ?? VISUAL_STYLES.cinematic
  const prompt = buildPrompt(content, settings.visualStyle)
  return isMinimaxNativeModel(model)
    ? generateMinimaxNative({ endpoint, key, model, prompt, suffix: style.suffix, width, height, signal })
    : generatePlatform({ endpoint, key, model, prompt, width, height, signal })
}

/**
 * 预设：只负责填好地址与模型，密钥永远由用户自己填。
 * 本机部署的服务同样走 OpenAI 兼容协议（它自己就提供 /v1/images/generations），
 * 所以这里不单列「本机」一档——地址填 127.0.0.1 即可，免密钥。
 */
export const IMAGE_PRESETS = [
  {
    id: 'qwen-maas',
    label: '阿里云 MaaS（qwen-image）',
    endpoint: 'https://maas.qianwenaiapi.com/compatible-mode/v1',
    model: 'qwen-image-2.1-turbo',
    needsKey: true,
    note: '阿里云百炼的 OpenAI 兼容入口，按张计费（约 ¥0.1/张）。',
  },
  {
    // 便宜一档：固定 ¥0.025/张，走原生接口，代码里按模型名自动认路
    id: 'minimax-image-01',
    label: 'MiniMax（image-01 · ¥0.025/张）',
    endpoint: 'https://api.minimaxi.com/v1',
    model: 'image-01',
    needsKey: true,
    note: '海螺原生接口 /v1/image_generation，固定 ¥0.025/张、与分辨率无关；文生图几秒一张，画质比 H3 低一档。',
  },
  {
    id: 'minimax-h3',
    label: 'MiniMax（H3-Image · 按 token）',
    endpoint: 'https://api.minimaxi.com/v1',
    model: 'MiniMax-H3-Image-Highspeed',
    needsKey: true,
    note: 'OpenAI 兼容入口，按 token 计费：1024×1792 约 ¥0.25/张（极速版 6–8 秒）；标准版约 ¥0.15，但实测很慢。',
  },
  {
    id: 'openai',
    label: 'OpenAI 兼容',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-image-1',
    needsKey: true,
    note: '任何兼容 /v1/images/generations 的服务或中转；本机部署填 http://127.0.0.1:30021/v1，免密钥。',
  },
]

/**
 * 真打一次请求来验通道。不能只检查「密钥非空」——配了错的 key
 * 和没配 key 在界面上的样子一样，只有打过去才知道。
 */
export async function testImageChannel({ endpoint, model, key }) {
  const base = trimSlash(endpoint)
  if (!base) return { ok: false, detail: '地址为空' }
  const started = Date.now()
  const elapsed = () => Date.now() - started

  if (isMinimaxNativeModel(model)) return probeMinimaxNative({ base, model, key, elapsed })

  // 先问 /models：不花钱，同时验了地址与密钥。本机部署免密钥，所以没 key 也照样请求。
  let response
  try {
    response = await fetch(`${base}/models`, {
      headers: key ? { authorization: `Bearer ${key}` } : {},
      signal: AbortSignal.timeout(15_000),
    })
  } catch (err) {
    return { ok: false, detail: `连不上 ${base}：${err?.message ?? err}` }
  }
  if (response.ok) {
    let models = []
    try {
      const parsed = await response.json()
      models = [...new Set((parsed?.data ?? []).map(row => row?.id).filter(Boolean))]
    } catch {
      // 有的服务 /models 返回空体，不影响结论
    }
    // 图像模型常常不出现在 /models 列表里，所以缺了也不判失败，只是提示
    const missing = model && models.length && !models.includes(model)
    return {
      ok: true,
      models,
      detail: `地址与密钥可用（${elapsed()} ms）${missing ? '，当前模型不在列表里，可以从下方候选里选一个' : ''}`,
    }
  }
  if (response.status === 404 || response.status === 405) {
    return { ok: false, detail: `地址可达，但不支持 /models（HTTP ${response.status}）。确认地址填到 /v1 为止；这个服务只能靠出图验证。` }
  }
  if (response.status === 401 || response.status === 403) {
    return { ok: false, detail: `密钥被拒绝（HTTP ${response.status}），地址是通的，换一个 key 试试` }
  }
  const text = await response.text().catch(() => '')
  return { ok: false, detail: `HTTP ${response.status}：${text.slice(0, 160)}` }
}

/**
 * image-01 不在 /models 列表里，所以换个免费的问法：发一个空请求体。
 * 密钥错时原生接口回 HTTP 200 + base_resp 1004（登录失败），
 * 密钥对时回 1004 以外的参数错误码（2013）——空请求不生成图，不计费。
 */
async function probeMinimaxNative({ base, model, key, elapsed }) {
  let response
  let text = ''
  try {
    response = await fetch(`${base}/image_generation`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
      body: '{}',
      signal: AbortSignal.timeout(15_000),
    })
    text = await response.text()
  } catch (err) {
    return { ok: false, detail: `连不上 ${base}：${err?.message ?? err}` }
  }
  if (response.status === 404 || response.status === 405) {
    return { ok: false, detail: `地址可达，但 ${base} 上没有 /image_generation（HTTP ${response.status}）。地址要填到 /v1 为止。` }
  }
  if (!response.ok) return { ok: false, detail: `HTTP ${response.status}：${text.slice(0, 160)}` }
  let parsed = null
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = null
  }
  const code = Number(parsed?.base_resp?.status_code)
  if (code === 1004 || code === 1008) {
    return { ok: false, detail: `密钥被拒绝（${code}），地址是通的：换一个 key 试试` }
  }
  if (parsed?.base_resp) {
    return {
      ok: true,
      detail: `地址与密钥可用（${elapsed()} ms），${model} 走原生 /image_generation，出图按 ¥0.025/张计费`,
    }
  }
  return { ok: false, detail: `返回的不是 MiniMax 原生格式：${text.slice(0, 140)}` }
}
