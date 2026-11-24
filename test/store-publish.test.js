import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, mkdir, writeFile, readFile, utimes } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store } from '../src/store.js'

test('publish.json 默认结构、写入与重读', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sd-store-'))
  try {
    const store = new Store(root)
    const empty = await store.readPublish('item_x')
    assert.deepEqual(empty.targets, ['xiaohongshu', 'x'])
    assert.equal(empty.schemaVersion, 1)
    const { publish } = await store.mutatePublish('item_x', draft => {
      draft.targets = ['x']
      draft.variants.x.text = 'hello'
      draft.variants.xiaohongshu.tags = ['#唐朝', '唐朝']
      return null
    })
    // V1 固定双平台，旧数据里的窄 targets 会被修正
    assert.deepEqual(publish.targets, ['xiaohongshu', 'x'])
    assert.equal(publish.variants.xiaohongshu.tags.length, 1)
    assert.ok(publish.updatedAt)
    const again = await store.readPublish('item_x')
    assert.equal(again.variants.x.text, 'hello')
    assert.deepEqual(again.targets, ['xiaohongshu', 'x'])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('坏 JSON 会拒绝读写，不覆盖原文件', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sd-store-'))
  try {
    const store = new Store(root)
    const dir = join(root, 'projects', 'item_bad')
    await mkdir(dir, { recursive: true })
    const file = join(dir, 'publish.json')
    await writeFile(file, '{not json', 'utf8')
    await assert.rejects(store.readPublish('item_bad'), /不是有效的 JSON/)
    await assert.rejects(store.mutatePublish('item_bad', draft => draft), /不是有效的 JSON/)
    assert.equal(await readFile(file, 'utf8'), '{not json')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('陈旧锁会被接管，不会一直 503', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sd-store-'))
  try {
    const store = new Store(root)
    const dir = join(root, 'projects', 'item_lock')
    await mkdir(dir, { recursive: true })
    const lock = join(dir, 'publish.json.lock')
    await writeFile(lock, 'stale-pid', 'utf8')
    const old = new Date(Date.now() - 60_000)
    await utimes(lock, old, old)
    const { publish } = await store.mutatePublish('item_lock', draft => {
      draft.variants.x.text = 'after-stale'
      return null
    })
    assert.equal(publish.variants.x.text, 'after-stale')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('两次并发读改写都保留', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sd-store-'))
  try {
    const store = new Store(root)
    await Promise.all([
      store.mutatePublish('item_c', draft => { draft.variants.x.text = 'one'; return null }),
      store.mutatePublish('item_c', draft => { draft.variants.xiaohongshu.title = 'two'; return null }),
    ])
    const publish = await store.readPublish('item_c')
    assert.equal(publish.variants.x.text, 'one')
    assert.equal(publish.variants.xiaohongshu.title, 'two')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
