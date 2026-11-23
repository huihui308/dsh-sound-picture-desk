// 工作台右侧的助手：带着当前项目的稿子聊天，必要时直接把改稿落到项目上。
// 模型跟随 DSH 当前默认模型，不单独配置。
import { callModel, extractJson, modelInfo } from './llm.js'
import { newId, stageOf } from './store.js'

const SYSTEM = `你是「声画工作台」里的助手。用户在做一个竖屏旁白成片，你帮他改稿、改画面描述、回答制作问题。

你拿到的项目内容是一段段旁白，每段还带一个画面描述。用户可能说"第三段太长""开头不够抓人""第二段画面改成夜戏"这类话。

规则：
- 说人话，短。不要复述用户已经知道的东西，不要列一堆注意事项。
- 要改稿就直接给改后的文字，不要只说"建议缩短"。
- 只改用户指的那几段，没提到的段落原样不动。
- 旁白保持讲故事口气：口语、短句、有扣子；真实人名年代官职不能编。
- 画面描述只写画面内容（主体、动作、环境、光、人数），不写文字和不存在的朝代标签。

输出格式：只输出一个 JSON 对象，不要别的话。
{"reply":"跟用户说的话，一两句","segments":[{"id":"原段落的 id","text":"改后的旁白","imagePrompt":"改后的画面描述"}]}
如果这次不需要改稿，segments 省略或给空数组。`

function projectBrief(item) {
  if (!item) return '（当前没有选中的项目）'
  const rows = item.segments.map((row, index) => [
    `#${index + 1} id=${row.id}`,
    `旁白：${row.text}`,
    row.imagePrompt ? `画面：${row.imagePrompt}` : null,
    row.audioSecs ? `已配音 ${Math.round(row.audioSecs)} 秒` : '未配音',
  ].filter(Boolean).join('\n'))
  return [
    `项目：${item.title || '未命名'}`,
    item.angle ? `立意：${item.angle}` : null,
    `阶段：${stageOf(item)}，共 ${item.segments.length} 段`,
    item.topic ? `题材：${item.topic}` : null,
    '',
    ...rows,
  ].filter(Boolean).join('\n')
}

/**
 * 一次对话。返回 { reply, applied, segments }。
 * @param {object} ctx - Cordis 上下文。
 * @param {object} store - 状态库。
 * @param {{itemId?: string, message: string}} body - 请求体。
 */
export async function chatTurn(ctx, store, body) {
  const message = String(body.message ?? '').trim()
  if (!message) throw Object.assign(new Error('消息为空'), { status: 400 })
  if (!modelInfo(ctx)) throw Object.assign(new Error('当前没有可用模型'), { status: 400 })

  const state = await store.read()
  const item = body.itemId ? state.items.find(row => row.id === body.itemId) : null
  // 历史按项目隔离：新记录带 itemId；没有 itemId 的旧记录按兼容处理（保留）
  const history = (state.chat ?? [])
    .filter(row => !row.itemId || row.itemId === body.itemId)
    .slice(-6)
  const historyText = history.length
    ? history.map(row => `${row.role === 'user' ? '用户' : '你'}：${row.text}`).join('\n')
    : '（还没有对话）'

  const user = [
    '当前项目：',
    projectBrief(item),
    '',
    '最近的对话：',
    historyText,
    '',
    `用户这次说：${message}`,
  ].join('\n')

  // 助手调用没有任务条可以停，给个硬超时，别让请求永远挂着
  const signal = AbortSignal.timeout(180_000)
  let text
  try {
    ({ text } = await callModel(ctx, { system: SYSTEM, user, maxTokens: 4000, signal }))
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw Object.assign(new Error('助手响应超时（3 分钟），换个更快的模型或把问题说短一点'), { status: 504 })
    }
    throw err
  }
  let plan
  try {
    plan = extractJson(text)
  } catch {
    plan = { reply: text.trim().slice(0, 2000), segments: [] }
  }
  const reply = String(plan.reply ?? '').trim() || '改好了。'
  const proposed = Array.isArray(plan.segments) ? plan.segments : []

  // 记录带上项目 id，读历史时才能按项目过滤（undefined 会被 JSON 丢掉，等同旧记录）
  const chatItemId = typeof body.itemId === 'string' ? body.itemId : undefined
  const chatRow = { id: newId('msg'), role: 'assistant', text: reply, at: new Date().toISOString(), itemId: chatItemId }
  const userRow = { id: newId('msg'), role: 'user', text: message, at: new Date().toISOString(), itemId: chatItemId }

  if (!item || !proposed.length) {
    await store.mutate(draft => {
      draft.chat = [...(draft.chat ?? []), userRow, chatRow].slice(-100)
      return null
    })
    return { reply, applied: 0, segments: [] }
  }

  // 只改给了 id 且确实变了的那几段；没提到的段不动，已有音画按需作废
  const applied = []
  const { state: next } = await store.mutate(draft => {
    const target = draft.items.find(row => row.id === item.id)
    if (target) {
      for (const proposal of proposed) {
        if (!proposal || typeof proposal !== 'object') continue
        const seg = target.segments.find(row => row.id === proposal.id)
        if (!seg) continue
        const text = typeof proposal.text === 'string' ? proposal.text.trim() : ''
        const prompt = typeof proposal.imagePrompt === 'string' ? proposal.imagePrompt.trim() : ''
        const textChanged = text && text !== seg.text
        const promptChanged = prompt && prompt !== seg.imagePrompt
        if (!textChanged && !promptChanged) continue
        if (textChanged) {
          seg.text = text
          // 文字变了，旧音频对不上，作废等重配
          seg.audioPath = null
          seg.audioSecs = 0
        }
        if (promptChanged) {
          seg.imagePrompt = prompt
          // 画面描述变了，旧图不一定还合适，标记失效但保留文件，由用户决定重出
          seg.imagePath = null
        }
        seg.error = null
        applied.push(seg.idx + 1)
      }
      if (applied.length) {
        target.render = null
        target.updatedAt = new Date().toISOString()
        target.log.push({ at: new Date().toISOString(), text: `助手改稿：第 ${applied.join('、')} 段` })
      }
    }
    draft.chat = [...(draft.chat ?? []), userRow, chatRow].slice(-100)
    return null
  })
  const target = next.items.find(row => row.id === item.id)
  return {
    reply,
    applied: applied.length,
    segments: target ? target.segments.map(row => ({
      id: row.id, idx: row.idx, text: row.text, imagePrompt: row.imagePrompt,
      imagePath: row.imagePath ?? null, audioPath: row.audioPath ?? null, audioSecs: row.audioSecs ?? 0,
    })) : [],
  }
}
