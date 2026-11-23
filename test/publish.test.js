import test from 'node:test'
import assert from 'node:assert/strict'
import {
  weightedLength, validateCopy, validateVideo, normalizeTargets, normalizePublish,
  sanitizeVariant, composeCopy, countVariant, formatDuration, formatBytes, variantIsEmpty,
} from '../src/publish/rules.js'

test('X 加权长度按官方口径', () => {
  assert.equal(weightedLength('测试'), 4)
  assert.equal(weightedLength('abc'), 3)
  assert.equal(weightedLength('看 https://example.com/a 好'), 29)
  assert.equal(weightedLength('😀'), 2)
})

test('小红书标题与正文限制', () => {
  const good = validateCopy('xiaohongshu', {
    title: '玄武门那一夜，李世民到底赌赢了什么',
    body: '正文',
    tags: ['唐朝'],
  })
  assert.equal(good.find(row => row.id === 'title').state, 'ok')
  const bad = validateCopy('xiaohongshu', { title: '中'.repeat(21), body: '', tags: [] })
  assert.equal(bad.find(row => row.id === 'title').state, 'error')
  assert.equal(bad.find(row => row.id === 'body').state, 'error')
})

test('X 超过 280 加权字符要拦', () => {
  assert.equal(validateCopy('x', { text: '中'.repeat(140) })[0].state, 'ok')
  assert.equal(validateCopy('x', { text: '中'.repeat(141) })[0].state, 'error')
})

test('emoji 标题按码点计数，客户端与服务端同口径', () => {
  const title = '中'.repeat(19) + '😀'
  const checks = validateCopy('xiaohongshu', { title, body: '正文', tags: [] })
  assert.equal([...title].length, 20)
  assert.equal(checks.find(row => row.id === 'title').state, 'ok')
  assert.equal(checks.find(row => row.id === 'title').detail, '20/20 字')
})

test('视频检查：超时长/超大小只 warn，时长读不出也要提示', () => {
  const over = validateVideo('x', { secs: 200, bytes: 3 * 1024 ** 3, width: 1080, height: 1920 })
  assert.equal(over.filter(row => row.state === 'error').length, 0)
  assert.equal(over.find(row => row.id === 'video-secs').state, 'warn')
  assert.equal(over.find(row => row.id === 'video-bytes').state, 'warn')
  const unknown = validateVideo('xiaohongshu', { secs: 0, bytes: 1024, width: 1080, height: 1920 })
  assert.equal(unknown.find(row => row.id === 'video-secs').state, 'warn')
  assert.match(unknown.find(row => row.id === 'video-secs').detail, /读不出/)
})

test('老 publish.json 的窄 targets 读出来会修正为双平台', () => {
  const publish = normalizePublish({ targets: ['xiaohongshu'], variants: { x: { text: 'hi' } } })
  assert.deepEqual(publish.targets, ['xiaohongshu', 'x'])
  assert.equal(publish.variants.x.text, 'hi')
})

test('revisions 与封面排版字段可归一化', () => {
  const publish = normalizePublish({
    cover: { path: 'covers/a.png', title: '大字', layout: 'top', fontScale: 1.2, textSource: 'manual', sourceRef: 'segment:s1' },
    revisions: [
      { id: 'r1', at: '2026-11-23T06:00:00.000Z', scope: ['title'], feedback: '改短', status: 'accepted', before: { title: '旧' }, after: { title: '新' } },
      { id: 'r2', scope: ['nope'], feedback: 'x', status: 'proposed' },
    ],
  })
  assert.equal(publish.cover.layout, 'top')
  assert.equal(publish.cover.fontScale, 1.2)
  assert.equal(publish.cover.textSource, 'manual')
  assert.equal(publish.cover.sourceRef, 'segment:s1')
  assert.equal(publish.revisions.length, 1)
  assert.equal(publish.revisions[0].status, 'accepted')
  assert.equal(publish.revisions[0].after.title, '新')
})

test('variantIsEmpty 覆盖两平台', () => {
  assert.equal(variantIsEmpty('x', { text: '  ' }), true)
  assert.equal(variantIsEmpty('x', { text: 'hi' }), false)
  assert.equal(variantIsEmpty('xiaohongshu', { title: '', body: '正文' }), false)
  assert.equal(variantIsEmpty('xiaohongshu', { title: '', body: '', tags: ['a'] }), true)
})

test('目标平台归一化', () => {
  assert.deepEqual(normalizeTargets(['x', 'nope']), ['x'])
  assert.deepEqual(normalizeTargets([]), ['xiaohongshu', 'x'])
  assert.deepEqual(normalizeTargets('x'), ['xiaohongshu', 'x'])
})

test('publish.json 空输入也能得到完整结构', () => {
  const empty = normalizePublish(null)
  assert.equal(empty.schemaVersion, 1)
  assert.deepEqual(empty.targets, ['xiaohongshu', 'x'])
  assert.equal(empty.variants.xiaohongshu.title, '')
  assert.deepEqual(empty.variants.xiaohongshu.tags, [])
  assert.equal(empty.cover, null)
})

test('话题清洗：去 #、去重、限量', () => {
  const clean = sanitizeVariant('xiaohongshu', { title: 't', body: 'b', tags: ['#唐朝', '唐朝', ' 历史 ', ''] })
  assert.deepEqual(clean.tags, ['唐朝', '历史'])
})

test('复制文案按平台拼接', () => {
  const text = composeCopy('xiaohongshu', { title: '标题', body: '正文', tags: ['唐朝', '历史'] })
  assert.ok(text.includes('标题'))
  assert.ok(text.includes('#唐朝 #历史'))
  assert.equal(composeCopy('x', { text: '只有正文' }), '只有正文')
})

test('计数与格式化', () => {
  assert.deepEqual(countVariant('xiaohongshu', { title: '标题', body: '正文', tags: ['a'] }), { title: 2, body: 2, tags: 1 })
  assert.equal(countVariant('x', { text: '中' }).weighted, 2)
  assert.equal(formatDuration(141), '2:21')
  assert.equal(formatBytes(12.4 * 1024 * 1024), '12.4 MB')
})
