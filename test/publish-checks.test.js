import test from 'node:test'
import assert from 'node:assert/strict'
import { publishChecks } from '../src/host.js'

test('文案超限产生 error，视频超限只 warn', () => {
  const publish = {
    variants: {
      xiaohongshu: { title: '中'.repeat(21), body: '正文内容', tags: [] },
      x: { text: '一条正常帖子' },
    },
    cover: null,
  }
  const video = { secs: 200, bytes: 3 * 1024 ** 3, width: 1080, height: 1920 }
  const checks = publishChecks(publish, ['xiaohongshu', 'x'], video, false)
  const errors = checks.filter(row => row.state === 'error')
  assert.equal(errors.length, 1)
  assert.equal(errors[0].platform, 'xiaohongshu')
  assert.ok(checks.some(row => row.id === 'video-secs' && row.state === 'warn'))
  assert.ok(checks.some(row => row.id === 'video-bytes' && row.state === 'warn'))
})

test('文案都合规、只有视频超限时没有阻断项', () => {
  const publish = {
    variants: {
      xiaohongshu: { title: '正常标题', body: '正常正文', tags: ['唐朝'] },
      x: { text: '正常帖子' },
    },
    cover: { width: 1080, height: 1440 },
  }
  const checks = publishChecks(publish, ['xiaohongshu', 'x'], { secs: 200, bytes: 3 * 1024 ** 3, width: 1080, height: 1920 }, true)
  assert.equal(checks.filter(row => row.state === 'error').length, 0)
})
