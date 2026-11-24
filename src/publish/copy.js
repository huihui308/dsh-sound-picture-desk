// 发布文案生成：把旁白稿改写成小红书 / X 两个平台的发布文案。
// 只负责生成和解析，不做落盘；调用方（host）决定怎么存、怎么报进度。
import { callModel, extractJson } from '../llm.js'
import { PLATFORMS, normalizeTargets, sanitizeVariant, validateCopy } from './rules.js'

const SYSTEM = [
  '你是中文短视频的多平台运营编辑。',
  '用户会给你一条竖屏旁白稿，你要把它改写成小红书和 X 两个平台的发布文案。',
  '只输出 JSON，不要解释，不要 Markdown 代码块以外的任何文字。',
].join('\n')

function scriptText(item, maxChars = 12000) {
  const segments = Array.isArray(item?.segments) ? item.segments : []
  const text = segments.map(row => String(row.text ?? '').trim()).filter(Boolean).join('\n\n')
  return text.length > maxChars ? text.slice(0, maxChars) + '…' : text
}

function userPrompt({ item, targets }) {
  const lines = []
  lines.push('项目标题：' + String(item?.title ?? '').trim())
  if (item?.topic) lines.push('主题：' + String(item.topic).trim())
  lines.push('')
  lines.push('旁白稿：')
  lines.push(scriptText(item))
  lines.push('')
  lines.push('目标平台与限制：')
  for (const id of targets) {
    if (id === 'xiaohongshu') {
      lines.push('- 小红书：标题 ≤20 个字符（含标点），正文 300–600 字、分 3–5 段、口语化、结尾留一句互动；话题 3–5 个，不带 # 号。输出字段 title / body / tags。')
    } else if (id === 'x') {
      lines.push('- X：写 2–4 条 thread（主帖 + 回复），每条都 ≤280 加权字符（中文按 2 计重）。主帖保留最关键的冲突、数字与因果；回复 1 放完整教程/时长，回复 2 放仓库和装法（不知道仓库地址时写「仓库见主页/置顶」，不要编 URL），回复 3 放 MIT 边界或正片提示。最多 2 个话题，话题用 # 号内联；不要外链。输出字段 posts（字符串数组，主帖在前，2–4 条）。')
    }
  }
  lines.push('')
  lines.push('写作要求：')
  lines.push('1. 不编造史料，关键数字、人名、因果都必须来自上面的旁白稿。')
  lines.push('2. 小红书不要写“标题：”这类标签，不要把话题重复写进正文；emoji 最多 2 个。')
  lines.push('3. 不要营销腔，不要“震惊”“必看”这类标题党词。')
  lines.push('4. 只输出 JSON，键名严格为下面这些：')
  const shape = {}
  for (const id of targets) {
    shape[id] = id === 'xiaohongshu' ? { title: '', body: '', tags: [''] } : { posts: ['', ''] }
  }
  lines.push(JSON.stringify(shape, null, 2))
  return lines.join('\n')
}

function feedbackPrompt({ item, targets, previous, issues }) {
  const lines = [
    '上一版没有通过平台限制，请修正后重新输出完整 JSON（不要只输出改动部分）。',
    '',
    '没通过的地方：',
  ]
  for (const issue of issues) {
    lines.push('- ' + issue.label + '：' + issue.detail + (issue.fix ? '（' + issue.fix + '）' : ''))
  }
  lines.push('')
  lines.push('上一版 JSON：')
  lines.push(JSON.stringify(previous))
  lines.push('')
  lines.push(userPrompt({ item, targets }))
  return lines.join('\n')
}

function parseVariants(text, targets) {
  const plan = extractJson(text)
  const variants = {}
  for (const id of targets) {
    const raw = plan && typeof plan === 'object' ? (plan[id] ?? (targets.length === 1 ? plan : null)) : null
    variants[id] = sanitizeVariant(id, raw && typeof raw === 'object' ? raw : {})
  }
  return variants
}

function parseOrNull(text, targets) {
  try { return parseVariants(text, targets) } catch { return null }
}

function jsonOnlyPrompt({ item, targets }) {
  return [
    '上一次输出不是可解析的 JSON。请严格只输出一个 JSON 对象，不要 Markdown 代码块、解释或任何前后缀。',
    '',
    userPrompt({ item, targets }),
  ].join('\n')
}

function blockingIssues(targets, variants) {
  const issues = []
  for (const id of targets) {
    for (const check of validateCopy(id, variants[id])) {
      if (check.state !== 'error') continue
      issues.push({ platform: id, label: PLATFORMS[id].label + '「' + check.label + '」', detail: check.detail, fix: check.fix })
    }
  }
  return issues
}

/** 超限总量：条数相同但超得更多时，别用重试版覆盖第一版。 */
function blockingScore(targets, variants) {
  let score = 0
  for (const id of targets) {
    for (const check of validateCopy(id, variants[id])) {
      if (check.state !== 'error') continue
      const match = /(\d+)\s*\/\s*(\d+)/.exec(check.detail)
      score += match ? Math.max(1, Number(match[1]) - Number(match[2])) : 1
    }
  }
  return score
}

/**
 * 生成发布文案。
 * 第一次有超限项时自动带上反馈重试一次；仍超限不抛错——交给界面标红让用户手动改。
 */
export async function generateCopyVariants(ctx, { item, targets, route, signal, onProgress, call = callModel }) {
  const list = normalizeTargets(targets)
  const ask = user => call(ctx, {
    system: SYSTEM,
    user,
    maxTokens: 3000,
    signal,
    route,
    onProgress,
  })

  // 第一轮不是 JSON 也要纠偏重试一次，而不是直接让整个任务失败
  let response = await ask(userPrompt({ item, targets: list }))
  let variants = parseOrNull(response.text, list)
  if (!variants) {
    response = await ask(jsonOnlyPrompt({ item, targets: list }))
    variants = parseOrNull(response.text, list)
    if (!variants) throw new Error('模型没有返回可解析的 JSON 文案，点「一键生成」再试一次')
  }
  let model = response.model ?? null
  let issues = blockingIssues(list, variants)
  let score = blockingScore(list, variants)

  if (issues.length) {
    try {
      const second = await ask(feedbackPrompt({ item, targets: list, previous: variants, issues }))
      const retried = parseOrNull(second.text, list)
      if (retried) {
        const retriedIssues = blockingIssues(list, retried)
        const retriedScore = blockingScore(list, retried)
        // 重试反而更差就保留第一版，别为了“重试过”牺牲内容
        if (retriedIssues.length < issues.length
          || (retriedIssues.length === issues.length && retriedScore < score)) {
          variants = retried
          issues = retriedIssues
          score = retriedScore
          model = second.model ?? model
        }
      }
    } catch (err) {
      // 用户点停止时中止错误必须往上冒泡：吞掉它会把「重试被打断」当成
      // 「重试失败」，接着按第一版继续往 publish.json 写。
      if (signal?.aborted) throw err
      // 重试请求失败/不可解析时保留第一版（超限项仍会标红让用户手改）
    }
  }
  // 写回由 host 负责；返回前再挡一次中止，避免把半成品文案当成成功结果交出去
  if (signal?.aborted) throw Object.assign(new Error('已停止'), { name: 'AbortError' })
  return { variants, model, issues }
}
