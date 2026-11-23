// 发布规则：小红书 / X。
// 数值是 2026-11-23 的口径，平台会变；集中放这里，改规则不用翻业务代码。
// 加权长度按 X 官方口径：CJK 2、URL 23、其余 1。
export const RULE_VERSION = '2026-11-23'

export const PLATFORM_ORDER = ['xiaohongshu', 'x']

export const PLATFORMS = {
  xiaohongshu: {
    id: 'xiaohongshu',
    label: '小红书',
    composeUrl: 'https://creator.xiaohongshu.com/publish/publish',
    summary: '视频 9:16 · 封面 3:4 · 标题 ≤20 字 · 正文 ≤1000 字',
    video: { width: 1080, height: 1920, ratio: '9:16', maxSecs: 15 * 60, maxBytes: 2 * 1024 ** 3 },
    cover: { width: 1080, height: 1440, ratio: '3:4' },
    title: { max: 20 },
    body: { max: 1000 },
    tags: { max: 10, recommended: '建议 3–5 个' },
  },
  x: {
    id: 'x',
    label: 'X（Twitter）',
    composeUrl: 'https://x.com/compose/post',
    summary: '单条 ≤280 加权字符 · 视频 ≤2:20 · 取首帧',
    video: { width: 1080, height: 1920, ratio: '9:16', maxSecs: 140, maxBytes: 512 * 1024 * 1024 },
    text: { maxWeighted: 280 },
  },
}

const URL_RE = /https?:\/\/[^\s]+/g
// 中日韩文字与全角标点：X 按 2 计重
const CJK_RE = /[\u1100-\u11FF\u2E80-\u303F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7AF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF]/

function plainWeight(text) {
  let total = 0
  for (const ch of String(text)) {
    total += ch.codePointAt(0) > 0xffff ? 2 : CJK_RE.test(ch) ? 2 : 1
  }
  return total
}

/** X 的加权长度：URL 固定 23，中日韩与 emoji 按 2，其余按 1。 */
export function weightedLength(value) {
  const text = String(value ?? '')
  let total = 0
  let last = 0
  for (const match of text.matchAll(URL_RE)) {
    total += plainWeight(text.slice(last, match.index))
    total += 23
    last = match.index + match[0].length
  }
  total += plainWeight(text.slice(last))
  return total
}

export function countVariant(platformId, variant = {}) {
  if (platformId === 'xiaohongshu') {
    return {
      title: [...String(variant.title ?? '')].length,
      body: [...String(variant.body ?? '')].length,
      tags: Array.isArray(variant.tags) ? variant.tags.length : 0,
    }
  }
  return { weighted: weightedLength(variant.text) }
}

export function formatDuration(value) {
  const total = Math.max(0, Math.round(Number(value) || 0))
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  return minutes + ':' + String(secs).padStart(2, '0')
}

export function formatBytes(value) {
  const bytes = Number(value) || 0
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + ' MB'
  return (bytes / 1024 ** 3).toFixed(2) + ' GB'
}

function row(id, label, state, detail, fix = '') {
  return { id, label, state, detail, fix }
}

/** 文案本身的硬限制：超了必须改，导出会被挡住。 */
export function validateCopy(platformId, variant = {}) {
  const platform = PLATFORMS[platformId]
  if (!platform) return []
  const checks = []
  if (platformId === 'xiaohongshu') {
    const title = String(variant.title ?? '').trim()
    const body = String(variant.body ?? '').trim()
    const tags = Array.isArray(variant.tags) ? variant.tags.filter(tag => String(tag).trim()) : []
    // 计数用码点，和界面 / countVariant 保持同一口径（emoji 只算 1 个字）
    const titleLen = [...title].length
    const bodyLen = [...body].length
    if (!title) checks.push(row('title', '小红书标题', 'error', '还没填', '写一个 20 字以内的标题'))
    else if (titleLen > platform.title.max) {
      checks.push(row('title', '小红书标题', 'error',
        titleLen + '/' + platform.title.max + ' 字',
        '删掉 ' + (titleLen - platform.title.max) + ' 个字'))
    } else checks.push(row('title', '小红书标题', 'ok', titleLen + '/' + platform.title.max + ' 字'))

    if (!body) checks.push(row('body', '小红书正文', 'error', '还没填', '写 300–600 字，分段'))
    else if (bodyLen > platform.body.max) {
      checks.push(row('body', '小红书正文', 'error',
        bodyLen + '/' + platform.body.max + ' 字',
        '删掉 ' + (bodyLen - platform.body.max) + ' 个字'))
    } else checks.push(row('body', '小红书正文', 'ok', bodyLen + '/' + platform.body.max + ' 字'))

    checks.push(row('tags', '小红书话题', tags.length > platform.tags.max ? 'error' : 'ok',
      tags.length + '/' + platform.tags.max + ' 个',
      tags.length > platform.tags.max ? '留 ' + platform.tags.max + ' 个以内' : ''))
  } else {
    const text = String(variant.text ?? '')
    const weighted = weightedLength(text)
    if (!text.trim()) checks.push(row('text', 'X 正文', 'error', '还没填', '写一条 280 加权字符以内的帖子'))
    else if (weighted > platform.text.maxWeighted) {
      checks.push(row('text', 'X 正文', 'error',
        weighted + '/' + platform.text.maxWeighted + '（加权）',
        '中文按 2 计重，得再删一些'))
    } else checks.push(row('text', 'X 正文', 'ok', weighted + '/' + platform.text.maxWeighted + '（加权）'))
  }
  return checks
}

/**
 * 视频维度的检查：尺寸/时长/大小。
 * 超出平台上限只警告不阻断——Premium 账号能发更长，用户自己判断。
 */
export function validateVideo(platformId, video = {}) {
  const platform = PLATFORMS[platformId]
  if (!platform || !video || typeof video !== 'object') return []
  const checks = []
  const width = Number(video.width) || platform.video.width
  const height = Number(video.height) || platform.video.height
  const secs = Number(video.secs) || 0
  const bytes = Number(video.bytes) || 0
  checks.push(row('video', '视频', 'ok',
    width + '×' + height + ' · ' + (secs ? formatDuration(secs) : '时长未知') + ' · ' + formatBytes(bytes)))
  if (secs <= 0) {
    checks.push(row('video-secs', '视频时长', 'warn',
      '读不出时长', '重新合成一次或检查 ffprobe；导出前无法核对平台时长上限'))
  }
  if (width / height > 1) {
    checks.push(row('video-ratio', '画面比例', 'warn',
      width + '×' + height + ' 是横屏', '这两个平台都建议竖屏 9:16'))
  }
  if (secs > 0 && secs > platform.video.maxSecs) {
    checks.push(row('video-secs', '视频时长', 'warn',
      formatDuration(secs) + ' / ' + formatDuration(platform.video.maxSecs),
      platformId === 'x' ? '非 Premium 上限 2:20；Premium 可忽略，否则切条' : '超过平台推荐上限，建议切条'))
  }
  if (bytes > platform.video.maxBytes) {
    checks.push(row('video-bytes', '视频大小', 'warn',
      formatBytes(bytes) + ' / ' + formatBytes(platform.video.maxBytes), '压缩后再传'))
  }
  return checks
}

export function normalizeTargets(value) {
  const list = Array.isArray(value) ? value.map(String) : []
  const hit = PLATFORM_ORDER.filter(id => list.includes(id))
  return hit.length ? hit : [...PLATFORM_ORDER]
}

export function emptyVariant(platformId) {
  return platformId === 'xiaohongshu' ? { title: '', body: '', tags: [] } : { text: '' }
}

/** 某个平台的文案是否为空。多平台生成时用来判断“模型漏了哪个平台”，避免拿空串覆盖旧文案。 */
export function variantIsEmpty(platformId, variant = {}) {
  if (platformId === 'x') return !String(variant.text ?? '').trim()
  return !String(variant.title ?? '').trim() && !String(variant.body ?? '').trim()
}

function textOf(value, max) {
  return String(value ?? '').slice(0, max).replace(/^\s+|\s+$/g, '')
}

/** 只收界面会用的字段，别把用户乱塞的结构写进 publish.json。 */
export function sanitizeVariant(platformId, input = {}) {
  if (platformId === 'xiaohongshu') {
    const tags = Array.isArray(input.tags) ? input.tags : []
    const cleanTags = []
    for (const tag of tags) {
      const text = String(tag ?? '').replace(/^#+/, '').trim().slice(0, 30)
      if (text && !cleanTags.includes(text)) cleanTags.push(text)
    }
    return { title: textOf(input.title, 200), body: textOf(input.body, 5000), tags: cleanTags.slice(0, 20) }
  }
  return { text: textOf(input.text, 5000) }
}

export function composeCopy(platformId, variant = {}) {
  if (platformId === 'xiaohongshu') {
    const parts = []
    const title = String(variant.title ?? '').trim()
    const body = String(variant.body ?? '').trim()
    const tags = (Array.isArray(variant.tags) ? variant.tags : [])
      .map(tag => '#' + String(tag).trim())
      .filter(tag => tag.length > 1)
    if (title) parts.push(title)
    if (body) parts.push(body)
    if (tags.length) parts.push(tags.join(' '))
    return parts.join('\n\n')
  }
  return String(variant.text ?? '').trim()
}

export function emptyPublish() {
  const variants = {}
  for (const id of PLATFORM_ORDER) variants[id] = emptyVariant(id)
  return {
    schemaVersion: 1,
    updatedAt: null,
    targets: [...PLATFORM_ORDER],
    variants,
    cover: null,
    exports: [],
    records: [],
    revisions: [],
  }
}

const REVISION_SCOPES = new Set(['title', 'body', 'coverText'])
const REVISION_STATUS = new Set(['proposed', 'accepted', 'rejected', 'reverted'])

function textSlice(value, max) {
  return String(value ?? '').slice(0, max)
}

function revisionBefore(value, scope) {
  const src = value && typeof value === 'object' ? value : {}
  const out = {}
  if (scope.includes('title')) out.title = textSlice(src.title, 5000)
  if (scope.includes('body')) out.body = textSlice(src.body, 20000)
  if (scope.includes('coverText')) out.coverText = textSlice(src.coverText, 100)
  return out
}

function revisionAfter(value, scope) {
  const src = value && typeof value === 'object' ? value : {}
  const out = {}
  if (scope.includes('title')) out.title = textSlice(src.title, 5000)
  if (scope.includes('body')) out.body = textSlice(src.body, 20000)
  if (scope.includes('coverText')) {
    out.coverTexts = (Array.isArray(src.coverTexts) ? src.coverTexts : [])
      .map(text => textSlice(text, 100).trim())
      .filter(Boolean)
      .slice(0, 5)
  }
  return out
}

function normalizeRevision(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const scope = (Array.isArray(src.scope) ? src.scope : []).filter(id => REVISION_SCOPES.has(id))
  const uniqScope = [...new Set(scope)]
  if (!uniqScope.length) return null
  const status = REVISION_STATUS.has(src.status) ? src.status : 'proposed'
  return {
    id: textSlice(src.id, 80),
    at: typeof src.at === 'string' ? src.at : null,
    scope: uniqScope,
    feedback: textSlice(src.feedback, 500),
    status,
    before: revisionBefore(src.before, uniqScope),
    after: revisionAfter(src.after, uniqScope),
    model: textSlice(src.model, 100),
    note: textSlice(src.note, 300),
    appliedAt: typeof src.appliedAt === 'string' ? src.appliedAt : null,
  }
}

/** 老项目没有 publish.json，读出来也要是完整结构，不需要迁移。 */
export function normalizePublish(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const next = emptyPublish()
  if (typeof src.schemaVersion === 'number') next.schemaVersion = src.schemaVersion
  if (typeof src.updatedAt === 'string') next.updatedAt = src.updatedAt
  // V1 界面上两个平台页签始终都在，发布范围固定为两平台；老文件里的窄 targets 在此顺带修正
  next.targets = [...PLATFORM_ORDER]
  for (const id of PLATFORM_ORDER) {
    const base = emptyVariant(id)
    next.variants[id] = sanitizeVariant(id, { ...base, ...(src.variants?.[id] ?? {}) })
  }
  if (src.cover && typeof src.cover === 'object' && typeof src.cover.path === 'string') {
    next.cover = {
      path: src.cover.path,
      title: String(src.cover.title ?? '').slice(0, 100),
      width: Number(src.cover.width) || PLATFORMS.xiaohongshu.cover.width,
      height: Number(src.cover.height) || PLATFORMS.xiaohongshu.cover.height,
      at: typeof src.cover.at === 'string' ? src.cover.at : null,
      sourceRef: typeof src.cover.sourceRef === 'string' ? src.cover.sourceRef.slice(0, 300) : '',
      layout: src.cover.layout === 'top' ? 'top' : 'bottom',
      fontScale: Math.min(1.6, Math.max(0.6, Number(src.cover.fontScale) || 1)),
      textSource: src.cover.textSource === 'manual' ? 'manual' : 'auto',
    }
  }
  next.exports = Array.isArray(src.exports)
    ? src.exports.filter(item => item && typeof item === 'object').slice(-20).map(item => ({
      at: typeof item.at === 'string' ? item.at : null,
      stamp: String(item.stamp ?? ''),
      dir: String(item.dir ?? ''),
      targets: normalizeTargets(item.targets),
    }))
    : []
  next.records = Array.isArray(src.records)
    ? src.records.filter(item => item && PLATFORMS[item.platform]).map(item => ({
      platform: item.platform,
      status: item.status === 'published' ? 'published' : 'pending',
      url: String(item.url ?? '').slice(0, 500),
      note: String(item.note ?? '').slice(0, 500),
      at: typeof item.at === 'string' ? item.at : null,
      metrics: item.metrics && typeof item.metrics === 'object' ? item.metrics : {},
    }))
    : []
  next.revisions = Array.isArray(src.revisions)
    ? src.revisions.map(normalizeRevision).filter(Boolean).slice(-30)
    : []
  return next
}
