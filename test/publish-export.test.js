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
    await writeFile(join(baseDir, 'renders', 'v.mp4'), 'fake-video')
    const result = await buildExport({
      baseDir,
      item: { id: 'item_export', title: '测试项目', render: { path: 'renders/v.mp4', secs: 30 } },
      publish: {
        cover: null,
        variants: {
          x: { text: '主帖', posts: ['主帖', '回复一'] },
          xiaohongshu: { title: '标题', body: '正文提到置顶评论', tags: ['唐朝'], comment: '装法见评论' },
        },
      },
      targets: ['xiaohongshu', 'x'],
      ruleVersion: 'test',
    })
    const names = result.files.map(file => file.name)
    assert.ok(names.includes('xiaohongshu/comment.md'))
    const xCopy = await readFile(join(result.absDir, 'x/copy.md'), 'utf8')
    assert.match(xCopy, /【主帖】/)
    assert.match(xCopy, /【回复 1】/)
    const comment = await readFile(join(result.absDir, 'xiaohongshu/comment.md'), 'utf8')
    assert.equal(comment, '装法见评论\n')
    const checklist = await readFile(join(result.absDir, 'checklist.md'), 'utf8')
    assert.match(checklist, /发布后/)
    assert.match(checklist, /置顶/)
  } finally {
    await rm(baseDir, { recursive: true, force: true })
  }
})
