import test from 'node:test'
import assert from 'node:assert/strict'
import { matchModelName } from '../src/images.js'

test('原名命中就直接用', () => {
  assert.equal(matchModelName(['a', 'b'], 'b'), 'b')
})

test('大小写不同也能纠正', () => {
  assert.equal(
    matchModelName(['qwen-image-2.1-turbo', 'qwen-image'], 'Qwen-Image-2.1-Turbo'),
    'qwen-image-2.1-turbo',
  )
})

test('驼峰有语义的名字保持原样返回', () => {
  // 原名在列表里时不做任何改写
  assert.equal(matchModelName(['MiniMax-H3-Image-Highspeed'], 'MiniMax-H3-Image-Highspeed'), 'MiniMax-H3-Image-Highspeed')
})

test('找不到就返回 null，不乱猜', () => {
  assert.equal(matchModelName(['a', 'b'], 'zzz'), null)
  assert.equal(matchModelName([], 'a'), null)
  assert.equal(matchModelName(null, 'a'), null)
  assert.equal(matchModelName(['a'], ''), null)
})
