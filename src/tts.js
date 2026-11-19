// 旁白合成：小米 MiMo TTS。走 chat/completions，旁白放在 assistant 消息里，
// 音频以 base64 从 message.audio.data 返回。
// 顺序即推荐顺序：说书要的是沉稳、有叙述感的嗓子，男声排前面，女声留作可选项。
// 用户实际听过之后的偏好由项目设置记住，不会因为这里的顺序变化而被覆盖。
const VOICES = [
  { id: '白桦', label: '白桦', note: '男声，沉稳，讲历史最稳' },
  { id: '苏打', label: '苏打', note: '男声，偏年轻，节奏轻快' },
  { id: 'mimo_default', label: '默认', note: '系统默认声线，中性' },
  { id: 'Milo', label: 'Milo', note: '男声，音色偏亮' },
  { id: 'Dean', label: 'Dean', note: '男声，偏低沉' },
  { id: '茉莉', label: '茉莉', note: '女声，温和' },
  { id: '冰糖', label: '冰糖', note: '女声，清亮' },
  { id: 'Mia', label: 'Mia', note: '女声，偏平' },
  { id: 'Chloe', label: 'Chloe', note: '女声，偏柔' },
]

export const TTS_VOICES = VOICES.map(row => ({ ...row }))

/** 预设：只填好地址与模型，密钥由用户自己填。 */
export const TTS_PRESETS = [
  {
    id: 'mimo',
    label: '小米 MiMo',
    endpoint: 'https://token-plan-cn.xiaomimimo.com/v1',
    model: 'mimo-v2.5-tts',
    note: 'token-plan 计费入口，适合按套餐用量走。',
  },
  {
    id: 'mimo-public',
    label: '小米 MiMo（公众版）',
    endpoint: 'https://api.xiaomimimo.com/v1',
    model: 'mimo-v2.5-tts',
    note: '按量付费的公开入口，key 和 token-plan 的不通用。',
  },
]

const INSTRUCTION = '请朗读下面这段说书旁白。语气平稳克制，像在给朋友讲一件旧事，句与句之间留一点停顿，不要播音腔。'

function describeFailure(status, body) {
  let message = ''
  try {
    const parsed = JSON.parse(body)
    message = parsed?.error?.message || parsed?.error?.param || parsed?.message || ''
  } catch {
    message = String(body || '').slice(0, 200)
  }
  if (status === 401 || status === 403) return `音频密钥无效或额度不足（HTTP ${status}）：${message}`
  if (status === 404) return `音频地址路径不对（HTTP 404）：${message}`
  if (status === 429) return `音频通道限流（HTTP 429）：${message}`
  return `音频合成失败（HTTP ${status}）：${message}`
}

/**
 * 合成一段旁白音频。
 * @returns {Promise<Buffer>} mp3 字节。
 */
export async function synthesize({ endpoint, model, key, voice, text, signal }) {
  if (!key) throw new Error('还没有配置音频密钥，去设置里填一次')
  const content = String(text ?? '').trim()
  if (!content) throw new Error('这一段没有文字，无法合成')
  const url = `${String(endpoint).replace(/\/+$/, '')}/chat/completions`
  const body = {
    model,
    messages: [
      { role: 'user', content: INSTRUCTION },
      { role: 'assistant', content },
    ],
    audio: { voice: VOICES.includes(voice) ? voice : 'mimo_default', format: 'mp3' },
    stream: false,
  }
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new Error(`连不上音频服务（${url}）：${err?.message ?? err}`)
  }
  const raw = await response.text()
  if (!response.ok) throw new Error(describeFailure(response.status, raw))
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('音频服务返回的不是 JSON')
  }
  const data = parsed?.choices?.[0]?.message?.audio?.data
  if (typeof data !== 'string' || !data) throw new Error('音频服务没有返回音频（可能这一段的文字被判定不可朗读）')
  return Buffer.from(data, 'base64')
}

/**
 * 真合成一小段来验通道：地址错、路径错、key 错、模型名错，
 * 在这一步就会给出不同的报错，而不是等到批量配音时才炸。
 */
export async function testTtsChannel({ endpoint, model, key, voice }) {
  const started = Date.now()
  try {
    const buffer = await synthesize({
      endpoint,
      model,
      key,
      voice,
      text: '测试。',
      signal: AbortSignal.timeout(60_000),
    })
    const kb = Math.max(1, Math.round(buffer.length / 1024))
    return { ok: true, detail: `合成成功，返回 ${kb} KB 音频（${Date.now() - started} ms）` }
  } catch (err) {
    return { ok: false, detail: err?.message ?? String(err) }
  }
}
