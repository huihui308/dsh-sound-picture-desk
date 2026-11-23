// 发布包：把成片、封面、文案和清单整理成一个目录，用户自己上传。
// 不登录平台、不调用任何账号接口。
import { createHash } from 'node:crypto'
import { copyFile, link, mkdir, stat, writeFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { join } from 'node:path'
import { PLATFORMS, formatBytes, formatDuration } from './rules.js'

function pad(value) { return String(value).padStart(2, '0') }

/** 本地时间戳，便于用户按时间找目录。 */
export function exportStamp(date = new Date()) {
  return String(date.getFullYear()) + pad(date.getMonth() + 1) + pad(date.getDate())
    + '-' + pad(date.getHours()) + pad(date.getMinutes()) + pad(date.getSeconds())
}

async function fileSize(file) {
  try { const info = await stat(file); return info.size } catch { return 0 }
}

async function sha256(file) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  return hash.digest('hex')
}

/** 同卷硬链接，省一份视频占位；跨卷或不支持就退回复制。 */
async function linkOrCopy(source, target) {
  try { await link(source, target); return 'link' } catch { await copyFile(source, target); return 'copy' }
}

function xhsCopyMarkdown(variant) {
  const title = String(variant.title ?? '').trim()
  const body = String(variant.body ?? '').trim()
  const tags = (Array.isArray(variant.tags) ? variant.tags : []).map(tag => '#' + String(tag).trim())
  return ['【标题】', title, '', '【正文】', body, '', '【话题】', tags.join(' ')].join('\n') + '\n'
}

function xCopyMarkdown(variant) {
  return ['【正文】', String(variant.text ?? '').trim()].join('\n') + '\n'
}

function readmeMarkdown({ item, targets, stamp, ruleVersion, video, cover }) {
  const lines = []
  lines.push('# ' + (item.title || '未命名') + ' · 发布包')
  lines.push('')
  lines.push('- 导出时间：' + stamp)
  lines.push('- 规则版本：' + ruleVersion)
  if (video) lines.push('- 视频：' + formatDuration(video.secs) + ' · ' + formatBytes(video.bytes))
  lines.push('')
  lines.push('## 怎么发')
  for (const id of targets) {
    const platform = PLATFORMS[id]
    const steps = ['打开 ' + platform.composeUrl, '上传 ' + id + '/video.mp4']
    if (id === 'xiaohongshu') {
      if (cover) {
        const size = PLATFORMS.xiaohongshu.cover
        steps.push('上传 ' + id + '/cover-' + size.width + 'x' + size.height + '.png 作为封面')
      }
      steps.push('打开 ' + id + '/copy.md，复制标题、正文和话题')
    } else {
      steps.push('打开 ' + id + '/copy.md，复制正文（含话题）')
    }
    lines.push('')
    lines.push('### ' + platform.label)
    steps.forEach((step, index) => lines.push((index + 1) + '. ' + step))
  }
  lines.push('')
  lines.push('## 说明')
  lines.push('- 这个包由声画工作台生成，不包含账号登录信息，也不会替你在平台上点发布。')
  lines.push('- 平台规则会变，当前口径见上面的规则版本；以平台后台提示为准。')
  lines.push('- 发布后回到工作台「发布」页标记已发布，方便下一版对照数据。')
  return lines.join('\n') + '\n'
}

function checklistMarkdown({ item, targets }) {
  const lines = [
    '# 发布清单 · ' + (item.title || '未命名'),
    '',
    '| 平台 | 账号 | 状态 | 链接 |',
    '|---|---|---|---|',
  ]
  for (const id of targets) lines.push('| ' + PLATFORMS[id].label + ' |  | 待发布 |  |')
  return lines.join('\n') + '\n'
}

function exportSlug(item) {
  const raw = String(item?.title ?? '').trim()
  const clean = raw.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40)
  return clean || String(item?.id ?? 'project')
}

/**
 * 生成发布包。返回的结构给 host 用来拼界面链接和记录。
 * 不负责校验文案——调用方先跑一遍规则检查，有阻断项就不要导。
 */
export async function buildExport({ baseDir, item, publish, targets, ruleVersion, now = new Date() }) {
  if (!item?.render?.path) throw Object.assign(new Error('还没有成片，先合成'), { status: 400 })
  const stamp = exportStamp(now)
  const relDir = 'exports/' + stamp
  const absDir = join(baseDir, 'exports', stamp)
  await mkdir(absDir, { recursive: true })

  const videoSource = join(baseDir, item.render.path)
  const videoBytes = await fileSize(videoSource)
  if (!videoBytes) throw Object.assign(new Error('成片文件不见了，重新合成一次'), { status: 400 })

  const files = []
  const record = async (rel, extra = {}) => {
    const abs = join(baseDir, rel)
    const bytes = extra.bytes ?? await fileSize(abs)
    files.push({
      path: rel,
      name: rel.slice(relDir.length + 1),
      bytes,
      sha256: extra.skipHash ? null : await sha256(abs),
    })
  }

  let coverIncluded = null
  for (const id of targets) {
    const platform = PLATFORMS[id]
    if (!platform) continue
    const platformDir = join(absDir, id)
    await mkdir(platformDir, { recursive: true })

    const videoRel = relDir + '/' + id + '/video.mp4'
    await linkOrCopy(videoSource, join(platformDir, 'video.mp4'))
    await record(videoRel, { bytes: videoBytes })

    if (id === 'xiaohongshu' && publish?.cover?.path) {
      const coverSource = join(baseDir, publish.cover.path)
      const coverName = 'cover-' + publish.cover.width + 'x' + publish.cover.height + '.png'
      const coverRel = relDir + '/' + id + '/' + coverName
      try {
        await linkOrCopy(coverSource, join(platformDir, coverName))
        await record(coverRel)
        coverIncluded = publish.cover
      } catch {
        // 封面文件没了就跳过，不阻断导出；界面会提示
      }
    }

    const copyRel = relDir + '/' + id + '/copy.md'
    const markdown = id === 'xiaohongshu'
      ? xhsCopyMarkdown(publish?.variants?.xiaohongshu ?? {})
      : xCopyMarkdown(publish?.variants?.x ?? {})
    await writeFile(join(platformDir, 'copy.md'), markdown, 'utf8')
    await record(copyRel)
  }

  const readmeRel = relDir + '/README.md'
  await writeFile(join(absDir, 'README.md'), readmeMarkdown({
    item, targets, stamp, ruleVersion, cover: coverIncluded,
    video: { secs: item.render.secs, bytes: videoBytes },
  }), 'utf8')
  await record(readmeRel)

  const checklistRel = relDir + '/checklist.md'
  await writeFile(join(absDir, 'checklist.md'), checklistMarkdown({ item, targets }), 'utf8')
  await record(checklistRel)

  const manifest = {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    ruleVersion,
    project: { id: item.id, title: item.title, secs: item.render.secs },
    targets,
    files: files.map(file => ({ path: file.name, bytes: file.bytes, sha256: file.sha256 })),
  }
  const manifestRel = relDir + '/manifest.json'
  await writeFile(join(absDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  files.push({
    path: manifestRel,
    name: 'manifest.json',
    bytes: await fileSize(join(absDir, 'manifest.json')),
    sha256: null,
  })

  const slug = exportSlug(item)
  return {
    stamp,
    relDir,
    absDir,
    slug,
    folderName: slug + '-' + stamp,
    targets,
    files,
    manifest,
  }
}
