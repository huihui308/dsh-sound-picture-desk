import test from 'node:test'
import assert from 'node:assert/strict'
import { TTS_PRESETS, voicesFor, MINIMAX_VOICES } from '../src/tts.js'

test('TTS 预设里有 MiniMax 官方，且带 provider 标记', () => {
  const mm = TTS_PRESETS.find(row => row.id === 'minimax')
  assert.ok(mm, '应该有一个 minimax 预设')
  assert.equal(mm.provider, 'minimax')
  assert.match(mm.endpoint, /minimax/)
})

test('声线按服务商切换，两套 id 不混用', () => {
  const mm = voicesFor('minimax').map(row => row.id)
  const mimo = voicesFor('mimo').map(row => row.id)
  assert.ok(mm.includes('presenter_male'))
  assert.ok(mm.includes('audiobook_male_1'))
  assert.ok(mimo.includes('白桦'))
  // 两套没有交集，拿错会直接 400
  assert.equal(mm.filter(id => mimo.includes(id)).length, 0)
})

test('未知服务商回落到 MiMo 那套', () => {
  assert.deepEqual(voicesFor('nope').map(r => r.id), voicesFor('mimo').map(r => r.id))
  assert.ok(MINIMAX_VOICES.length >= 6)
})
