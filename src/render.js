// 装配：每段「静图 + 旁白」拼成一个镜头，再按顺序接成整片。
// 只用 ffmpeg/ffprobe，全部走 execFile（不经 shell），路径里的空格和引号不会出事。
import { execFile } from 'node:child_process'
import { writeFile, readdir } from 'node:fs/promises'
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
export async function renderShot({ image, audio, output, seconds, width, height, kenBurns }) {
  const w = even(width)
  const h = even(height)
  const duration = Math.max(0.8, Number(seconds) || 0) + 0.25
  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-loop', '1', '-framerate', '30', '-i', image, '-i', audio]

  if (kenBurns) {
    // 先放大到 2 倍再 zoompan，避免推近时出现像素抖动
    const frames = Math.max(2, Math.round(duration * 30))
    const vf = [
      `scale=${w * 2}:${h * 2}:force_original_aspect_ratio=increase`,
      `crop=${w * 2}:${h * 2}`,
      `zoompan=z='min(zoom+0.00022,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${w}x${h}:fps=30`,
      'format=yuv420p',
    ].join(',')
    args.push('-vf', vf)
  } else {
    const vf = [
      `scale=${w}:${h}:force_original_aspect_ratio=decrease`,
      `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black`,
      'format=yuv420p',
    ].join(',')
    args.push('-vf', vf)
  }

  args.push(
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21',
    '-r', '30', '-t', duration.toFixed(3),
    '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2',
    '-movflags', '+faststart',
    output,
  )
  await run(FFMPEG, args)
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
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21',
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
