import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
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
    assert.equal(publish.targets.length, 1)
    assert.equal(publish.variants.xiaohongshu.tags.length, 1)
    assert.ok(publish.updatedAt)
    const again = await store.readPublish('item_x')
    assert.equal(again.variants.x.text, 'hello')
    assert.deepEqual(again.targets, ['x'])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
