// 长任务进度：合成、出图、渲染都跑在后台，界面靠轮询看进度。
// 一个项目同时只允许一个任务在跑——它们都写同一个项目目录，并发只会互相踩。
// 桌面端与 Web 端是两个 Host 进程、读同一份 state，所以还要一把跨进程的任务锁。
import { closeSync, mkdirSync, openSync, readFileSync, rmSync, statSync, writeSync } from 'node:fs'
import { hostname } from 'node:os'
import { dirname, join } from 'node:path'

import { dshHome } from './store.js'

const tasks = new Map()

/** 跑完的任务保留一会儿给界面看结果，超过这个时长就从内存里清掉。 */
const KEEP_FINISHED_MS = 30 * 60 * 1000

function pruneFinished() {
  const cutoff = Date.now() - KEEP_FINISHED_MS
  for (const [id, task] of tasks) {
    if (task.running) continue
    const ended = task.finishedAt ? Date.parse(task.finishedAt) : 0
    if (ended && ended < cutoff) tasks.delete(id)
  }
}

export function taskOf(itemId) {
  return tasks.get(itemId) ?? null
}

/** 跨进程任务锁：项目目录里的 .task.lock；持锁进程已崩或 30 分钟没更新都算陈旧锁。 */
const TASK_LOCK_STALE_MS = 30 * 60 * 1000
/** 锁文件里记机器名：别的机器写的锁看不见它的进程表，只能按 TTL 判。 */
const LOCK_HOST = hostname()

function taskLockFile(itemId) {
  return join(dshHome(), 'sound-picture-desk', 'projects', itemId, '.task.lock')
}

/** 读锁文件里的持锁信息；坏 JSON / 半写状态返回 null。 */
function readLockMeta(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

/**
 * 持锁进程是否还活着。同机才能判 pid：ESRCH = 进程已退出，
 * EPERM = 进程在但没权限探测（按活着算），其他异常保守按活着、交给 TTL。
 * pid 不是正整数（旧锁/坏内容）视为无法判断，同样交给 TTL。
 */
function lockOwnerAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return true
  // 本进程肯定活着；自己名下的锁（任务运行中或释放失败残留）交给 TTL 兜底
  if (pid === process.pid) return true
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return err?.code !== 'ESRCH'
  }
}

/**
 * 锁文件还算「另一个窗口正在跑」吗：先看 30 分钟 TTL，
 * 再在能判 pid 时看持锁进程是否已崩——崩溃的锁不用等满 TTL。
 */
function lockHeldBy(file, info) {
  if (Date.now() - info.mtimeMs > TASK_LOCK_STALE_MS) return false
  const meta = readLockMeta(file)
  // 还没写完内容（刚 open 出来）：先按占用处理，等 TTL
  if (!meta) return true
  // 另一台机器写的锁：本机看不到对方的进程表，退回 TTL 判定
  if (meta.host && meta.host !== LOCK_HOST) return true
  return lockOwnerAlive(meta.pid)
}

/**
 * 拿跨进程任务锁。用同步 fs 原语是为了保住 startTask 的同步签名（调用点很多）。
 * 锁文件已存在、30 分钟内更新过、且持锁进程还活着 → 另一个窗口正在跑；
 * 否则视为陈旧（进程崩了/超过 TTL），删掉重试一次。
 * 项目目录建不出来、权限不足等异常一律降级成活内存互斥，不能让锁文件把功能整体弄坏。
 */
function acquireTaskLock(itemId, kind) {
  const file = taskLockFile(itemId)
  try {
    mkdirSync(dirname(file), { recursive: true })
  } catch {
    return { ok: true, file: null }
  }
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const handle = openSync(file, 'wx')
      try {
        writeSync(handle, JSON.stringify({ pid: process.pid, kind, at: new Date().toISOString(), host: LOCK_HOST }))
      } finally {
        closeSync(handle)
      }
      return { ok: true, file }
    } catch (err) {
      if (err?.code !== 'EEXIST') return { ok: true, file: null }
      let info = null
      try {
        info = statSync(file)
      } catch {
        continue // 刚被释放，重试一次就能拿到
      }
      if (lockHeldBy(file, info)) return { ok: false, file }
      // 陈旧锁（超过 TTL，或持锁进程已崩）：删掉重试
      try {
        rmSync(file, { force: true })
      } catch {}
      continue
    }
  }
  return { ok: false, file }
}

/** 释放锁：只删自己写的那把，防止误删别的进程刚接管的锁。 */
function releaseTaskLock(lock) {
  if (!lock?.file) return
  try {
    const meta = JSON.parse(readFileSync(lock.file, 'utf8'))
    if (meta?.pid !== process.pid) return
  } catch {
    // 读不出来（半写状态）也按自己的锁处理
  }
  try {
    rmSync(lock.file, { force: true })
  } catch {}
}

/** 另一个 Host 进程是否正在跑这个项目（陈旧锁 / 持锁进程已崩都不算）。 */
export function isTaskLocked(itemId) {
  const file = taskLockFile(itemId)
  try {
    return lockHeldBy(file, statSync(file))
  } catch {
    return false
  }
}

export function isBusy(itemId) {
  return Boolean(tasks.get(itemId)?.running)
}

/**
 * 启动一个后台任务。已经在跑就抛错，由调用方回 409。
 * @param {string} itemId - 项目 id。
 * @param {string} kind - script / tts / image / render。
 * @param {number} total - 总数，用于进度条。
 * @param {(api: {report: Function, signal: AbortSignal}) => Promise<any>} runner - 任务体。
 */
export function startTask(itemId, kind, total, runner) {
  pruneFinished()
  if (isBusy(itemId)) {
    const current = tasks.get(itemId)
    const where = current ? `（${current.kind} ${current.done}/${current.total}）` : ''
    throw Object.assign(new Error(`这个项目正在跑任务${where}，等它结束再点；卡住的话点「停止」`), { status: 409 })
  }
  // 另一个窗口（桌面端/另一个 Web 标签）可能正在跑同一项目：锁文件拿不到就回 409
  const lock = acquireTaskLock(itemId, kind)
  if (!lock.ok) {
    throw Object.assign(new Error('另一个窗口正在跑这个任务（同一项目同时只能跑一个），等它结束再点'), { status: 409 })
  }
  const controller = new AbortController()
  const task = {
    kind,
    total,
    done: 0,
    message: '',
    error: null,
    running: true,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    controller,
  }
  tasks.set(itemId, task)
  // 兜底超时：模型卡住时别让任务永远 running，用户会被困住
  const limit = Number(process.env.PICTURE_DESK_TASK_TIMEOUT_MS || process.env.STORY_DESK_TASK_TIMEOUT_MS) || 20 * 60 * 1000
  const watchdog = setTimeout(() => {
    if (task.running) {
      task.message = '任务超时，已自动停止'
      controller.abort()
    }
  }, limit)
  watchdog.unref?.()
  const report = (done, message, total) => {
    if (done !== undefined) task.done = done
    if (message !== undefined) task.message = String(message).slice(0, 200)
    // 写稿任务开始时还不知道要配几张图，跑起来才补上总数
    if (Number.isFinite(total) && total > 0) task.total = total
  }
  const promise = (async () => {
    try {
      const result = await runner({ report, signal: controller.signal })
      clearTimeout(watchdog)
      // 收尾期间用户点了停止：成功分支也要认「已停止」，别让界面以为跑完了
      if (controller.signal.aborted) {
        task.running = false
        task.finishedAt = new Date().toISOString()
        task.error = null
        task.message = '已停止'
        return { ok: false, stopped: true }
      }
      task.running = false
      task.finishedAt = new Date().toISOString()
      // 成功的任务不该停在「正在…」这类中间文案上，否则界面看着像没跑完
      if (!task.message || /^正在/.test(task.message)) task.message = '完成'
      return { ok: true, result }
    } catch (err) {
      clearTimeout(watchdog)
      task.running = false
      task.finishedAt = new Date().toISOString()
      // 用户点了停止就别把 ffmpeg 的中止报错甩给用户看
      if (controller.signal.aborted) {
        task.error = null
        task.message = '已停止'
        return { ok: false, stopped: true }
      }
      task.error = err?.message ?? String(err)
      task.message = task.error
      return { ok: false, error: task.error }
    } finally {
      // 任务结束（成功/失败/停止）都释放跨进程锁
      releaseTaskLock(lock)
    }
  })()
  task.promise = promise
  return task
}

export function cancelTask(itemId) {
  const task = tasks.get(itemId)
  if (!task?.running) return false
  task.controller.abort()
  task.message = '正在停止…'
  return true
}

/** 界面上的进度视图，不含内部句柄。 */
export function publicTask(itemId) {
  const task = tasks.get(itemId)
  if (!task) return null
  return {
    kind: task.kind,
    total: task.total,
    done: task.done,
    message: task.message,
    error: task.error,
    running: task.running,
    startedAt: task.startedAt,
    finishedAt: task.finishedAt,
  }
}
