import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SEGMENT_TAIL, XFADE_PRESETS, buildAss, buildConcatArgs, buildSrt, layoutCues, segmentSpan, shotConcatArgs,
} from '../src/render.js'
import { markHardwareBroken, resetHardwareBroken } from '../src/encoders.js'

const FPS = 30

function srtSeconds(stamp) {
  const m = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/.exec(stamp)
  assert.ok(m, '非法 SRT 时间码：' + stamp)
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000
}

function assSeconds(stamp) {
  const m = /^(\d+):(\d{2}):(\d{2})\.(\d{2})$/.exec(stamp)
  assert.ok(m, '非法 ASS 时间码：' + stamp)
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 100
}

test('segmentSpan 量化到 30fps 帧栅格', () => {
  assert.equal(SEGMENT_TAIL, 0.25)
  for (const audio of [0, 0.5, 0.8, 1, 1.0333, 2.37, 5]) {
    const raw = Math.max(0.8, audio) + SEGMENT_TAIL
    const expected = Math.max(2, Math.round(raw * FPS)) / FPS
    const span = segmentSpan(audio)
    // 返回值必须正好落在整帧上（容差只留给浮点），否则 -t 编出的帧数会和它错开
    assert.ok(Math.abs(span * FPS - Math.round(span * FPS)) < 1e-9, 'span 不是整帧：' + span)
    assert.ok(Math.abs(span - expected) < 1e-9, audio + 's 的段长不对：' + span)
  }
  // 1.0s 旁白：raw=1.25s，38 帧 = 1.2667s；不能再按 1.25s 编
  assert.equal(Math.round(segmentSpan(1) * FPS), 38)
  assert.ok(Math.abs(segmentSpan(1) - 38 / FPS) < 1e-9)
})

test('layoutCues/buildSrt/buildAss 时间轴 = 量化 span 累加 - overlap + offset', () => {
  const segments = [
    { text: '第一句。第二句。', audioSecs: 1 },
    { text: '第三句。', audioSecs: 0.5 },
  ]
  const spans = segments.map(row => segmentSpan(row.audioSecs))
  const overlap = 0.4
  const offset = 3
  const expectedEnd = offset + spans[0] + spans[1] - overlap

  const cues = layoutCues(segments, 17, { overlap, offset })
  assert.equal(cues.length, 3)
  assert.ok(Math.abs(cues[0].start - offset) < 1e-9)
  // 第一段的 cue 铺满该段的量化 span；第二段起点只比它早 overlap（转场重叠）
  assert.ok(Math.abs(cues[1].end - (offset + spans[0])) < 1e-9)
  assert.ok(Math.abs(cues[2].start - (offset + spans[0] - overlap)) < 1e-9)
  assert.ok(Math.abs(cues.at(-1).end - expectedEnd) < 1e-9)
  for (const cue of cues) assert.ok(cue.end > cue.start)

  // SRT 只有毫秒精度，误差上限 1ms（+半帧量化本身已算进 span）
  const srt = buildSrt(segments, { overlap, offset })
  const srtStamps = [...srt.matchAll(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g)]
  assert.equal(srtStamps.length, 3)
  assert.equal(srtSeconds(srtStamps[0][1]), offset)
  assert.ok(Math.abs(srtSeconds(srtStamps.at(-1)[2]) - expectedEnd) <= 0.0015)

  // ASS 只有厘秒精度，误差上限 10ms
  const ass = buildAss(segments, { width: 1080, height: 1920, overlap, offset })
  const assStamps = [...ass.matchAll(/Dialogue: 0,(\d+:\d{2}:\d{2}\.\d{2}),(\d+:\d{2}:\d{2}\.\d{2}),/g)]
  assert.equal(assStamps.length, 3)
  assert.ok(Math.abs(assSeconds(assStamps.at(-1)[2]) - expectedEnd) <= 0.01)
  assert.match(ass, /PlayResX: 1080/)
  assert.match(ass, /PlayResY: 1920/)
})

test('XFADE_PRESETS 只收 xfade 支持的说书转场', () => {
  assert.ok(XFADE_PRESETS instanceof Set)
  for (const id of ['fade', 'fadeblack', 'dissolve', 'wipeleft', 'wiperight', 'circleopen', 'circleclose', 'smoothleft']) {
    assert.ok(XFADE_PRESETS.has(id), id)
  }
  assert.equal(XFADE_PRESETS.has('none'), false)
  assert.equal(XFADE_PRESETS.has('随机'), false)
})

test('concatShots：正常走 -c copy，硬件降级后改用重编码拼接', () => {
  const listFile = '/tmp/concat.txt'
  const out = '/tmp/out.mp4'

  const copyArgs = buildConcatArgs(listFile, out, { hardwareBroken: false })
  assert.equal(copyArgs[copyArgs.indexOf('-c') + 1], 'copy')
  assert.equal(copyArgs.includes('-c:v'), false)
  assert.ok(copyArgs.includes('-c:a') === false)
  assert.equal(copyArgs.at(-1), out)

  const reArgs = buildConcatArgs(listFile, out, { hardwareBroken: true })
  assert.ok(reArgs.includes('-c:v'), '降级后应指定视频编码器')
  assert.equal(reArgs[reArgs.indexOf('-c:a') + 1], 'aac')
  // 不能同时出现 -c copy，否则混合编码流根本不会重编码
  assert.equal(reArgs.some((part, index) => part === '-c' && reArgs[index + 1] === 'copy'), false)

  // 不注入参数时读全局状态：本轮标记过硬件失败就重编码
  markHardwareBroken('test: 模拟并行渲染硬件失败')
  const autoArgs = buildConcatArgs(listFile, out)
  assert.ok(autoArgs.includes('-c:v'))
})

test('concatShots：本轮降级过（forceReencode）不靠全局 TTL 也强制重编码', () => {
  const listFile = '/tmp/concat.txt'
  const out = '/tmp/out.mp4'
  // 模拟长渲染中途 30 分钟 TTL 过期：全局标记已经回到「硬件可用」，但这一版镜头确实混过编码器
  resetHardwareBroken()
  const forced = shotConcatArgs(listFile, out, { forceReencode: true })
  assert.ok(forced.includes('-c:v'), '本轮降级过必须重编码，不能 -c copy 混合编码流')
  assert.equal(forced.some((part, index) => part === '-c' && forced[index + 1] === 'copy'), false)
  assert.equal(forced[forced.indexOf('-c:a') + 1], 'aac')

  // 没降级过就维持原来的直接 copy（不重编码）
  const copy = shotConcatArgs(listFile, out, { forceReencode: false })
  assert.equal(copy[copy.indexOf('-c') + 1], 'copy')
  assert.equal(copy.includes('-c:v'), false)
  resetHardwareBroken()
})
