import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, stat, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildExport } from '../src/publish/export.js'

test('发布包结构、文案与清单', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sd-export-'))
  try {
    await mkdir(join(root, 'renders'), { recursive: true })
    await mkdir(join(root, 'covers'), { recursive: true })
    await writeFile(join(root, 'renders', 'video.mp4'), Buffer.alloc(1024, 1))
    await writeFile(join(root, 'covers', 'cover-1.png'), Buffer.alloc(64, 2))
    const item = { id: 'item_1', title: '玄武门之夜', render: { path: 'renders/video.mp4', secs: 141, at: '2026-11-23T01:00:00.000Z' } }
    const publish = {
      variants: {
        xiaohongshu: { title: '玄武门那一夜，李世民到底赌赢了什么', body: '正文内容', tags: ['唐朝', '历史'] },
        x: { text: '玄武门那一夜，李世民赌的不是命，是时间。' },
      },
      cover: { path: 'covers/cover-1.png', width: 1080, height: 1440 },
    }
    const out = await buildExport({
      baseDir: root,
      item,
      publish,
      targets: ['xiaohongshu', 'x'],
      ruleVersion: 'test-rules',
      now: new Date('2026-11-23T10:15:00'),
    })
    assert.equal(out.relDir, 'exports/20261123-101500')
    const expected = [
      'xiaohongshu/video.mp4',
      'xiaohongshu/cover-1080x1440.png',
      'xiaohongshu/copy.md',
      'x/video.mp4',
      'x/copy.md',
      'README.md',
      'checklist.md',
      'manifest.json',
    ]
    for (const rel of expected) {
      const info = await stat(join(out.absDir, rel))
      assert.ok(info.size > 0, rel)
    }
    const copy = await readFile(join(out.absDir, 'xiaohongshu', 'copy.md'), 'utf8')
    assert.match(copy, /玄武门那一夜/)
    assert.match(copy, /#唐朝 #历史/)
    const manifest = JSON.parse(await readFile(join(out.absDir, 'manifest.json'), 'utf8'))
    assert.equal(manifest.ruleVersion, 'test-rules')
    assert.equal(manifest.targets.length, 2)
    assert.ok(manifest.files.length >= 7)
    assert.ok(manifest.files.every(file => typeof file.sha256 === 'string'))
    const video = await readFile(join(out.absDir, 'x', 'video.mp4'))
    assert.equal(video.length, 1024)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
