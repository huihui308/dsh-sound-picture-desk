// 真机回归：硬切拼接（默认 transition:none）下，镜头音轨必须补齐到视频时长，
// 否则 concat 的 -c copy 会让音轨首尾相接、画面切点在 +0.25s，旁白逐段提前。
import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { concatShots, renderShot, segmentSpan } from '../src/render.js'

const FFPROBE = process.env.PICTURE_DESK_FFPROBE || process.env.STORY_DESK_FFPROBE || 'ffprobe'
const FFMPEG = process.env.PICTURE_DESK_FFMPEG || process.env.STORY_DESK_FFMPEG || 'ffmpeg'

function run(bin, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { maxBuffer: 32 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`${bin} 失败：${String(stderr || err.message).slice(-400)}`))
        return
      }
      resolve({ stdout, stderr })
    })
  })
}

async function hasTool(bin) {
  try {
    await run(bin, ['-version'], { timeout: 15_000 })
    return true
  } catch {
    return false
  }
}

/** 各条流的时长（秒）。断言音画是否等长就看这个。 */
async function probeStreams(file) {
  const { stdout } = await run(FFPROBE, [
    '-v', 'error', '-show_entries', 'stream=codec_type,duration',
    '-of', 'json', file,
  ], { timeout: 30_000 })
  const parsed = JSON.parse(stdout)
  return (parsed.streams ?? []).map(row => ({
    type: row.codec_type,
    duration: Number.parseFloat(row.duration),
  }))
}

/**
 * 从成片音轨里找 440Hz 音调的起点：解码成 8kHz 单声道 s16le，找「安静一段之后突然有声」的位置。
 * 用来看第二段旁白到底落在几秒。
 */
async function toneOnsets(file, work, { threshold = 300, gapSeconds = 0.15 } = {}) {
  const pcmFile = join(work, 'tones.pcm')
  await run(FFMPEG, ['-y', '-v', 'error', '-i', file, '-ac', '1', '-ar', '8000', '-f', 's16le', pcmFile], { timeout: 60_000 })
  const buffer = await readFile(pcmFile)
  const rate = 8000
  const onsets = []
  let lastLoud = -Infinity
  const samples = Math.floor(buffer.length / 2)
  for (let i = 0; i < samples; i += 1) {
    if (Math.abs(buffer.readInt16LE(i * 2)) > threshold) {
      if (i - lastLoud > rate * gapSeconds) onsets.push(i / rate)
      lastLoud = i
    }
  }
  return onsets
}

test('硬切拼接：镜头音轨补齐到视频时长，拼接后 video/audio 流时长对齐', async t => {
  if (!(await hasTool(FFMPEG)) || !(await hasTool(FFPROBE))) {
    t.skip('本机没有 ffmpeg/ffprobe，跳过真机回归')
    return
  }
  const work = await mkdtemp(join(tmpdir(), 'sound-picture-desk-ffmpeg-'))
  try {
    // 1) 一张静图 + 3 段 1.0s 旁白（sine 代替人声，只看时间轴）
    const frame = join(work, 'frame.png')
    await run(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'lavfi', '-i', 'color=c=0x223344:s=16x16:d=1', '-frames:v', '1', frame])
    const shots = []
    for (let i = 1; i <= 3; i += 1) {
      const audio = join(work, `a${i}.wav`)
      await run(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error',
        '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1:sample_rate=44100', '-ac', '2', audio])
      const output = join(work, `shot-${i}.mp4`)
      await renderShot({
        image: frame,
        audio,
        output,
        seconds: 1,
        width: 320,
        height: 240,
        kenBurns: false,
        motion: 'none',
        grade: 'none',
      })
      shots.push(output)
    }

    // 2) 每个镜头自己就得音画等长（音轨补 0.25s 静音 + 截到整段时长）
    for (const shot of shots) {
      const streams = await probeStreams(shot)
      const video = streams.find(row => row.type === 'video')
      const audio = streams.find(row => row.type === 'audio')
      assert.ok(video && audio, '镜头必须有视频流和音频流')
      assert.ok(Math.abs(video.duration - audio.duration) <= 0.05,
        `镜头音画不等长：video=${video.duration}s audio=${audio.duration}s`)
    }

    // 3) 硬切拼接（-c copy）后整条片子也得等长
    const output = join(work, 'joined.mp4')
    await concatShots(shots, work, output)
    const joined = await probeStreams(output)
    const video = joined.find(row => row.type === 'video')
    const audio = joined.find(row => row.type === 'audio')
    assert.ok(video && audio, '成片必须有视频流和音频流')
    assert.ok(Math.abs(video.duration - audio.duration) <= 0.05,
      `拼接后音画不等长：video=${video.duration}s audio=${audio.duration}s`)

    // 4) 辅助验证「旁白不再逐段提前」：第二段音调起点应该跟第二段画面切点（≈1.27s）接近。
    //    AAC 每段自带几帧 priming/padding，允许 0.1s 误差；旧代码（音轨不补齐）这里是 ≈1.02s。
    const onsets = await toneOnsets(output, work)
    assert.ok(onsets.length >= 2, '应能听出至少两段音调，实际：' + JSON.stringify(onsets))
    const expected = segmentSpan(1)
    assert.ok(Math.abs(onsets[1] - expected) <= 0.1,
      `第二段旁白起点应在 ${expected.toFixed(2)}s 附近，实际 ${onsets[1].toFixed(3)}s`)
  } finally {
    await rm(work, { recursive: true, force: true })
  }
})
