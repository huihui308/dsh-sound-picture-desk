// 调 DeepSeek Harness 当前默认模型，不单独配置密钥。
// 模型不可用时抛错，由调用方决定降级——不静默返回半成品。
import { randomUUID } from 'node:crypto'

/**
 * 插件在会话之外调模型，自己带一个会话标识。有些网关按会话路由，
 * 缺了会话头会直接返回 400；DSH 会把 sessionId 映射成这类头。
 */
export const PLUGIN_SESSION_ID = `dsh-story-desk-${randomUUID()}`

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
      messages: [{ role: 'user', content: [{ type: 'text', text: user }], source: { kind: 'dsh-story-desk' } }],
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
        if (['error', 'aborted'].includes(chunk.reason?.kind)) {
          throw new Error(chunk.reason.failure?.message || '模型调用失败')
        }
        stopped = chunk.reason?.kind ?? null
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

  let result = await once(maxTokens)
  // 推理把预算烧光了：翻倍给一次机会，比直接报错有用
  const burned = !result.text.trim() && result.reasoning.trim()
    && ['max-tokens', 'length', 'max_tokens'].includes(String(result.stopped))
  if (burned) result = await once(Math.min(maxTokens * 3, 64000))

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
