import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildExport } from '../src/publish/export.js'

test('发布包：X thread 分段、置顶评论 comment.md 与发布后清单', async () => {
  const baseDir = await mkdtemp(join(tmpdir(), 'sd-export-'))
  try {
    await mkdir(join(baseDir, 'renders'), { recursive: true })
    await mkdir(join(baseDir, 'covers'), { recursive: true })
    await mkdir(join(baseDir, 'clips'), { recursive: true })
    await writeFile(join(baseDir, 'renders', 'v.mp4'), 'fake-video')
    await writeFile(join(baseDir, 'covers', '01.png'), 'fake-cover')
    await writeFile(join(baseDir, 'covers', '02.png'), 'fake-card')
    await writeFile(join(baseDir, 'clips', 'x-main-60s.mp4'), 'fake-clip')
    const result = await buildExport({
      baseDir,
      item: { id: 'item_export', title: '测试项目', render: { path: 'renders/v.mp4', secs: 30 } },
      publish: {
        cover: null,
        variants: {
          x: { text: '主帖', posts: ['主帖', '回复一'] },
          xiaohongshu: { title: '标题', body: '正文提到置顶评论', tags: ['唐朝'], comment: '装法见评论' },
        },
        clip: { path: 'clips/x-main-60s.mp4', start: 0, secs: 60 },
        cards: [
          { path: 'covers/01.png', title: '封面', kind: 'cover' },
          { path: 'covers/02.png', title: '第一幕', kind: 'segment' },
        ],
      },
      targets: ['xiaohongshu', 'x'],
      ruleVersion: 'test',
    })
    const names = result.files.map(file => file.name)
    assert.ok(names.includes('xiaohongshu/comment.md'))
    assert.ok(names.includes('xiaohongshu/cards/01.png'))
    assert.ok(names.includes('x/video-60s.mp4'))
    const xCopy = await readFile(join(result.absDir, 'x/copy.md'), 'utf8')
    assert.match(xCopy, /【主帖】/)
    assert.match(xCopy, /【回复 1】/)
    const comment = await readFile(join(result.absDir, 'xiaohongshu/comment.md'), 'utf8')
    assert.equal(comment, '装法见评论\n')
    const checklist = await readFile(join(result.absDir, 'checklist.md'), 'utf8')
    assert.match(checklist, /发布后/)
    assert.match(checklist, /置顶/)
    assert.match(checklist, /cards\/01/)   // 图文卡片顺序
    assert.match(checklist, /video-60s/)  // X 主帖切片
  } finally {
    await rm(baseDir, { recursive: true, force: true })
  }
})
