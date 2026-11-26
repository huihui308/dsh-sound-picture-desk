import test from 'node:test'
import assert from 'node:assert/strict'
import { buildIdeaPrompt, normalizeIdeaCandidates, HOOK_HINTS } from '../src/ideas.js'

test('buildIdeaPrompt：把格子、钩子、已有标题都写进去', () => {
  const text = buildIdeaPrompt({ era: '隋唐', field: '科技', hook: '反常', taken: ['甲', '乙'] })
  assert.match(text, /隋唐 · 科技/)
  assert.match(text, /钩子方向：反常/)
  assert.ok(text.includes(HOOK_HINTS['反常']), '应该带上钩子的说明文字')
  assert.match(text, /1\. 甲/)
  assert.match(text, /2\. 乙/)
})

test('buildIdeaPrompt：空池子给明确占位，不留空行', () => {
  const text = buildIdeaPrompt({ era: '', field: '', hook: '' })
  assert.match(text, /不限地域 \/ 时代 \/ 领域/)
  assert.match(text, /池子还是空的/)
  assert.match(text, /钩子方向：不限/)
})

test('normalizeIdeaCandidates：滤掉空标题、截断超长、限制条数', () => {
  const out = normalizeIdeaCandidates({
    ideas: [
      { title: '  有一条  ', angle: '角度', source: '《旧唐书》' },
      { title: '   ', angle: '没有标题' },
      { title: 'x'.repeat(200), angle: 'y'.repeat(400) },
    ],
  }, 2)
  assert.equal(out.length, 2)
  assert.equal(out[0].title, '有一条')
  assert.equal(out[0].source, '《旧唐书》')
  assert.equal(out[1].title.length, 120)
  assert.equal(out[1].angle.length, 300)
})

test('normalizeIdeaCandidates：结构不对时给空数组，不抛', () => {
  assert.deepEqual(normalizeIdeaCandidates(null), [])
  assert.deepEqual(normalizeIdeaCandidates({ ideas: 'nope' }), [])
  assert.deepEqual(normalizeIdeaCandidates({}), [])
})
