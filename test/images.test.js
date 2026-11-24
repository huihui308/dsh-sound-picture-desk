import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPrompt, truncatePrompt } from '../src/images.js'
import { VISUAL_STYLES } from '../src/script.js'

test('短 prompt 不会被截断', () => {
  const prompt = buildPrompt('一个人站在城楼上，身后是夜色', 'cinematic')
  assert.equal(truncatePrompt(prompt, VISUAL_STYLES.cinematic.suffix), prompt)
})

test('长正文截断后风格后缀完整保留，总长不超过 1500', () => {
  const content = '中'.repeat(1600)
  const suffix = VISUAL_STYLES.cinematic.suffix
  const prompt = buildPrompt(content, 'cinematic')
  assert.ok(prompt.length > 1500)

  const out = truncatePrompt(prompt, suffix)
  assert.ok(out.length <= 1500, `截断后长度 ${out.length}`)
  assert.ok(out.endsWith(suffix), '风格后缀必须完整保留')
  assert.match(out, /vertical 9:16/)
  assert.match(out, /no text, no watermark/)
  assert.ok(out.startsWith(content.slice(0, 100)), '开头的内容描述要保留')
  // 防回归：旧行为从尾部盲截 1500 字，会正好把后缀切掉
  assert.equal(prompt.slice(0, 1500).endsWith(suffix), false)
})

test('不同风格的截断都保住自己的后缀', () => {
  const content = '雨'.repeat(2000)
  for (const [styleId, style] of Object.entries(VISUAL_STYLES)) {
    const out = truncatePrompt(buildPrompt(content, styleId), style.suffix)
    assert.ok(out.length <= 1500, `${styleId} 长度 ${out.length}`)
    assert.ok(out.endsWith(style.suffix), `${styleId} 后缀被截断`)
  }
})

test('没有后缀时按上限直接截断；边界情况不返回超长串', () => {
  assert.equal(truncatePrompt('a'.repeat(2000), '', 1500).length, 1500)
  // 后缀本身接近上限：至少保证风格词还在、总长不超限
  const longSuffix = 's'.repeat(1499)
  const out = truncatePrompt('内容'.repeat(100) + '. ' + longSuffix, longSuffix)
  assert.ok(out.length <= 1500)
  assert.ok(out.endsWith(longSuffix))
})
