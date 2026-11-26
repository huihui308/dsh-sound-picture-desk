// 旁白合成：小米 MiMo TTS。走 chat/completions，旁白放在 assistant 消息里，
// 音频以 base64 从 message.audio.data 返回。
// 顺序即推荐顺序：旁白要的是沉稳、有叙述感的嗓子，男声排前面，女声留作可选项。
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

/** MiniMax 官方 T2A 的声线。id 就是它家的 voice_id。 */
export const MINIMAX_VOICES = [
  { id: 'presenter_male', label: '男性主持人', note: '播报感强，讲历史最像电台' },
  { id: 'audiobook_male_1', label: '男声有声书 1', note: '叙述腔，句子收得稳' },
  { id: 'audiobook_male_2', label: '男声有声书 2', note: '比 1 更沉，适合正剧' },
  { id: 'male-qn-jingying', label: '精英青年', note: '偏年轻的男声，节奏快' },
  { id: 'male-qn-badao', label: '霸道青年', note: '低音足，压得住场面' },
  { id: 'presenter_female', label: '女性主持人', note: '干净利落' },
  { id: 'audiobook_female_1', label: '女声有声书 1', note: '温和叙述' },
  { id: 'female-yujie', label: '御姐', note: '偏低的女声，不甜' },
]

/** 预设：只填好地址与模型，密钥由用户自己填。 */
export const TTS_PRESETS = [
  {
    id: 'mimo',
    label: '小米 MiMo',
    provider: 'mimo',
    endpoint: 'https://token-plan-cn.xiaomimimo.com/v1',
    model: 'mimo-v2.5-tts',
    note: 'token-plan 计费入口，适合按套餐用量走。',
  },
  {
    id: 'mimo-public',
    label: '小米 MiMo（公众版）',
    provider: 'mimo',
    endpoint: 'https://api.xiaomimimo.com/v1',
    model: 'mimo-v2.5-tts',
    note: '按量付费的公开入口，key 和 token-plan 的不通用。',
  },
  {
    id: 'minimax',
    label: 'MiniMax 官方',
    provider: 'minimax',
    endpoint: 'https://api.minimaxi.com/v1',
    model: 'speech-2.8-hd',
    note: '国内入口 api.minimaxi.com，国际版换 api.minimax.io。新版 sk-api- 密钥直接可用；老版 eyJ 密钥要 GroupId，当前版本不支持。',
  },
]

/** 按服务商给可选声线。 */
export function voicesFor(provider) {
  return (provider === 'minimax' ? MINIMAX_VOICES : VOICES).map(row => ({ ...row }))
}

const INSTRUCTION = '请朗读下面这段旁白。语气平稳克制，像在给朋友讲一件旧事，句与句之间留一点停顿，不要播音腔。'
// 英文要单独给指令：中文那条会让模型带中文韵律去读英文，重音全错
const INSTRUCTION_EN = 'Read the following narration. Calm and restrained, like telling an old story to a friend. Slight pause between sentences. Natural English stress, no broadcast-anchor tone, no rising inflection at the end of each sentence.'

/** 合成请求自己的超时：调用方没给 signal 时（如试听路由）也不能无限挂着。 */
const REQUEST_TIMEOUT_MS = 120_000

/**
 * 合并调用方的 signal 与合成本身的超时信号。
 * 用户点「停止」要能立刻中断，超时也要能自己收口——两者取先到的那个。
 */
function combineSignals(outer, timeout) {
  if (!outer) return timeout
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([outer, timeout])
  // 老一点的 Node 没有 AbortSignal.any：手动跟随任一信号
  const controller = new AbortController()
  for (const source of [outer, timeout]) {
    if (source.aborted) { controller.abort(); break }
    source.addEventListener('abort', () => controller.abort(), { once: true })
  }
  return controller.signal
}

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
 * MiniMax 官方 T2A：和 MiMo 完全是另一套协议。
 * 返回的是 hex 字符串（不是 base64），URL 上要带 GroupId。
 */
async function synthesizeMinimax({ endpoint, model, key, voice, content, signal, groupId }) {
  const base = String(endpoint).replace(/\/+$/, '')
  const url = `${base}/t2a_v2${groupId ? `?GroupId=${encodeURIComponent(groupId)}` : ''}`
  const voiceId = MINIMAX_VOICES.some(row => row.id === voice) ? voice : 'presenter_male'
  const body = {
    model: model || 'speech-2.8-hd',
    text: content,
    voice_setting: { voice_id: voiceId, speed: 1, vol: 1, pitch: 0 },
    audio_setting: { sample_rate: 32000, bitrate: 128000, format: 'mp3', channel: 1 },
    stream: false,
  }
  let response
  let raw
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
      signal: combineSignals(signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)),
    })
    raw = await response.text()
  } catch (err) {
    if (signal?.aborted) throw err
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw new Error(`音频服务超时（${REQUEST_TIMEOUT_MS / 1000} 秒），地址可达但没返回结果`)
    }
    throw new Error(`连不上音频服务（${url}）：${err?.message ?? err}`)
  }
  if (!response.ok) throw new Error(describeFailure(response.status, raw))
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('音频服务返回的不是 JSON')
  }
  const code = parsed?.base_resp?.status_code
  if (code !== undefined && code !== 0) {
    const msg = parsed?.base_resp?.status_msg || '未知错误'
    // 1004 是认证失败，1008 是余额不足，这两个最常见，直接给人话
    const hint = code === 1004 ? '：密钥或 GroupId 不对' : code === 1008 ? '：账户余额不足' : ''
    throw new Error(`MiniMax 拒绝了请求（${code}）${msg}${hint}`)
  }
  const hex = parsed?.data?.audio
  if (typeof hex !== 'string' || !hex) throw new Error('音频服务没有返回音频（这条文字可能被判定不可朗读）')
  return Buffer.from(hex, 'hex')
}

/**
 * 合成一段旁白音频。
 * @returns {Promise<Buffer>} mp3 字节。
 */
export async function synthesize({ endpoint, model, key, voice, text, signal, language = 'zh', provider = 'mimo', groupId = '' }) {
  if (!key) throw new Error('还没有配置音频密钥，去设置里填一次')
  const content = String(text ?? '').trim()
  if (!content) throw new Error('这一段没有文字，无法合成')
  if (provider === 'minimax') {
    return synthesizeMinimax({ endpoint, model, key, voice, content, signal, groupId })
  }
  const url = `${String(endpoint).replace(/\/+$/, '')}/chat/completions`
  const body = {
    model,
    messages: [
      { role: 'user', content: language === 'en' ? INSTRUCTION_EN : INSTRUCTION },
      { role: 'assistant', content },
    ],
    audio: { voice: VOICES.some(row => row.id === voice) ? voice : 'mimo_default', format: 'mp3' },
    stream: false,
  }
  // 调用方可能没给 signal（例如试听路由），这里自己兜 120 秒：
  // 不兜的话要等 undici 默认的 300 秒，用户会以为界面卡死，而且报错还是「连不上」
  const requestSignal = combineSignals(signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS))
  let response
  let raw
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
      signal: requestSignal,
    })
    // 读 body 也要算在超时里：音频有几 MB，卡在读取阶段和卡在连接阶段一样会挂住
    raw = await response.text()
  } catch (err) {
    // 调用方主动停止 / 自己设的超时：原样抛出，由上层翻译
    if (signal?.aborted) throw err
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw new Error(`音频服务超时（${REQUEST_TIMEOUT_MS / 1000} 秒），地址可达但没返回结果`)
    }
    throw new Error(`连不上音频服务（${url}）：${err?.message ?? err}`)
  }
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
export async function testTtsChannel({ endpoint, model, key, voice, provider, groupId }) {
  const started = Date.now()
  try {
    // 检测必须走和正式合成同一条协议分支，否则 MiniMax 会被当成 MiMo 发 chat/completions
    const buffer = await synthesize({
      endpoint,
      model,
      key,
      voice,
      text: '测试。',
      signal: AbortSignal.timeout(60_000),
      provider,
      groupId,
    })
    const kb = Math.max(1, Math.round(buffer.length / 1024))
    return { ok: true, detail: `合成成功，返回 ${kb} KB 音频（${Date.now() - started} ms）` }
  } catch (err) {
    // 检测自带 60 秒上限（比合成默认的 120 秒短），超时单独说清楚，别说成「连不上」
    const detail = err?.name === 'TimeoutError'
      ? '检测超时（60 秒），地址可达但没返回结果'
      : err?.message ?? String(err)
    return { ok: false, detail }
  }
}
