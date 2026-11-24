import test from 'node:test'
import assert from 'node:assert/strict'
import { reviseCopy } from '../src/publish/revise.js'

const item = { title: '杯酒释兵权', segments: [{ text: '赵匡胤请石守信们喝酒，第二天禁军将领集体请辞。' }] }
const publish = {
  variants: { xiaohongshu: { title: '旧标题', body: '旧正文', tags: ['历史'] } },
  cover: { title: '旧封面大字' },
}

function fakeModel(responses) {
  const calls = []
  const call = async (ctx, options) => {
    calls.push(options)
    const text = responses[calls.length - 1]
    if (text === undefined) throw new Error('unexpected extra call')
    return { text, model: 'test-model' }
  }
  return { call, calls }
}

test('只改标题：输出只包含 title，不碰正文', async () => {
  const { call, calls } = fakeModel(['{"title":"一杯酒，换掉了禁军","note":"改短了"}'])
  const result = await reviseCopy({}, { item, publish, scope: ['title'], feedback: '改短一点', call })
  assert.equal(result.after.title, '一杯酒，换掉了禁军')
  assert.equal(result.after.body, undefined)
  assert.equal(result.note, '改短了')
  assert.equal(calls.length, 1)
  assert.match(calls[0].user, /这次只改：标题/)
})

test('标题超限会带错误反馈重试一次', async () => {
  const longTitle = '中'.repeat(21)
  const { call, calls } = fakeModel([
    JSON.stringify({ title: longTitle }),
    JSON.stringify({ title: '改短后的标题' }),
  ])
  const result = await reviseCopy({}, { item, publish, scope: ['title'], feedback: '短一点', call })
  assert.equal(result.after.title, '改短后的标题')
  assert.equal(calls.length, 2)
  assert.match(calls[1].user, /超过 20 字/)
})

test('第一次不是 JSON 会纠偏重试', async () => {
  const { call, calls } = fakeModel(['不是 JSON', '{"body":"新正文"}'])
  const result = await reviseCopy({}, { item, publish, scope: ['body'], feedback: '重写正文', call })
  assert.equal(result.after.body, '新正文')
  assert.equal(calls.length, 2)
})

test('封面大字返回 3 条候选并去重', async () => {
  const { call } = fakeModel([JSON.stringify({ coverTexts: ['一杯酒换三百年', '一杯酒换三百年', '赵匡胤最睡不着的一夜'] })])
  const result = await reviseCopy({}, { item, publish, scope: ['coverText'], feedback: '换一版封面字', call })
  assert.deepEqual(result.after.coverTexts, ['一杯酒换三百年', '赵匡胤最睡不着的一夜'])
})

test('两轮都不合格就报错，不返回坏提案', async () => {
  const { call } = fakeModel(['{}', '{}'])
  await assert.rejects(
    reviseCopy({}, { item, publish, scope: ['title'], feedback: '改标题', call }),
    /按意见修改失败/,
  )
})

test('没有勾选字段 / 意见太短直接拒绝', async () => {
  const { call } = fakeModel(['{}'])
  await assert.rejects(reviseCopy({}, { item, publish, scope: [], feedback: '改', call }), /没有选择/)
  await assert.rejects(reviseCopy({}, { item, publish, scope: ['title'], feedback: '改', call }), /太短/)
})
