// 小红书按意见修改：只改用户勾选的字段，返回“提案”，不直接落盘。
// 调用方（host）负责校验、存 revisions、等用户采用后再写回.
import { callModel, extractJson } from '../llm.js'
import { PLATFORMS } from './rules.js'

const SYSTEM = [
  '你是小红书短视频的文案编辑。',
  '用户会给你旁白稿、当前发布文案和一条修改意见。',
  '只修改用户勾选的字段，其他字段不要输出、不要顺手重写。',
  '只输出 JSON，不要解释，不要 Markdown 代码块。',
].join('\n')

const SCOPE_LABEL = { title: '标题', body: '正文', coverText: '封面大字' }
const SCOPE_ORDER = ['title', 'body', 'coverText']

function scriptText(item, maxChars = 12000) {
  const segments = Array.isArray(item?.segments) ? item.segments : []
  const text = segments.map(row => String(row.text ?? '').trim()).filter(Boolean).join('\n\n')
  return text.length > maxChars ? text.slice(0, maxChars) + '…' : text
}

function currentCopy(publish) {
  const variant = publish?.variants?.xiaohongshu ?? {}
  return [
    '当前小红书标题：' + String(variant.title ?? '').trim(),
    '当前小红书正文：',
    String(variant.body ?? '').trim(),
    '当前话题：' + (Array.isArray(variant.tags) ? variant.tags.join(' / ') : ''),
    '当前封面大字：' + String(publish?.cover?.title ?? '').trim(),
  ].join('\n')
}

function shapeFor(scope) {
  const shape = {}
  if (scope.includes('title')) shape.title = '改后的标题'
  if (scope.includes('body')) shape.body = '改后的正文'
  if (scope.includes('coverText')) shape.coverTexts = ['封面大字候选 1', '封面大字候选 2', '封面大字候选 3']
  shape.note = '一句话说明改了什么'
  return JSON.stringify(shape, null, 2)
}

function userPrompt({ item, publish, scope, feedback }) {
  const labels = scope.map(id => SCOPE_LABEL[id]).join(' / ')
  const lines = [
    '项目标题：' + String(item?.title ?? '').trim(),
    '',
    '旁白稿（事实来源）：',
    scriptText(item),
    '',
    currentCopy(publish),
    '',
    '这次只改：' + labels,
    '修改意见：' + feedback,
    '',
    '写作要求：',
    '1. 不编造旁白稿里没有的人物、数字、年代、因果；不确定就保持原意。',
    '2. 只改勾选字段；未勾选的字段不要出现在 JSON 里。',
    '3. 标题 ≤20 个字（含标点）；正文 ≤1000 字；封面大字每条 ≤20 个字。',
    '4. 封面大字给 3 条不同角度的候选，短、口语、能单独成立。',
    '5. 不要营销腔，不要“震惊”“必看”这类标题党词；不要照抄整段旁白。',
    '',
    '输出 JSON（键名严格如下）：',
    shapeFor(scope),
  ]
  return lines.join('\n')
}

function correctionPrompt({ item, publish, scope, feedback, previous, errors }) {
  return [
    '上次输出不能直接用，请修正后重新输出完整 JSON。',
    '',
    '问题：',
    ...errors.map(err => '- ' + err),
    '',
    '上次 JSON：',
    JSON.stringify(previous ?? {}),
    '',
    userPrompt({ item, publish, scope, feedback }),
  ].join('\n')
}

function textOf(value, max) {
  return String(value ?? '').trim().slice(0, max)
}

function codepointLength(value) {
  return [...String(value ?? '')].length
}

/** 校验并截取，只保留本次 scope 内的字段。 */
function validatePlan(scope, plan) {
  const src = plan && typeof plan === 'object' && !Array.isArray(plan) ? plan : {}
  const errors = []
  const after = {}

  if (scope.includes('title')) {
    const title = textOf(src.title, 120)
    if (!title) errors.push('标题不能为空')
    else if (codepointLength(title) > PLATFORMS.xiaohongshu.title.max) {
      errors.push('标题 ' + codepointLength(title) + ' 字，超过 ' + PLATFORMS.xiaohongshu.title.max + ' 字')
    } else after.title = title
  }

  if (scope.includes('body')) {
    const body = textOf(src.body, 5000)
    if (!body) errors.push('正文不能为空')
    else if (codepointLength(body) > PLATFORMS.xiaohongshu.body.max) {
      errors.push('正文 ' + codepointLength(body) + ' 字，超过 ' + PLATFORMS.xiaohongshu.body.max + ' 字')
    } else after.body = body
  }

  if (scope.includes('coverText')) {
    const raw = Array.isArray(src.coverTexts) ? src.coverTexts : []
    const seen = new Set()
    const candidates = []
    for (const row of raw) {
      const text = textOf(row, 60)
      if (!text) continue
      if (codepointLength(text) > 20) {
        errors.push('封面大字「' + text.slice(0, 12) + '…」超过 20 字')
        continue
      }
      if (seen.has(text)) continue
      seen.add(text)
      candidates.push(text)
      if (candidates.length >= 3) break
    }
    if (!candidates.length) errors.push('封面大字没有给出可用候选')
    else after.coverTexts = candidates
  }

  return { errors, after, note: textOf(src.note, 200) }
}

function parsePlan(text) {
  try { return extractJson(text) } catch { return null }
}

/**
 * 按意见生成修改提案。
 * 第一次不限/超限/非 JSON 时带错误反馈重试一次；仍失败就抛错，原内容不动。
 */
export async function reviseCopy(ctx, { item, publish, scope, feedback, route, signal, onProgress, call = callModel }) {
  const list = SCOPE_ORDER.filter(id => scope.includes(id))
  if (!list.length) throw new Error('没有选择要修改的字段')
  const cleanedFeedback = String(feedback ?? '').trim()
  if (cleanedFeedback.length < 2) throw new Error('修改意见太短，至少写两个字')

  const ask = user => call(ctx, {
    system: SYSTEM,
    user,
    maxTokens: 2500,
    signal,
    route,
    onProgress,
  })

  let response = await ask(userPrompt({ item, publish, scope: list, feedback: cleanedFeedback }))
  let plan = parsePlan(response.text)
  let result = plan
    ? validatePlan(list, plan)
    : { errors: ['没有返回可解析的 JSON'], after: {}, note: '' }

  if (result.errors.length) {
    response = await ask(correctionPrompt({
      item, publish, scope: list, feedback: cleanedFeedback,
      previous: plan, errors: result.errors,
    }))
    plan = parsePlan(response.text)
    result = plan
      ? validatePlan(list, plan)
      : { errors: ['没有返回可解析的 JSON'], after: {}, note: '' }
    if (result.errors.length) {
      throw new Error('按意见修改失败：' + result.errors.slice(0, 2).join('；'))
    }
  }

  return { after: result.after, note: result.note, model: response.model ?? null }
}
