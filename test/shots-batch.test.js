import test from 'node:test'
import assert from 'node:assert/strict'
import { buildBatchPrompt, normalizeBatchShots } from '../src/shots.js'

test('buildBatchPrompt 给每段编号', () => {
  const msg = buildBatchPrompt([{ text: '第一段' }, { text: '第二段' }])
  assert.match(msg, /【第 0 段】\n第一段/)
  assert.match(msg, /【第 1 段】\n第二段/)
})

test('normalizeBatchShots 按 idx 对上号，越界丢弃', () => {
  const got = normalizeBatchShots({ segments: [
    { idx: 0, shots: [{ desc: 'A', shot: 'wide' }] },
    { idx: 2, shots: [{ desc: 'C', shot: 'close' }] },
    { idx: 9, shots: [{ desc: 'X', shot: 'close' }] },
  ] }, 3)
  assert.equal(got.size, 2)
  assert.equal(got.get(0)[0].desc, 'A')
  assert.equal(got.has(9), false)
})

test('空的或乱的结构不炸', () => {
  assert.equal(normalizeBatchShots(null, 5).size, 0)
  assert.equal(normalizeBatchShots({ segments: 'x' }, 5).size, 0)
  assert.equal(normalizeBatchShots({ segments: [{ idx: 'a', shots: [] }] }, 5).size, 0)
})
