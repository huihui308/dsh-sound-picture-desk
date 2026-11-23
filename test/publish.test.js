import test from 'node:test'
import assert from 'node:assert/strict'
import {
  weightedLength, validateCopy, normalizeTargets, normalizePublish,
  sanitizeVariant, composeCopy, countVariant, formatDuration, formatBytes,
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
