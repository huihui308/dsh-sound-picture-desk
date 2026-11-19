// 长任务进度：合成、出图、渲染都跑在后台，界面靠轮询看进度。
// 一个项目同时只允许一个任务在跑——它们都写同一个项目目录，并发只会互相踩。
const tasks = new Map()

export function taskOf(itemId) {
  return tasks.get(itemId) ?? null
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
  if (isBusy(itemId)) {
    const current = tasks.get(itemId)
    const where = current ? `（${current.kind} ${current.done}/${current.total}）` : ''
    throw Object.assign(new Error(`这个项目正在跑任务${where}，等它结束再点；卡住的话点「停止」`), { status: 409 })
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
  const limit = Number(process.env.STORY_DESK_TASK_TIMEOUT_MS) || 20 * 60 * 1000
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
