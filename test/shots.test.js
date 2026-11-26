import test from 'node:test'
import assert from 'node:assert/strict'
import { SHOT_SIZES, buildShotPrompt, normalizeShots } from '../src/shots.js'

test('buildShotPrompt 带上原文与上一段构图', () => {
  const msg = buildShotPrompt({ text: '阿塔瓦尔帕坐在肩舆上。', prevImage: '广场全景' })
  assert.match(msg, /阿塔瓦尔帕/)
  assert.match(msg, /广场全景/)
  assert.match(msg, /别重复/)
})

test('normalizeShots 丢掉空描述、限制条数', () => {
  const shots = normalizeShots({ shots: [
    { desc: '全景', shot: 'wide' },
    { desc: '', shot: 'close' },
    { desc: '特写', shot: 'close' },
    { desc: '中景', shot: 'medium' },
    { desc: '超出的', shot: 'wide' },
  ] }, 3)
  assert.equal(shots.length, 3)
  assert.equal(shots[0].shot, 'wide')
})

test('相邻同景别会被换掉', () => {
  const shots = normalizeShots({ shots: [
    { desc: 'A', shot: 'medium' },
    { desc: 'B', shot: 'medium' },
    { desc: 'C', shot: 'medium' },
  ] })
  assert.equal(shots.length, 3)
  for (let i = 1; i < shots.length; i += 1) {
    assert.notEqual(shots[i].shot, shots[i - 1].shot, `第 ${i} 镜和上一镜撞了景别`)
  }
})

test('非法景别回落 medium，reuse 只认 true', () => {
  const shots = normalizeShots({ shots: [
    { desc: 'A', shot: 'ultra-wide', reuse: 'yes' },
    { desc: 'B', shot: 'close', reuse: true },
  ] })
  assert.equal(shots[0].shot, 'medium')
  assert.equal(shots[0].reuse, false)
  assert.equal(shots[1].reuse, true)
})

test('乱输入不炸', () => {
  assert.deepEqual(normalizeShots(null), [])
  assert.deepEqual(normalizeShots({ shots: 'nope' }), [])
  assert.deepEqual(normalizeShots({ shots: [null, 1, 'x'] }), [])
  assert.ok(SHOT_SIZES.includes('wide'))
})
