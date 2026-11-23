import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, stat, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildExport, exportSlug } from '../src/publish/export.js'

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

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'sd-export-'))
  await mkdir(join(root, 'renders'), { recursive: true })
  await mkdir(join(root, 'covers'), { recursive: true })
  await writeFile(join(root, 'renders', 'video.mp4'), Buffer.alloc(1024, 1))
  await writeFile(join(root, 'covers', 'cover-1.png'), Buffer.alloc(64, 2))
  return {
    root,
    item: { id: 'item_1', title: '玄武门之夜', render: { path: 'renders/video.mp4', secs: 141 } },
    publish: {
      variants: {
        xiaohongshu: { title: '标题', body: '正文内容', tags: ['唐朝'] },
        x: { text: '一条帖子' },
      },
      cover: { path: 'covers/cover-1.png', width: 1080, height: 1440 },
    },
  }
}

test('没有封面也能导出，README 说明封面未包含', async () => {
  const { root, item, publish } = await fixture()
  try {
    const out = await buildExport({
      baseDir: root, item, publish: { ...publish, cover: null },
      targets: ['xiaohongshu', 'x'], ruleVersion: 'test-rules',
      now: new Date('2026-11-23T11:00:00'),
    })
    const readme = await readFile(join(out.absDir, 'README.md'), 'utf8')
    assert.match(readme, /封面/)
    assert.equal(out.files.some(file => file.name.includes('cover-')), false)
    const manifest = JSON.parse(await readFile(join(out.absDir, 'manifest.json'), 'utf8'))
    assert.equal(manifest.files.some(file => file.path.includes('cover-')), false)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('同一秒导出两次落到不同目录，不覆盖旧包', async () => {
  const { root, item, publish } = await fixture()
  try {
    const args = { baseDir: root, item, publish, targets: ['xiaohongshu', 'x'], ruleVersion: 'r', now: new Date('2026-11-23T10:15:00') }
    const first = await buildExport(args)
    const second = await buildExport(args)
    assert.notEqual(first.relDir, second.relDir)
    assert.match(second.relDir, /-2$/)
    for (const rel of ['README.md', 'manifest.json', 'xiaohongshu/copy.md']) {
      assert.ok((await stat(join(first.absDir, rel))).size > 0, 'first ' + rel)
      assert.ok((await stat(join(second.absDir, rel))).size > 0, 'second ' + rel)
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('导出后重写母版不会隔空改写旧发布包', async () => {
  const { root, item, publish } = await fixture()
  try {
    const out = await buildExport({ baseDir: root, item, publish, targets: ['x'], ruleVersion: 'r', now: new Date('2026-11-23T10:20:00') })
    await writeFile(join(root, 'renders', 'video.mp4'), Buffer.alloc(2048, 9))
    const exported = await readFile(join(out.absDir, 'x', 'video.mp4'))
    assert.equal(exported.length, 1024)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('成片文件缺失时拒绝导出', async () => {
  const { root, item, publish } = await fixture()
  try {
    await rm(join(root, 'renders', 'video.mp4'))
    await assert.rejects(
      buildExport({ baseDir: root, item, publish, targets: ['x'], ruleVersion: 'r', now: new Date('2026-11-23T10:21:00') }),
      /成片文件不见了/,
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('exportSlug 清洗非法字符、空标题和 Windows 保留名', () => {
  assert.equal(exportSlug({ title: 'a/b:c*?' }), 'a_b_c_')
  assert.equal(exportSlug({ title: '' , id: 'item_9' }), 'item_9')
  assert.equal(exportSlug({ title: 'CON' }), '_CON')
  assert.ok(exportSlug({ title: 'x'.repeat(80) }).length <= 40)
})
