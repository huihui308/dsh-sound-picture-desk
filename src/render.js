// 装配：每段「静图 + 旁白」拼成一个镜头，再按顺序接成整片。
// 只用 ffmpeg/ffprobe，全部走 execFile（不经 shell），路径里的空格和引号不会出事。
import { execFile } from 'node:child_process'

import { encoderArgsSync, resolveEncoder } from './encoders.js'
import { mkdir, rm, writeFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const FFMPEG = process.env.STORY_DESK_FFMPEG || 'ffmpeg'
const FFPROBE = process.env.STORY_DESK_FFPROBE || 'ffprobe'

function run(bin, args, { timeout = 30 * 60 * 1000, signal } = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile(bin, args, { timeout, maxBuffer: 8 * 1024 * 1024, signal }, (err, stdout, stderr) => {
      if (err) {
        const tail = String(stderr || '').trim().split('\n').slice(-4).join(' | ')
        reject(new Error(`${bin} 失败：${tail || err.message}`))
        return
      }
      resolve({ stdout, stderr })
    })
    child.on('error', reject)
  })
}

/** 读音频/视频时长（秒）。取不到返回 0，由调用方决定是否当失败处理。 */
export async function probeDuration(file) {
  try {
    const { stdout } = await run(FFPROBE, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      file,
    ], { timeout: 30_000 })
    const value = Number.parseFloat(String(stdout).trim())
    return Number.isFinite(value) && value > 0 ? value : 0
  } catch {
    return 0
  }
}

function even(value) {
  const n = Math.round(value)
  return n % 2 === 0 ? n : n + 1
}

/**
 * 一个镜头：图片铺满画幅 + 旁白音频，时长以音频为准。
 * kenBurns 打开时做极缓慢推近，让静图不死板。
 */
/**
 * 片头标题卡：交给 HyperFrames 用 HTML 渲染，能做文字动画和排版。
 * 它依赖 npx 拉包，装不上就抛错，由调用方降级成「不做片头」。
 */
export async function renderIntroCard({ title, subtitle, workDir, output, width, height, seconds = 3 }) {
  const w = even(width)
  const h = even(height)
  const projectDir = join(workDir, 'intro')
  const compDir = join(projectDir, 'compositions')
  await mkdir(compDir, { recursive: true })
  const safeTitle = escapeHtml(title || '')
  const safeSub = escapeHtml(subtitle || '')
  const html = `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:#0a0e14;width:${w}px;height:${h}px;overflow:hidden}
  #stage{width:${w}px;height:${h}px;display:flex;flex-direction:column;align-items:center;justify-content:center;
    background:radial-gradient(circle at 50% 42%, #1b2430 0%, #0a0e14 68%);font-family:"Noto Serif CJK SC",serif}
  h1{color:#e9d6a9;font-size:${Math.round(w * 0.098)}px;margin:0;letter-spacing:${Math.round(w * 0.012)}px;
    text-shadow:0 0 34px rgba(233,214,169,.28);opacity:0}
  .rule{width:0;height:2px;background:linear-gradient(90deg,transparent,#c9a961,transparent);margin:${Math.round(h * 0.028)}px 0}
  p{color:#8b97a5;font-size:${Math.round(w * 0.026)}px;margin:0;letter-spacing:${Math.round(w * 0.004)}px;opacity:0}
</style></head>
<body>
<div id="stage" data-composition-id="intro" data-start="0" data-width="${w}" data-height="${h}">
  <h1 id="t" class="clip" data-start="0" data-duration="${seconds}" data-track-index="0">${safeTitle}</h1>
  <div id="r" data-start="0" data-duration="${seconds}" data-track-index="1" class="rule"></div>
  <p id="s" class="clip" data-start="0" data-duration="${seconds}" data-track-index="2">${safeSub}</p>
</div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script>
  const tl = gsap.timeline({ paused: true });
  tl.to('#t', { opacity: 1, y: -6, duration: 1.1, ease: 'power2.out' }, 0.15)
    .to('#r', { width: ${Math.round(w * 0.52)}, duration: 1.0, ease: 'power2.inOut' }, 0.5)
    .to('#s', { opacity: 1, duration: 0.9 }, 0.8)
    // 把时间轴撑到目标时长，否则渲染出来的片子只有动画那么长
    .set({}, {}, ${seconds});
  window.__timelines = { intro: tl };
</script>
</body></html>`
  await writeFile(join(compDir, 'intro.html'), html, 'utf8')
  const raw = join(workDir, 'intro-raw.mp4')
  await new Promise((resolve, reject) => {
    execFile('npx', ['--yes', 'hyperframes@latest', 'render',
      // 尺寸由 composition 的 data-width/height 决定，--resolution 只吃预设名，不要传
      '--composition', 'compositions/intro.html', '--output', raw],
      { timeout: 240_000, cwd: projectDir, maxBuffer: 16 * 1024 * 1024 },
      err => (err ? reject(new Error(`HyperFrames 渲染失败：${String(err.message).slice(0, 200)}`)) : resolve()))
  })
  // 统一编码参数，才能和主片直接拼接
  // 片头本身没有音轨，补一条静音，才能和主片无缝拼接
  await run(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error',
    '-i', raw,
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-vf', `scale=${w}:${h},format=yuv420p`, '-r', '30',
    '-shortest', ...encoderArgsSync(),
    '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2',
    '-movflags', '+faststart', output])
  await rm(raw, { force: true }).catch(() => {})
  return output
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

/** 调色滤镜：都是 ffmpeg 内置滤镜，不额外依赖。 */
const GRADES = {
  none: null,
  warm: 'colorbalance=rs=.07:gs=.02:bs=-.05,eq=saturation=1.06:contrast=1.02',
  cool: 'colorbalance=rs=-.05:gs=0:bs=.07,eq=saturation=.98:contrast=1.03',
  film: 'eq=contrast=1.08:saturation=.9:brightness=-.01,colorbalance=rs=.03:bs=.02,vignette=PI/5',
}

export async function renderShot({ image, audio, output, seconds, width, height, kenBurns, motion, grade }) {
  await resolveEncoder()
  const w = even(width)
  const h = even(height)
  const duration = Math.max(0.8, Number(seconds) || 0) + 0.25
  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-loop', '1', '-framerate', '30', '-i', image, '-i', audio]
  // 运镜方向：默认推近；zoom-out 从 1.10 退回 1.0；none 完全静止
  const mode = motion || (kenBurns === false ? 'none' : 'zoom-in')
  const gradeFilter = GRADES[grade] ?? null

  if (mode === 'none') {
    const vf = [
      `scale=${w}:${h}:force_original_aspect_ratio=increase`,
      `crop=${w}:${h}`,
      gradeFilter,
      'format=yuv420p',
    ].filter(Boolean).join(',')
    args.push('-vf', vf)
  } else {
    // 先放大到 2 倍再 zoompan，避免推近时出现像素抖动
    const frames = Math.max(2, Math.round(duration * 30))
    // 两个方向都用增量式：靠 on 逐帧算会让 zoompan 每帧重算，慢十几倍
    const z = mode === 'zoom-out'
      ? `'if(eq(on,0),1.10,max(zoom-0.00022,1.001))'`
      : `'min(zoom+0.00022,1.10)'`
    const vf = [
      `scale=${w * 2}:${h * 2}:force_original_aspect_ratio=increase`,
      `crop=${w * 2}:${h * 2}`,
      `zoompan=z=${z}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${w}x${h}:fps=30`,
      gradeFilter,
      'format=yuv420p',
    ].filter(Boolean).join(',')
    args.push('-vf', vf)
  }

  args.push(
    ...encoderArgsSync(),
    '-r', '30', '-t', duration.toFixed(3),
    '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2',
    '-movflags', '+faststart',
    output,
  )
  await run(FFMPEG, args)
  return output
}

/**
 * 带淡入淡出的拼接：xfade 必须重编码，所以只在用户开了转场时走这条。
 * 逐段两两合并，避免一次性塞几十个输入。
 */
export async function concatWithFade(shotPaths, workDir, output, { fadeSeconds = 0.4 } = {}) {
  if (shotPaths.length === 1) {
    await run(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-i', shotPaths[0], '-c', 'copy', output])
    return output
  }
  let current = shotPaths[0]
  for (let i = 1; i < shotPaths.length; i += 1) {
    const next = i === shotPaths.length - 1 ? output : join(workDir, `fade-${String(i).padStart(3, '0')}.mp4`)
    const merged = await probeDuration(current)
    const offset = Math.max(0, (merged || 0) - fadeSeconds)
    await run(FFMPEG, [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-i', current, '-i', shotPaths[i],
      '-filter_complex',
      `[0:v][1:v]xfade=transition=fade:duration=${fadeSeconds}:offset=${offset.toFixed(3)},format=yuv420p[v];` +
      '[0:a][1:a]acrossfade=d=' + fadeSeconds + ':c1=tri:c2=tri[a]',
      '-map', '[v]', '-map', '[a]',
      ...encoderArgsSync(), '-r', '30',
      '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2',
      '-movflags', '+faststart', next,
    ])
    if (i > 1) await rm(current, { force: true }).catch(() => {})
    current = next
  }
  return output
}

/** 按顺序硬接所有镜头。同编码参数，可以直接 copy，不重编码。 */
export async function concatShots(shotPaths, workDir, output) {
  const listFile = join(workDir, 'concat.txt')
  const lines = shotPaths.map(path => `file '${path.replace(/'/g, "'\\''")}'`)
  await writeFile(listFile, `${lines.join('\n')}\n`, 'utf8')
  await run(FFMPEG, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c', 'copy', '-movflags', '+faststart', output,
  ])
  return output
}

function srtTime(seconds) {
  const total = Math.max(0, seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = Math.floor(total % 60)
  const ms = Math.round((total - Math.floor(total)) * 1000)
  const pad = (n, size = 2) => String(n).padStart(size, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`
}

/**
 * 把每段文字拆成跟读的短句：一句话一条字幕，时间按字数占该段音频的比例分配。
 * 整段扔一条 cue 会让整屏字从头挂到尾，看起来像 PPT 而不是旁白字幕。
 */
export function layoutCues(segments, maxChars = 17) {
  const cues = []
  let cursor = 0
  for (const row of segments) {
    const text = String(row.text ?? '').trim()
    const span = Math.max(0.6, Number(row.audioSecs) || 0)
    if (text) {
      const parts = splitCues(text, maxChars)
      const totalChars = parts.reduce((sum, part) => sum + part.length, 0) || 1
      let at = cursor
      for (const part of parts) {
        const slice = (span * part.length) / totalChars
        cues.push({ start: at, end: at + slice, text: part })
        at += slice
      }
    }
    cursor += span
  }
  return cues
}

/** 按句末标点切短句，单句过长再按逗号切，保证一块不超过两行。 */
function splitCues(text, maxChars) {
  const cues = []
  for (const sentence of String(text).match(/[^。！？…]+[。！？…]*/g) ?? [text]) {
    const head = sentence.trim()
    if (!head) continue
    if (head.length <= maxChars) {
      cues.push(head)
      continue
    }
    let current = ''
    for (const part of head.match(/[^，、；：]+[，、；：]?/g) ?? [head]) {
      if (current && current.length + part.length > maxChars) {
        cues.push(current)
        current = part
      } else {
        current += part
      }
      while (current.length > maxChars) {
        cues.push(current.slice(0, maxChars))
        current = current.slice(maxChars)
      }
    }
    if (current) cues.push(current)
  }
  return cues.length ? cues : [String(text).trim()]
}

/** 按分段拼一条 SRT。 */
export function buildSrt(segments) {
  return layoutCues(segments)
    .map((cue, index) => [
      String(index + 1),
      `${srtTime(cue.start)} --> ${srtTime(cue.end)}`,
      wrapCue(cue.text),
      '',
    ].join('\n'))
    .join('\n')
}

function wrapCue(text) {
  const maxChars = 17
  const lines = []
  // 先按句末标点断句，标点跟着前一句走，不会单独占一行
  for (const sentence of String(text).match(/[^。！？…]+[。！？…]*/g) ?? [text]) {
    const head = sentence.trim()
    if (!head) continue
    if (head.length <= maxChars) {
      lines.push(head)
      continue
    }
    // 单句过长，按逗号一档再分
    let current = ''
    for (const part of head.match(/[^，、；：]+[，、；：]?/g) ?? [head]) {
      if (current && current.length + part.length > maxChars) {
        lines.push(current)
        current = part
      } else {
        current += part
      }
    }
    if (current) lines.push(current)
  }
  return lines.join('\n')
}

function assTime(seconds) {
  const total = Math.max(0, seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = Math.floor(total % 60)
  const cs = Math.round((total - Math.floor(total)) * 100)
  const pad = (n, size = 2) => String(n).padStart(size, '0')
  return `${hours}:${pad(minutes)}:${pad(secs)}.${pad(cs)}`
}

/**
 * 烧录用 ASS：必须在文件头写 PlayResX/PlayResY，否则 libass 会按默认 384×288
 * 排版，字号被放大数倍、位置跑到画面外。
 */
export function buildAss(segments, { width = 1080, height = 1920 } = {}) {
  const fontSize = Math.round(Math.min(width, height) * 0.052)
  const marginV = Math.round(height * 0.125)
  const marginH = Math.round(width * 0.075)
  const head = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    'WrapStyle: 2',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Default,WenQuanYi Zen Hei,${fontSize},&H00FFFFFF,&H00FFFFFF,&H99101010,&H00000000,0,0,0,0,100,100,0,0,1,${Math.max(2, Math.round(fontSize * 0.06))},0,2,${marginH},${marginH},${marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ]
  const events = layoutCues(segments).map(cue =>
    `Dialogue: 0,${assTime(cue.start)},${assTime(cue.end)},Default,,0,0,0,,${wrapCue(cue.text).split('\n').join('\\N')}`)
  return `${head.concat(events).join('\n')}\n`
}

/**
 * 把字幕压进画面。传 ASS 文件，样式与画布尺寸都写在文件头里。
 */
export async function burnSubtitles(input, subtitleFile, output) {
  const filter = `subtitles=${escapeFilterPath(subtitleFile)}`
  await run(FFMPEG, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', input,
    '-vf', filter,
    ...encoderArgsSync(),
    '-c:a', 'copy', '-movflags', '+faststart',
    output,
  ])
  return output
}

/** ffmpeg 的 filter 参数里，盘符和冒号要转义。 */
function escapeFilterPath(path) {
  return String(path).replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'")
}

export async function listShots(dir) {
  try {
    return (await readdir(dir)).filter(name => name.endsWith('.mp4')).sort()
  } catch {
    return []
  }
}
