import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { decodeMediaName, isPrivateAddress, parseJsonBody } from '../src/host.js'
import { cancelTask, isTaskLocked, startTask } from '../src/jobs.js'

// ---------------------------------------------------------------- 媒体名解码

test('decodeMediaName：中文文件名按段解码', () => {
  assert.equal(decodeMediaName(['voice-白桦.mp3']), 'voice-白桦.mp3')
  assert.equal(decodeMediaName([encodeURIComponent('voice-白桦.mp3')]), 'voice-白桦.mp3')
  assert.equal(decodeMediaName(['covers', encodeURIComponent('封面 1.png')]), 'covers/封面 1.png')
})

test('decodeMediaName：普通文件名原样通过', () => {
  assert.equal(decodeMediaName(['s001.png']), 's001.png')
  assert.equal(decodeMediaName(['covers', 'cover-1700000000000.png']), 'covers/cover-1700000000000.png')
  // 非法转义按原值走，交给后面的 404 处理
  assert.equal(decodeMediaName(['%E4']), '%E4')
})

test('decodeMediaName：解码后再拦 ..，%2e%2e 也拦得住', () => {
  assert.equal(decodeMediaName(['..']), null)
  assert.equal(decodeMediaName(['%2e%2e']), null)
  assert.equal(decodeMediaName(['%2E%2E']), null)
  assert.equal(decodeMediaName(['..', 'secret.png']), null)
  assert.equal(decodeMediaName(['../secret.png']), null)
  assert.equal(decodeMediaName(['a', '..', 'b.png']), null)
  assert.equal(decodeMediaName(['%2e%2e%2fetc%2fpasswd']), null)
  assert.equal(decodeMediaName(['a..b.png']), null)
  assert.equal(decodeMediaName(['.']), null)
  assert.equal(decodeMediaName(['']), null)
})

test('decodeMediaName：反斜杠与绝对路径返回 null', () => {
  assert.equal(decodeMediaName(['a\\b.png']), null)
  assert.equal(decodeMediaName(['a%5Cb.png']), null)
  assert.equal(decodeMediaName(['/etc/passwd']), null)
  assert.equal(decodeMediaName(['%2Fetc%2Fpasswd']), null)
  assert.equal(decodeMediaName(['covers', '/etc/passwd']), null)
})

// ---------------------------------------------------------------- 内网地址判断

test('isPrivateAddress：本机 / 私网 / 链路本地 / 元数据地址为 true', () => {
  for (const host of [
    '127.0.0.1',
    '127.10.0.1',
    'localhost',
    'localhost.',
    'LOCALHOST',
    '0.0.0.0',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '::1',
    '[::1]',
    '::',
    'fd00::1',
    'fe80::1',
    '::ffff:127.0.0.1',
    'printer.local',
    '',
  ]) {
    assert.equal(isPrivateAddress(host), true, host)
  }
})

test('isPrivateAddress：公网地址为 false', () => {
  for (const host of [
    '8.8.8.8',
    '1.1.1.1',
    '172.32.0.1',
    '172.15.0.1',
    '203.0.113.1',
    'example.com',
    'www.bilibili.com',
    '2606:4700:4700::1111',
    '::ffff:8.8.8.8',
  ]) {
    assert.equal(isPrivateAddress(host), false, host)
  }
})

// ---------------------------------------------------------------- 请求体校验

test('parseJsonBody：空体按空对象处理', () => {
  assert.deepEqual(parseJsonBody(''), {})
  assert.deepEqual(parseJsonBody('   '), {})
  assert.deepEqual(parseJsonBody(undefined), {})
})

test('parseJsonBody：普通对象正常解析', () => {
  assert.deepEqual(parseJsonBody('{"id":"bk_1"}'), { id: 'bk_1' })
  assert.deepEqual(parseJsonBody('{"list":[1,2]}'), { list: [1, 2] })
})

test('parseJsonBody：null / 数组 / 标量一律 400', () => {
  for (const text of ['null', '[]', '[1,2]', '"text"', '42', 'true', 'false']) {
    assert.throws(() => parseJsonBody(text), err => {
      assert.equal(err.status, 400)
      assert.match(err.message, /请求体必须是 JSON 对象/)
      return true
    }, text)
  }
})

test('parseJsonBody：非法 JSON 仍报 400 且提示不同', () => {
  assert.throws(() => parseJsonBody('{bad'), err => {
    assert.equal(err.status, 400)
    assert.match(err.message, /请求不是有效的 JSON/)
    return true
  })
})

// ---------------------------------------------------------------- 跨进程任务锁

async function withTempHome(fn) {
  const home = await mkdtemp(join(tmpdir(), 'sound-picture-desk-test-'))
  const prev = process.env.DSH_HOME
  process.env.DSH_HOME = home
  try {
    return await fn(home)
  } finally {
    if (prev === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = prev
    await rm(home, { recursive: true, force: true })
  }
}

test('跨进程任务锁：任务运行期间加锁，结束后释放', async () => {
  await withTempHome(async () => {
    let release
    const gate = new Promise(resolve => { release = resolve })
    const task = startTask('bk_lock_a', 'render', 1, async () => { await gate; return 'done' })
    assert.equal(isTaskLocked('bk_lock_a'), true)
    await assert.rejects(async () => startTask('bk_lock_a', 'tts', 1, async () => {}), err => err.status === 409)
    release()
    assert.deepEqual(await task.promise, { ok: true, result: 'done' })
    assert.equal(isTaskLocked('bk_lock_a'), false)
  })
})

test('跨进程任务锁：另一个进程的锁挡住 startTask，陈旧锁可接管', async () => {
  await withTempHome(async home => {
    const dir = join(home, 'sound-picture-desk', 'projects', 'bk_lock_b')
    await mkdir(dir, { recursive: true })
    const lockFile = join(dir, '.task.lock')
    // 用一个确定活着、又肯定不是本进程的 pid（测试进程的父进程），锁才算真的被占着
    const livePid = process.ppid
    await writeFile(lockFile, JSON.stringify({ pid: livePid, kind: 'render', at: new Date().toISOString() }))
    assert.equal(isTaskLocked('bk_lock_b'), true)
    assert.throws(() => startTask('bk_lock_b', 'render', 1, async () => {}), err => err.status === 409)

    // 把锁文件时间拨到 31 分钟前：超过 30 分钟视为进程崩溃留下的陈旧锁，应能接管
    const old = new Date(Date.now() - 31 * 60 * 1000)
    await utimes(lockFile, old, old)
    assert.equal(isTaskLocked('bk_lock_b'), false)
    const task = startTask('bk_lock_b', 'render', 1, async () => 'ok')
    assert.equal(await task.promise.then(row => row.ok), true)
    assert.equal(isTaskLocked('bk_lock_b'), false)
  })
})

test('跨进程任务锁：持锁进程已崩的新鲜锁不用等 TTL，可直接接管', async () => {
  await withTempHome(async home => {
    const dir = join(home, 'sound-picture-desk', 'projects', 'bk_lock_dead')
    await mkdir(dir, { recursive: true })
    // 99999999 超过常见 pid 上限（本机 pid_max=4194304），process.kill 会抛 ESRCH
    await writeFile(join(dir, '.task.lock'), JSON.stringify({ pid: 99999999, kind: 'render', at: new Date().toISOString() }))
    assert.equal(isTaskLocked('bk_lock_dead'), false)
    const task = startTask('bk_lock_dead', 'tts', 1, async () => 'ok')
    assert.equal(await task.promise.then(row => row.ok), true)
    assert.equal(isTaskLocked('bk_lock_dead'), false)
  })
})

test('跨进程任务锁：别的机器写的锁回退到 TTL，不按本机 pid 误判', async () => {
  await withTempHome(async home => {
    const dir = join(home, 'sound-picture-desk', 'projects', 'bk_lock_remote')
    await mkdir(dir, { recursive: true })
    // 另一台机器的锁：本机看不到它的进程表，即使这个 pid 在本机不存在也要按占用处理
    await writeFile(join(dir, '.task.lock'), JSON.stringify({
      pid: 99999999, kind: 'render', at: new Date().toISOString(), host: 'another-machine',
    }))
    assert.equal(isTaskLocked('bk_lock_remote'), true)
    assert.throws(() => startTask('bk_lock_remote', 'tts', 1, async () => 'ok'), err => err.status === 409)
  })
})

test('任务收尾期间点停止：成功分支也返回已停止并释放锁', async () => {
  await withTempHome(async () => {
    let release
    const gate = new Promise(resolve => { release = resolve })
    const task = startTask('bk_stop', 'render', 1, async () => { await gate; return 'done' })
    assert.equal(cancelTask('bk_stop'), true)
    release()
    assert.deepEqual(await task.promise, { ok: false, stopped: true })
    assert.equal(task.running, false)
    assert.equal(task.error, null)
    assert.equal(task.message, '已停止')
    assert.equal(isTaskLocked('bk_stop'), false)
  })
})

test('任务失败时也要释放跨进程锁', async () => {
  await withTempHome(async () => {
    const task = startTask('bk_fail', 'tts', 1, async () => { throw new Error('合成失败') })
    assert.deepEqual(await task.promise, { ok: false, error: '合成失败' })
    assert.equal(isTaskLocked('bk_fail'), false)
  })
})
