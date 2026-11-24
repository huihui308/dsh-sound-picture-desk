import test from 'node:test'
import assert from 'node:assert/strict'
import {
  encoderInfo,
  isHardwareBroken,
  markHardwareBroken,
  resetHardwareBroken,
} from '../src/encoders.js'

test('硬件故障 latch 有 30 分钟 TTL：过期后允许重新尝试硬件', () => {
  const realNow = Date.now
  let now = realNow()
  Date.now = () => now
  try {
    resetHardwareBroken()
    assert.equal(isHardwareBroken(), false)

    markHardwareBroken('nvenc: OpenEncodeSessionEx failed')
    assert.equal(isHardwareBroken(), true)

    now += 29 * 60 * 1000
    assert.equal(isHardwareBroken(), true) // TTL 内仍视为坏

    now += 2 * 60 * 1000 // 31 分钟：超出 TTL
    assert.equal(isHardwareBroken(), false) // 自动失效，可以再试硬件

    // 过期后再次翻车会重新计时，而不是沿用旧状态
    markHardwareBroken('again')
    assert.equal(isHardwareBroken(), true)
  } finally {
    Date.now = realNow
    resetHardwareBroken()
  }
})

test('encoderInfo 暴露故障状态字段，原有字段保持不变', async () => {
  resetHardwareBroken()
  const info = await encoderInfo()
  assert.equal(typeof info.id, 'string')
  assert.equal(typeof info.label, 'string')
  assert.equal(typeof info.hardware, 'boolean')
  assert.equal(typeof info.forced, 'boolean')
  assert.equal(info.broken, false)
  assert.equal(info.brokenReason, null)
  assert.equal(info.brokenAt, null)

  markHardwareBroken('qsv: device not found')
  const broken = await encoderInfo()
  assert.equal(broken.broken, true)
  assert.equal(broken.brokenReason, 'qsv: device not found')
  assert.match(broken.brokenAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.equal(broken.id, info.id) // 探测结果不受 latch 影响
  resetHardwareBroken()
})

test('markHardwareBroken 在有效期内只告警一次，reset 后清空', () => {
  resetHardwareBroken()
  const originalWarn = console.warn
  const warnings = []
  console.warn = (...args) => warnings.push(args.map(String).join(' '))
  try {
    markHardwareBroken('第一把翻车')
    markHardwareBroken('第二把翻车')
    assert.equal(warnings.length, 1)
    assert.match(warnings[0], /第一把翻车/)
    assert.match(warnings[0], /30 分钟内不再尝试硬件/)

    resetHardwareBroken()
    assert.equal(isHardwareBroken(), false)
    markHardwareBroken('重置后再翻车')
    assert.equal(warnings.length, 2)
  } finally {
    console.warn = originalWarn
    resetHardwareBroken()
  }
})
