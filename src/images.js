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

async function withTimeout(fn, ms, label) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fn(controller.signal, label)
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error(`${label}超时（${Math.round(ms / 1000)} 秒）`)
    throw err
  } finally {
    clearTimeout(timer)
  }
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

async function generatePlatform({ endpoint, key, model, prompt, width, height }) {
  if (!key) throw new Error('还没有配置平台生图密钥')
  // 读 body 也要算进超时：b64 大图有上百 KB，卡在读取阶段时只包住建连是没用的
  const { response, raw } = await withTimeout(
    async signal => {
      const hit = await fetch(`${trimSlash(endpoint)}/images/generations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, prompt, size: `${width}x${height}`, response_format: 'b64_json', n: 1 }),
        signal,
      })
      return { response: hit, raw: await hit.text() }
    },
    300_000,
    '平台生图',
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

/** 生成一张分镜图，返回 PNG 字节。 */
/** 生图只有一种协议：OpenAI 兼容的 /images/generations。 */
export async function generateImage(settings, secrets, { content, width, height }) {
  return generatePlatform({
    endpoint: settings.imageEndpoint,
    key: secrets?.imageKey,
    model: settings.imageModel,
    prompt: buildPrompt(content, settings.visualStyle),
    width,
    height,
  })
}

/**
 * 预设：只负责填好地址与模型，密钥永远由用户自己填。
 * 本机部署的服务同样走 OpenAI 兼容协议（它自己就提供 /v1/images/generations），
 * 所以这里不单列「本机」一档——地址填 127.0.0.1 即可，免密钥。
 */
export const IMAGE_PRESETS = [
  {
    id: 'qwen-maas',
    label: '阿里云 MaaS',
    endpoint: 'https://maas.qianwenaiapi.com/compatible-mode/v1',
    model: 'qwen-image-2.1-turbo',
    needsKey: true,
    note: '阿里云百炼的 OpenAI 兼容入口，按张计费。',
  },
  {
    id: 'minimax',
    label: 'MiniMax',
    endpoint: 'https://api.minimax.cn/v1',
    model: 'MiniMax-H3-Image',
    needsKey: true,
    note: 'MiniMax 海螺，OpenAI 兼容入口（国际站把地址换成 api.minimax.io/v1）。',
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
