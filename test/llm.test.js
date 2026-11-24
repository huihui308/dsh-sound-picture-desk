import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { callModel, extractJson } from '../src/llm.js'

/**
 * 假 llm：prepareCall 返回 {config, stream}，stream 是 async generator。
 * plans 可以是「每次调用给一组 chunk」的数组，也可以是 (index) => chunk[]。
 */
function fakeLlm(plans) {
  const calls = []
  return {
    calls,
    async prepareCall(config) {
      const index = calls.length
      calls.push(config)
      const events = typeof plans === 'function' ? plans(index) : plans[Math.min(index, plans.length - 1)]
      return {
        config: {},
        stream: async function* () {
          for (const event of events) yield event
        },
      }
    },
  }
}

function ctxFor(llm) {
  return { get: name => (name === 'llm' ? llm : null) }
}

const request = { system: 'system', user: 'user', maxTokens: 100, route: { provider: 'p', model: 'm' } }
const ok = text => [{ type: 'text-delta', text }, { type: 'finish', reason: { kind: 'stop' } }]
const failure = (kind, detail) => [{ type: 'finish', reason: { kind, failure: detail } }]

test('DSH 归一化失败码 TRANSPORT 视为瞬时：重试后成功', async () => {
  const llm = fakeLlm(index => index === 0
    ? failure('error', { message: 'fetch failed', code: 'TRANSPORT' })
    : ok('重试成功'))
  const result = await callModel(ctxFor(llm), request)
  assert.equal(result.text, '重试成功')
  assert.equal(llm.calls.length, 2)
})

test('DSH 归一化失败码 TIMEOUT 视为瞬时：重试后成功', async () => {
  const llm = fakeLlm(index => index === 0
    ? failure('error', { message: 'Request timed out', code: 'TIMEOUT' })
    : ok('超时后成功'))
  const result = await callModel(ctxFor(llm), request)
  assert.equal(result.text, '超时后成功')
  assert.equal(llm.calls.length, 2)
})

test('没有归一化 code 时仍按文本兜底（旧行为不变）', async () => {
  const llm = fakeLlm(index => index === 0
    ? failure('error', { message: 'fetch failed' }) // 老路径：只有文本，没有 code
    : ok('文本兜底成功'))
  const result = await callModel(ctxFor(llm), request)
  assert.equal(result.text, '文本兜底成功')
  assert.equal(llm.calls.length, 2)
})

test('aborted 帧抛 name=AbortError（上层才能映射「已停止 / 超时」提示）', async () => {
  const llm = fakeLlm([failure('aborted', { message: 'aborted by caller', code: 'ABORTED' })])
  await assert.rejects(callModel(ctxFor(llm), request), err => {
    assert.equal(err.name, 'AbortError')
    assert.equal(err.code, 'ABORTED')
    assert.equal(err.failure.code, 'ABORTED')
    return true
  })
  assert.equal(llm.calls.length, 1)
})

test('内容错误码不重试，code/status/failure 保留在错误上', async () => {
  const llm = fakeLlm([failure('error', { message: '内容不合格', code: 'INVALID', status: 400 })])
  await assert.rejects(callModel(ctxFor(llm), request), err => {
    assert.equal(err.code, 'INVALID')
    assert.equal(err.status, 400)
    assert.equal(err.failure.code, 'INVALID')
    assert.match(err.message, /内容不合格/)
    return true
  })
  assert.equal(llm.calls.length, 1)
})

test('瞬时失败重试用尽后写 model-errors.log（目录不存在也会先创建）', async () => {
  const home = await mkdtemp(join(tmpdir(), 'spd-llm-'))
  const previous = process.env.DSH_HOME
  process.env.DSH_HOME = home
  try {
    const llm = fakeLlm(() => failure('error', { message: 'fetch failed', code: 'TRANSPORT' }))
    await assert.rejects(callModel(ctxFor(llm), request), /fetch failed/)
    assert.equal(llm.calls.length, 3) // 首次 + 两次重试
    // appendFile 是异步的：轮询等它落盘
    let line = ''
    for (let attempt = 0; attempt < 40 && !line; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 50))
      line = await readFile(join(home, 'sound-picture-desk', 'model-errors.log'), 'utf8').catch(() => '')
    }
    assert.match(line, /"code":"TRANSPORT"/)
    assert.match(line, /"provider":"p"/)
  } finally {
    if (previous === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previous
    await rm(home, { recursive: true, force: true })
  }
})

test('extractJson 旧行为不变：纯 JSON / 代码块 / 前后有说明文字', () => {
  assert.deepEqual(extractJson('{"a":1}'), { a: 1 })
  assert.deepEqual(extractJson('说明\n\u0060\u0060\u0060json\n{"a":2}\n\u0060\u0060\u0060\n后面还有话'), { a: 2 })
  assert.deepEqual(extractJson('前缀 {"a":{"b":3}} 后缀'), { a: { b: 3 } })
  assert.throws(() => extractJson('这里没有 JSON'), /没有返回可解析的 JSON/)
})
