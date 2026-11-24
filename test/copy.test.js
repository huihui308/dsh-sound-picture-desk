import test from 'node:test'
import assert from 'node:assert/strict'
import { generateCopyVariants } from '../src/publish/copy.js'

function fakeModel(responses) {
  const calls = []
  const call = async (ctx, options) => {
    calls.push(options)
    const response = responses[calls.length - 1]
    if (response === undefined) throw new Error('unexpected extra call')
    // 允许塞 Error 实例：模拟模型调用在重试阶段被信号中止
    if (response instanceof Error) throw response
    return { text: response, model: 'test-model' }
  }
  return { call, calls }
}

const good = '{"xiaohongshu":{"title":"玄武门那一夜","body":"正文内容","tags":["唐朝"]}}'
const overLimit = '{"xiaohongshu":{"title":"' + '中'.repeat(21) + '","body":"正文内容","tags":[]}}'
const better = '{"xiaohongshu":{"title":"改短后的标题","body":"正文内容","tags":[]}}'

test('首轮超限 → 反馈重试，采用更好的第二版', async () => {
  const { call, calls } = fakeModel([overLimit, better])
  const result = await generateCopyVariants({}, { item: { title: 't', segments: [{ text: '旁白' }] }, targets: ['xiaohongshu'], call })
  assert.equal(result.variants.xiaohongshu.title, '改短后的标题')
  assert.equal(result.issues.length, 0)
  assert.equal(calls.length, 2)
  assert.match(calls[1].user, /没有通过平台限制/)
})

test('重试更差时保留第一版', async () => {
  const worse = '{"xiaohongshu":{"title":"' + '中'.repeat(30) + '","body":"正文内容","tags":[]}}'
  const { call } = fakeModel([overLimit, worse])
  const result = await generateCopyVariants({}, { item: { title: 't', segments: [{ text: '旁白' }] }, targets: ['xiaohongshu'], call })
  assert.equal([...result.variants.xiaohongshu.title].length, 21)
  assert.equal(result.issues.length, 1)
})

test('首轮不是 JSON 会纠偏重试一次', async () => {
  const { call, calls } = fakeModel(['这不是 JSON', good])
  const result = await generateCopyVariants({}, { item: { title: 't', segments: [{ text: '旁白' }] }, targets: ['xiaohongshu'], call })
  assert.equal(result.variants.xiaohongshu.title, '玄武门那一夜')
  assert.equal(calls.length, 2)
  assert.match(calls[1].user, /严格只输出一个 JSON 对象/)
})

test('超限后重试又不可解析时保留第一版', async () => {
  const { call } = fakeModel([overLimit, 'still not json'])
  const result = await generateCopyVariants({}, { item: { title: 't', segments: [{ text: '旁白' }] }, targets: ['xiaohongshu'], call })
  assert.equal([...result.variants.xiaohongshu.title].length, 21)
  assert.equal(result.issues.length, 1)
})

test('重试阶段被信号中止时 AbortError 要冒泡，不能当成“保留第一版”', async () => {
  const abort = Object.assign(new Error('已停止'), { name: 'AbortError' })
  const { call, calls } = fakeModel([overLimit, abort])
  await assert.rejects(
    generateCopyVariants({}, {
      item: { title: 't', segments: [{ text: '旁白' }] },
      targets: ['xiaohongshu'],
      call,
      signal: { aborted: true },
    }),
    err => err.name === 'AbortError' && /已停止/.test(err.message),
  )
  // 第一次正常返回、第二次（反馈重试）才中止，确认不是首轮直接失败
  assert.equal(calls.length, 2)
})

test('两轮都不是 JSON 才报错', async () => {
  const { call } = fakeModel(['nope', 'nope again'])
  await assert.rejects(
    generateCopyVariants({}, { item: { title: 't', segments: [{ text: '旁白' }] }, targets: ['xiaohongshu'], call }),
    /没有返回可解析的 JSON/,
  )
})
