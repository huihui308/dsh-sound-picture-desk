// Host HTTP 路由端到端回归：真实进程内起 http server，fake ctx 注册 handler，
// 覆盖媒体文件（sendFile / 中文名 / 路径穿越）、item-raw、readJson 校验与跨站拦截。
// 注意：HTTP 路由的 bug 在单测里调 route() 很难复现（URL 解码、header、流），所以走真请求。
import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ITEM_ID = 'bk_routes'
const RAW_TEXT = '这是一段原始材料，只应通过 item-raw 返回。'
// 1x1 透明 PNG（合法文件，只用来验证字节原样返回与 content-type 嗅探）
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)
const SAMPLE = Buffer.from('ID3 fake mp3 bytes for 中文名测试')

let home = ''
let server = null
let base = ''
let savedEnv = {}

async function probe(url, options) {
  return fetch(base + url, options)
}

function postJson(path, body, headers = {}) {
  return probe(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

before(async () => {
  home = await mkdtemp(join(tmpdir(), 'sound-picture-desk-routes-'))
  savedEnv = { HOME: process.env.HOME, DSH_HOME: process.env.DSH_HOME }
  // 必须在动态 import host.js 之前指到临时目录：store.js 在 Host 启动时按 DSH_HOME/HOME 建目录，
  // 绝不能碰真实用户的 ~/.dsh 和 ~/.story-video。
  process.env.HOME = home
  process.env.DSH_HOME = home

  const root = join(home, 'sound-picture-desk')
  const project = join(root, 'projects', ITEM_ID)
  await mkdir(join(project, 'images'), { recursive: true })
  await mkdir(join(project, 'samples'), { recursive: true })
  await writeFile(join(project, 'images', 's001.png'), PNG)
  await writeFile(join(project, 'samples', 'voice-白桦.mp3'), SAMPLE)
  await writeFile(join(root, 'state.json'), JSON.stringify({
    version: 1,
    settings: {},
    items: [{
      id: ITEM_ID,
      title: '路由测试项目',
      topic: '测试',
      rawText: RAW_TEXT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      log: [],
      segments: [{
        id: 'seg_1', idx: 0, text: '第一段', imagePrompt: '画面', audioPath: null, audioSecs: 0, imagePath: 'images/s001.png',
      }],
    }],
  }))

  const host = await import('../src/host.js')
  let handler = null
  const webServer = { register: entry => { handler = entry.handler; return () => {} } }
  const connection = { requestRejection: () => 0 }
  const ctx = {
    webServer,
    connection,
    get: name => (name === 'webServer' ? webServer : name === 'connection' ? connection : null),
    effect: fn => {
      const dispose = fn()
      return () => { try { dispose?.() } catch {} }
    },
  }
  host.default.apply(ctx)
  if (!handler) throw new Error('Host 没有注册 /sound-picture-desk 路由')
  server = createServer((req, res) => handler(req, res))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}/sound-picture-desk`
})

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve))
  if (home) await rm(home, { recursive: true, force: true })
  for (const key of ['HOME', 'DSH_HOME']) {
    if (savedEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedEnv[key]
  }
})

test('GET /media 静态图片：200、content-type 正确、字节一致', async () => {
  const res = await probe(`/media/${ITEM_ID}/images/s001.png`)
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('content-type'), 'image/png')
  const bytes = Buffer.from(await res.arrayBuffer())
  assert.deepEqual(bytes, PNG)
})

test('GET /media 中文文件名（percent-encoded）：200 且字节一致', async () => {
  const name = encodeURIComponent('voice-白桦.mp3')
  const res = await probe(`/media/${ITEM_ID}/samples/${name}`)
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('content-type'), 'audio/mpeg')
  const bytes = Buffer.from(await res.arrayBuffer())
  assert.deepEqual(bytes, SAMPLE)
})

test('GET /media 路径穿越（%2e%2e）：404，读不到 state.json', async () => {
  for (const path of [
    `/media/${ITEM_ID}/images/%2e%2e%2fstate.json`,
    `/media/${ITEM_ID}/images/..%2f..%2fstate.json`,
    `/media/${ITEM_ID}/images/%2e%2e`,
  ]) {
    const res = await probe(path)
    assert.equal(res.status, 404, path)
  }
})

test('POST item-raw：返回 rawText，且 /state 不泄露 rawText', async () => {
  const res = await postJson('/item-raw', { id: ITEM_ID })
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { rawText: RAW_TEXT })

  const stateRes = await probe('/state')
  assert.equal(stateRes.status, 200)
  const state = await stateRes.json()
  const item = state.items.find(row => row.id === ITEM_ID)
  assert.ok(item, '/state 里应该有这个项目')
  assert.equal(Object.prototype.hasOwnProperty.call(item, 'rawText'), false, '/state 不能带 rawText')
  assert.equal(state.secrets.ttsKey, false)
})

test('POST item-raw：项目不存在 → 404', async () => {
  const res = await postJson('/item-raw', { id: 'bk_nope' })
  assert.equal(res.status, 404)
})

test('POST 请求体 null / 数组 → 400（不能变成 500）', async () => {
  for (const body of ['null', '[]', '[1,2]']) {
    const res = await postJson('/settings', body)
    assert.equal(res.status, 400, 'body=' + body)
    const data = await res.json()
    assert.match(data.error, /请求体必须是 JSON 对象/)
  }
})

test('POST 跨站请求（sec-fetch-site: cross-site）→ 403', async () => {
  const res = await postJson('/item-raw', { id: ITEM_ID }, { 'sec-fetch-site': 'cross-site' })
  assert.equal(res.status, 403)
})

test('跨进程锁：另一个窗口持锁时 409 文案区分，cancel 说明本窗口停不了', async () => {
  const lockFile = join(home, 'sound-picture-desk', 'projects', ITEM_ID, '.task.lock')
  await writeFile(lockFile, JSON.stringify({ pid: process.pid, kind: 'render', at: new Date().toISOString() }))
  try {
    // 本进程没有这个任务的句柄（cancelTask 返回 false），但锁文件新鲜 → 是另一个 Host 在跑
    const cancel = await (await postJson('/cancel', { id: ITEM_ID })).json()
    assert.equal(cancel.cancelled, false)
    assert.equal(cancel.lockedByOther, true)
    assert.match(cancel.message, /另一个窗口/)

    const res = await postJson('/cover', { id: ITEM_ID })
    assert.equal(res.status, 409)
    const data = await res.json()
    assert.match(data.error, /另一个窗口正在跑这个任务/)
    // 本窗口没有停止句柄，不能照抄「点停止」那句误导用户
    assert.doesNotMatch(data.error, /点「停止」/)
  } finally {
    await rm(lockFile, { force: true })
  }
})

test('POST settings：segmentSeconds 超出 12–90 会被夹住', async () => {
  const res = await postJson('/settings', { settings: { segmentSeconds: 300 } })
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.equal(data.settings.segmentSeconds, 90)

  const low = await (await postJson('/settings', { settings: { segmentSeconds: 5 } })).json()
  assert.equal(low.settings.segmentSeconds, 12)
})
