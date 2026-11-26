/**
 * 选题池的生成逻辑：拼 prompt、清候选。
 * 拆出来是为了能单测——host.js 里有插件注册副作用，测试不该 import 它。
 */

export const HOOK_HINTS = {
  反常: '大家都以为 A，其实正好相反',
  因果: '一件小事，怎么演成一场崩塌',
  数字: '一个数字背后，是多少人的代价',
  消失: '某个东西为什么突然没了',
  对照: '同一时代，两个人截然相反的结局',
  逆袭: '最没希望的那个最后赢了',
}

export const IDEA_SYSTEM = `你在给一个历史科普短视频账号想选题。每条要能撑起一条 5 到 10 分钟的竖屏旁白，靠细节和因果讲，不讲大道理。

硬要求：
1. 必须是具体的事件、制度、器物或人物。禁止「XX 的历史」「XX 为什么伟大」这类通史标题。
2. 标题 22 字以内，要带钩子；角度 45 字以内，说清反常识在哪。
3. 必须能追到具体文献。source 写书名加篇名（例：《旧唐书·食货志》）。确实想不出就留空字符串，绝对不许编。
4. 不要和已有选题重复，换个说法重述也不行。
5. 只写目标地区的历史。选了日本就只给日本的事件、日本的材料、日本的史料，不许拿中国或其他地区的史实顶替。
6. 标题里的专有名词（人名、地名、器物名）必须是你确信真实存在的；不确定就换一个确定的说法，不许生造。

只输出 JSON，不要别的文字：
{"ideas":[{"title":"...","angle":"...","source":"..."}]}`

/** 拼一次生成的 user 消息：格子 + 钩子 + 已有标题。 */
export function buildIdeaPrompt({ region, era, field, hook, hooks, taken = [], count = 5 }) {
  // hooks 是数组（多选），hook 是单个字符串（兼容老调用）
  const picks = (Array.isArray(hooks) ? hooks : (hook ? String(hook).split('/') : []))
    .map(name => String(name).trim())
    .filter(Boolean)
  const hint = picks.length
    ? `${picks.map(name => `${name}（${HOOK_HINTS[name] || '不限'}）`).join('、')}，这几种角度都要有，大致平均分`
    : '不限，但要有一个抓人的切口'
  const lines = taken.map((title, index) => `${index + 1}. ${title}`).join('\n')
  const scope = [region, era, field].filter(Boolean).join(' · ') || '不限地域 / 时代 / 领域'
  const lock = region ? `地域是硬约束：所有候选都必须属于${region}的历史，一条都不能跑题。\n` : ''
  return `补这个范围：${scope}
${lock}钩子方向：${hint}

已经有这些选题，必须避开：
${taken.length ? lines : '（池子还是空的）'}

给 ${count} 条。`
}

/**
 * 新增条目的参数归一。抽出来是因为 host 里手改容易丢行——
 * 上一次就是 title 那两行被吃掉，接口直接抛 "title is not defined"。
 */
export function normalizeNewIdea(input = {}) {
  // 传 null / 非对象也要给「先写个标题」，不能抛
  const body = input && typeof input === 'object' ? input : {}
  const title = String(body.title ?? '').trim().slice(0, 120)
  if (!title) return { error: '先写个标题' }
  return {
    idea: {
      title,
      angle: String(body.angle ?? '').trim().slice(0, 300),
      kind: String(body.kind ?? 'history').slice(0, 20),
      region: String(body.region ?? '').trim().slice(0, 20),
      era: String(body.era ?? '').trim().slice(0, 20),
      field: String(body.field ?? '').trim().slice(0, 20),
      // 多钩子存成 "反常/因果"，给 40 字余量
      hook: String(body.hook ?? '').trim().slice(0, 40),
      source: String(body.source ?? '').trim().slice(0, 300),
    },
  }
}

/** 模型输出的 JSON → 干净候选列表，过滤空标题、截断超长。 */
export function normalizeIdeaCandidates(parsed, limit = 6) {
  const list = Array.isArray(parsed?.ideas) ? parsed.ideas : []
  return list
    .map(row => ({
      title: String(row?.title ?? '').trim().slice(0, 120),
      angle: String(row?.angle ?? '').trim().slice(0, 300),
      source: String(row?.source ?? '').trim().slice(0, 300),
    }))
    .filter(row => row.title)
    .slice(0, limit)
}
