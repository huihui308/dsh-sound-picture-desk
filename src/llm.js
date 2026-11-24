// 调 DeepSeek Harness 当前默认模型，不单独配置密钥。
// 模型不可用时抛错，由调用方决定降级——不静默返回半成品。
import { randomUUID } from 'node:crypto'
import { appendFile, mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * 插件在会话之外调模型，自己带一个会话标识。有些网关按会话路由，
 * 缺了会话头会直接返回 400；DSH 会把 sessionId 映射成这类头。
 */
export const PLUGIN_SESSION_ID = `dsh-sound-picture-desk-${randomUUID()}`

export function modelInfo(ctx) {
  if (!ctx.get('llm')) return null
  let selection = null
  try {
    selection = ctx.get('agentDefaultModel')?.currentSelection?.() ?? null
  } catch {
    selection = null
  }
  if (!selection?.provider || !selection?.model) return null
  return { provider: selection.provider, model: selection.model }
}

/** 这一轮该用哪个模型：显式指定优先，否则跟随 DSH 当前默认。 */
export function resolveModel(ctx, route) {
  if (route?.provider && route?.model) return { provider: route.provider, model: route.model }
  return modelInfo(ctx)
}

/** 只记上下文，不记密钥；用于排查模型通道超时。 */
function logModelFailure(info, err) {
  try {
    const dir = join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'sound-picture-desk')
    const failure = err?.failure && typeof err.failure === 'object' ? err.failure : {}
    const line = JSON.stringify({
      at: new Date().toISOString(),
      provider: info?.provider,
      model: info?.model,
      message: err?.message,
      // DSH 把适配器异常归一成 finish 帧，真正的失败原因在 code/status 里
      code: err?.code ?? failure.code ?? null,
      status: err?.status ?? failure.status ?? null,
      // 只留可诊断字段，不整包记 failure（里面可能带请求细节）
      failure: failure.code || failure.message
        ? {
            code: failure.code ?? null,
            status: failure.status ?? null,
            message: String(failure.message ?? '').slice(0, 500),
          }
        : null,
      cause: err?.cause?.code || err?.cause?.message || null,
      stack: String(err?.stack || '').slice(0, 4000),
    }) + '\n'
    // 目录第一次写入时还不存在：先建目录，否则日志会静默丢失
    mkdir(dir, { recursive: true })
      .then(() => appendFile(join(dir, 'model-errors.log'), line))
      .catch(() => {})
  } catch {}
}

/**
 * DSH 归一化后的失败码优先判：适配器异常会变成 finish 帧，
 * code 是 provider 无关的稳定判据（deepseek: TIMEOUT/TRANSPORT，pi-ai 之类会给 STREAM_CLOSED）。
 */
const TRANSIENT_CODES = new Set([
  'TRANSPORT', 'TIMEOUT', 'STREAM_CLOSED', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT',
  'ENOTFOUND', 'EAI_AGAIN', 'EPIPE', 'ENETDOWN', 'ENETUNREACH', 'EHOSTUNREACH',
])

/** 网络/连接类错误重试；模型自身返回 4xx、内容不合格不重试。 */
function transientModelError(err) {
  // finish 帧：失败码在 code（可能来自 failure），先按 code 判定
  const code = String(err?.code ?? err?.failure?.code ?? '').trim().toUpperCase()
  if (TRANSIENT_CODES.has(code) || code.startsWith('UND_ERR')) return true
  // 老路径（fetch 直抛的错误）没有归一化 code，仍按文本兜底
  const text = [
    err?.message,
    err?.failure?.message,
    err?.cause?.code,
    err?.cause?.message,
    err?.cause?.cause?.code,
  ].filter(Boolean).join(' ')
  return /ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|EPIPE|UND_ERR|fetch failed|Request timed out|stream idle timeout|socket hang up|network/i.test(text)
}

/**
 * 调一次模型，返回完整文本。
 * @param {object} ctx - Cordis 上下文。
 * @param {{system: string, user: string, maxTokens?: number, signal?: AbortSignal}} request - 请求。
 * @returns {Promise<{text: string, model: string}>}
 */
export async function callModel(ctx, { system, user, maxTokens = 8000, signal, route, onProgress }) {
  const info = resolveModel(ctx, route)
  if (!info) throw new Error('当前没有可用模型，请先在设置里选一个模型')
  const llm = ctx.get('llm')

  const once = async budget => {
    const call = await llm.prepareCall({ provider: info.provider, model: info.model, maxTokens: budget }, signal)
    let text = ''
    let reasoning = ''
    let stopped = null
    let textChars = 0
    let reasoningChars = 0
    let lastTick = 0
    for await (const chunk of call.stream({
      ...call.config,
      system,
      messages: [{ role: 'user', content: [{ type: 'text', text: user }], source: { kind: 'dsh-sound-picture-desk' } }],
      sessionId: PLUGIN_SESSION_ID,
      signal,
    })) {
      if (chunk.type === 'text-delta') {
        text += chunk.text
        textChars += String(chunk.text ?? '').length
      } else if (chunk.type === 'reasoning-delta') {
        // 推理型模型会先把思考过程吐出来，正文在后面
        reasoning += chunk.text ?? ''
        reasoningChars += String(chunk.text ?? '').length
      }
      else if (chunk.type === 'finish') {
        const reason = chunk.reason ?? {}
        if (['error', 'aborted'].includes(reason.kind)) {
          // DSH 会把适配器异常归一成 finish 帧：failure 里的 code/status 不能丢，
          // 重试判断、model-errors.log 和上层的中文提示都要靠它
          const failure = reason.failure && typeof reason.failure === 'object' ? reason.failure : {}
          const err = new Error(failure.message || '模型调用失败')
          if (failure.code) err.code = failure.code
          if (failure.status != null) err.status = failure.status
          err.failure = failure
          // 被调用方/适配器中止：上层按 AbortError 映射成「已停止 / 超时」提示
          if (reason.kind === 'aborted') err.name = 'AbortError'
          throw err
        }
        stopped = reason.kind ?? null
      }
      // 光想不写的模型会一直烧预算：思考量到了还没落笔，就提前叫停，别让用户干等十几分钟
      if (textChars === 0 && reasoningChars > 15000) {
        throw new Error(`模型「${info.model}」推演了 ${reasoningChars} 字仍未开始写正文，这个模型不适合长文写作，换一个更直接的模型`)
      }
      // 节流上报，让界面能看出模型在思考还是在落笔
      if (onProgress) {
        const now = Date.now()
        if (now - lastTick > 250) {
          lastTick = now
          onProgress({ reasoning: reasoningChars, text: textChars })
        }
      }
    }
    return { text, reasoning, stopped }
  }

  // 网络抖动（常见 ETIMEDOUT / ECONNRESET）自动重试两次；模型内容错误不重试
  const onceStable = async budget => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await once(budget)
      } catch (err) {
        if (signal?.aborted || !transientModelError(err) || attempt >= 2) {
          if (transientModelError(err)) logModelFailure(info, err)
          throw err
        }
        await new Promise(resolve => setTimeout(resolve, 900 * (attempt + 1)))
      }
    }
  }

  let result = await onceStable(maxTokens)
  // 推理把预算烧光了：翻倍给一次机会，比直接报错有用
  const burned = !result.text.trim() && result.reasoning.trim()
    && ['max-tokens', 'length', 'max_tokens'].includes(String(result.stopped))
  if (burned) result = await onceStable(Math.min(maxTokens * 3, 64000))

  if (!result.text.trim()) {
    const truncated = ['max-tokens', 'length', 'max_tokens'].includes(String(result.stopped))
    const reason = truncated ? '，输出被长度上限截断' : ''
    const hint = result.reasoning.trim()
      ? '；它只产出了推理过程、没有正文，这个模型多半不适合长文写作，换一个对话模型试试'
      : ''
    throw new Error(`模型「${info.model}」没有返回正文${reason}${hint}`)
  }
  return { text: result.text, model: info.model }
}

/** 从模型输出里取 JSON，容忍前后有说明文字或包了代码块。 */
export function extractJson(text) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text)
  const candidates = []
  if (fenced) candidates.push(fenced[1])
  candidates.push(text)
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) candidates.push(text.slice(start, end + 1))
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch {
      // 下一个候选
    }
  }
  throw new Error('模型没有返回可解析的 JSON')
}
