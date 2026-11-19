// 持久化：$DSH_HOME/story-desk/state.json。桌面端与 Web 端读同一份数据，所以每次
// 写入前都按 mtime 判断是否需要重读，避免两个 Host 进程互相覆盖。
import { mkdir, readFile, rename, stat, writeFile, chmod } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

export function dshHome(env = process.env) {
  return env.DSH_HOME || join(homedir(), '.dsh')
}

export function newId(prefix = 'id') {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 12)}`
}

/** 说书流水线的阶段，顺序即推进顺序。 */
export const STAGES = ['idea', 'scripted', 'anchors', 'voiced', 'imaged', 'rendered']

export const STAGE_LABEL = {
  idea: '选题',
  scripted: '说书稿',
  voiced: '旁白',
  anchors: '参考图',
  imaged: '分镜图',
  rendered: '成片',
}

export const DEFAULT_SETTINGS = {
  voice: '白桦',
  visualStyle: 'cinematic',
  segmentSeconds: 40,
  trashDays: 7,
  renderWorkers: 0,
  coverInVideo: true,
  width: 1080,
  height: 1920,
  imageWidth: 1024,
  imageHeight: 1792,
  burnSubtitles: false,
  kenBurns: true,
  motion: 'zoom-in',
  grade: 'none',
  transition: 'none',
  intro: 'none',
  imageEndpoint: 'http://127.0.0.1:30021/v1',
  imageModel: 'qwen-image-2.1-turbo',
  ttsEndpoint: 'https://token-plan-cn.xiaomimimo.com/v1',
  ttsModel: 'mimo-v2.5-tts',
}

/** 每条时间轴分段都要齐了才算进入下一阶段，所以阶段是派生的，不单独存。 */
export function stageOf(item) {
  const segments = Array.isArray(item?.segments) ? item.segments : []
  if (!segments.length) return 'idea'
  if (item?.render?.path) return 'rendered'
  const allVoiced = segments.every(row => row.audioPath && row.audioSecs > 0)
  const allImaged = segments.every(row => row.imagePath)
  if (allVoiced && allImaged) return 'imaged'
  if (allVoiced) return 'voiced'
  return 'scripted'
}

export function emptyState() {
  return { version: 1, settings: { ...DEFAULT_SETTINGS }, items: [] }
}

/** 老的或无字段的 state 补齐结构，读一次就够。 */
export function migrateState(raw) {
  const state = raw && typeof raw === 'object' ? raw : emptyState()
  if (typeof state.version !== 'number') state.version = 1
  const before = state.settings && typeof state.settings === 'object' ? { ...state.settings } : {}
  state.settings = { ...DEFAULT_SETTINGS, ...before }
  // 旧版把平台通道单独存成两个字段，现在统一到 imageEndpoint/imageModel
  if (before.imageProvider === 'platform') {
    if (before.platformImageEndpoint) state.settings.imageEndpoint = before.platformImageEndpoint
    if (before.platformImageModel) state.settings.imageModel = before.platformImageModel
  }
  // 旧版还有「本机 /generate」这一档；本机服务同样提供 OpenAI 兼容接口，一并归到统一协议
  if (before.imageProvider === 'local') {
    const base = String(before.imageEndpoint || 'http://127.0.0.1:30021').replace(/\/+$/, '')
    state.settings.imageEndpoint = /\/v1$/.test(base) ? base : `${base}/v1`
    if (!state.settings.imageModel) state.settings.imageModel = 'qwen-image-2.1-turbo'
  }
  delete state.settings.imageProvider
  delete state.settings.platformImageEndpoint
  delete state.settings.platformImageModel
  state.items = Array.isArray(state.items) ? state.items : []
  for (const item of state.items) {
    item.segments = Array.isArray(item.segments) ? item.segments : []
    item.log = Array.isArray(item.log) ? item.log : []
    item.segments.forEach((row, index) => {
      row.idx = index
      if (typeof row.id !== 'string') row.id = newId('seg')
      row.text = typeof row.text === 'string' ? row.text : ''
      row.imagePrompt = typeof row.imagePrompt === 'string' ? row.imagePrompt : ''
    })
  }
  return state
}

export class Store {
  constructor(root = join(dshHome(), 'story-desk')) {
    this.root = root
    this.file = join(root, 'state.json')
    this.secretsFile = join(root, 'secrets.json')
    this.projectsDir = join(root, 'projects')
    this.state = null
    this.mtimeMs = 0
    this.queue = Promise.resolve()
  }

  async refresh() {
    await mkdir(this.projectsDir, { recursive: true })
    let info = null
    try {
      info = await stat(this.file)
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }
    // 文件没变就直接用内存里的，省掉一次解析
    if (this.state && info?.mtimeMs === this.mtimeMs) return this.state
    if (!info) {
      this.state = emptyState()
      this.mtimeMs = 0
      return this.state
    }
    const raw = await readFile(this.file, 'utf8')
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error('state.json 不是有效的 JSON，已停止写入以免覆盖')
    }
    this.state = migrateState(parsed)
    this.mtimeMs = info.mtimeMs
    return this.state
  }

  async read() {
    return this.refresh()
  }

  async write(state) {
    await mkdir(this.projectsDir, { recursive: true })
    const tmp = `${this.file}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(state, null, 2))
    await rename(tmp, this.file)
    const info = await stat(this.file)
    this.state = state
    this.mtimeMs = info.mtimeMs
    return state
  }

  /**
   * 读-改-写串行化。mutator 直接改 draft，返回值会连同最新 state 一起返回。
   * 两个 Host 进程并发写同一份文件时，后写的按最新 mtime 重读，不会丢别人的改动。
   */
  async mutate(mutator) {
    const run = async () => {
      const state = await this.refresh()
      const draft = structuredClone(state)
      const result = await mutator(draft)
      await this.write(draft)
      return { result, state: draft }
    }
    const next = this.queue.then(run, run)
    // 队列本身不能因为一次失败就断掉
    this.queue = next.then(() => undefined, () => undefined)
    return next
  }

  itemDir(itemId) {
    return join(this.projectsDir, itemId)
  }

  async ensureItemDirs(itemId) {
    const base = this.itemDir(itemId)
    const dirs = {
      base,
      images: join(base, 'images'),
      audio: join(base, 'audio'),
      renders: join(base, 'renders'),
      work: join(base, 'work'),
    }
    for (const dir of Object.values(dirs)) await mkdir(dir, { recursive: true })
    return dirs
  }

  // ---------------------------------------------------------------- secrets
  /** 密钥只落在 $DSH_HOME/story-desk/secrets.json（0600），不进 state.json。 */
  async readSecrets() {
    let parsed
    try {
      parsed = JSON.parse(await readFile(this.secretsFile, 'utf8'))
    } catch {
      return {}
    }
    if (!parsed || typeof parsed !== 'object') return {}
    // 早期版本把生图密钥写成 platformImageKey，读的时候统一成 imageKey
    if (!parsed.imageKey && parsed.platformImageKey) parsed.imageKey = parsed.platformImageKey
    return parsed
  }

  async writeSecrets(patch) {
    const current = await this.readSecrets()
    const next = { ...current, ...patch }
    for (const key of Object.keys(next)) {
      if (next[key] === '' || next[key] === null) delete next[key]
    }
    await mkdir(this.root, { recursive: true })
    const tmp = `${this.secretsFile}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(next, null, 2), { mode: 0o600 })
    await rename(tmp, this.secretsFile)
    await chmod(this.secretsFile, 0o600).catch(() => {})
    return next
  }

  /** 从 story-video-pipeline 已经配好的密钥导入一次，省得用户重填。 */
  async importLegacySecrets() {
    const current = await this.readSecrets()
    if (current.ttsKey || current.imageKey) return current
    const legacy = join(homedir(), '.story-video', 'secrets.env')
    let text
    try {
      text = await readFile(legacy, 'utf8')
    } catch {
      return current
    }
    const env = {}
    for (const line of text.split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/.exec(line)
      if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
    const patch = {}
    if (env.TTS_API_KEY) patch.ttsKey = env.TTS_API_KEY
    if (env.IMAGE_API_KEY) patch.imageKey = env.IMAGE_API_KEY
    if (!Object.keys(patch).length) return current
    return this.writeSecrets(patch)
  }
}
