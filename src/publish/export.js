// 发布包：把成片、封面、文案和清单整理成一个目录，用户自己上传。
// 不登录平台、不调用任何账号接口。
import { createHash } from 'node:crypto'
import { copyFile, mkdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { join } from 'node:path'
import { PLATFORMS, formatBytes, formatDuration, xPosts } from './rules.js'

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

function xhsCopyMarkdown(variant) {
  const title = String(variant.title ?? '').trim()
  const body = String(variant.body ?? '').trim()
  const tags = (Array.isArray(variant.tags) ? variant.tags : []).map(tag => '#' + String(tag).trim())
  const comment = String(variant.comment ?? '').trim()
  const lines = ['【标题】', title, '', '【正文】', body, '', '【话题】', tags.join(' ')]
  if (comment) lines.push('', '【置顶评论】', comment)
  return lines.join('\n') + '\n'
}

function xCopyMarkdown(variant) {
  const posts = xPosts(variant).map(post => String(post).trim()).filter(Boolean)
  if (!posts.length) return '【正文】\n\n'
  if (posts.length === 1) return '【正文】\n' + posts[0] + '\n'
  return posts.map((post, index) => (index === 0 ? '【主帖】\n' : '【回复 ' + index + '】\n') + post).join('\n\n') + '\n'
}

function readmeMarkdown({ item, targets, stamp, ruleVersion, video, cover, hasComment, hasClip, hasCards }) {
  const lines = []
  lines.push('# ' + (item.title || '未命名') + ' · 发布包')
  lines.push('')
  lines.push('- 导出时间：' + stamp)
  lines.push('- 规则版本：' + ruleVersion)
  if (video) lines.push('- 视频：' + formatDuration(video.secs) + ' · ' + formatBytes(video.bytes))
  if (!cover) lines.push('- 封面：本包未包含，上传时用平台默认首帧，或回工作台补生成')
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
      if (hasCards) steps.push('发图文笔记：按 ' + id + '/cards/01… 顺序上传；发视频笔记：上传 ' + id + '/video.mp4')
      if (hasComment) steps.push('发布后打开 ' + id + '/comment.md，把置顶评论贴到第一条评论并置顶（定时笔记发布前不能评论）')
    } else {
      if (hasClip) steps.push('主帖上传 ' + id + '/video-60s.mp4（≤60 秒切片），回复 1 上传 ' + id + '/video.mp4（全片）')
      steps.push('打开 ' + id + '/copy.md，按主帖、回复 1…的顺序逐条发；主帖先发，回复挂在前一条下')
    }
    lines.push('')
    lines.push('### ' + platform.label)
    steps.forEach((step, index) => lines.push((index + 1) + '. ' + step))
  }
  lines.push('')
  lines.push('## 说明')
  lines.push('- 这个包由声画工作台生成，不包含账号登录信息，也不会替你在平台上点发布。')
  lines.push('- 小红书置顶评论要等笔记发布后才有入口；定时发布时提前补不了。')
  lines.push('- 平台规则会变，当前口径见上面的规则版本；以平台后台提示为准。')
  lines.push('- 发布后回到工作台「发布」页标记已发布，方便下一版对照数据。')
  return lines.join('\n') + '\n'
}

function checklistMarkdown({ item, targets, hasComment, hasClip, hasCards }) {
  const lines = [
    '# 发布清单 · ' + (item.title || '未命名'),
    '',
    '| 平台 | 账号 | 状态 | 链接 |',
    '|---|---|---|---|',
  ]
  for (const id of targets) lines.push('| ' + PLATFORMS[id].label + ' |  | 待发布 |  |')
  lines.push('')
  lines.push('## 发布后')
  if (targets.includes('xiaohongshu')) {
    if (hasCards) lines.push('- 小红书：图文笔记按 cards/01… 顺序上传；视频笔记用 video.mp4。')
    if (hasComment) lines.push('- 小红书：发布后把 comment.md 贴到第一条评论并置顶；定时笔记发布前不能评论。')
  }
  if (targets.includes('x')) {
    lines.push('- X：按 copy.md 的主帖/回复顺序逐条发，回复挂在前一条下，主帖置顶。' + (hasClip ? ' 主帖视频用 video-60s.mp4。' : ''))
  }
  return lines.join('\n') + '\n'
}

const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i

export function exportSlug(item) {
  const raw = String(item?.title ?? '').trim()
  let clean = raw.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40).replace(/[. ]+$/g, '')
  if (!clean) clean = String(item?.id ?? 'project')
  if (WINDOWS_RESERVED.test(clean)) clean = '_' + clean
  return clean
}

/**
 * 生成发布包。返回的结构给 host 用来拼界面链接和记录。
 * 不负责校验文案——调用方先跑一遍规则检查，有阻断项就不要导。
 *
 * 导出是快照：视频/封面一律 copy 而不是硬链接，母版重渲染不会隔空改写旧包；
 * 先写到隐藏临时目录，全部成功后再 rename 成正式目录，中途失败不会留下半成品。
 */
export async function buildExport({ baseDir, item, publish, targets, ruleVersion, now = new Date() }) {
  if (!item?.render?.path) throw Object.assign(new Error('还没有成片，先合成'), { status: 400 })
  const baseStamp = exportStamp(now)
  let stamp = baseStamp
  for (let index = 2; index <= 50; index += 1) {
    const exists = await stat(join(baseDir, 'exports', stamp)).then(() => true, () => false)
    if (!exists) break
    stamp = baseStamp + '-' + index
  }
  const relDir = 'exports/' + stamp
  const absDir = join(baseDir, 'exports', stamp)
  const tmpDir = join(baseDir, 'exports', '.tmp-' + stamp + '-' + Math.random().toString(36).slice(2, 8))

  const videoSource = join(baseDir, item.render.path)
  const videoBytes = await fileSize(videoSource)
  if (!videoBytes) throw Object.assign(new Error('成片文件不见了，重新合成一次'), { status: 400 })

  const files = []
  let clipIncluded = false
  let cardsIncluded = 0
  const tmpPath = rel => join(tmpDir, rel.slice(relDir.length + 1))
  const record = async (rel, extra = {}) => {
    const abs = tmpPath(rel)
    const bytes = extra.bytes ?? await fileSize(abs)
    files.push({
      path: rel,
      name: rel.slice(relDir.length + 1),
      bytes,
      sha256: extra.skipHash ? null : await sha256(abs),
    })
  }

  await mkdir(tmpDir, { recursive: true })
  try {
    let coverIncluded = null
    for (const id of targets) {
      const platform = PLATFORMS[id]
      if (!platform) continue
      const platformDir = join(tmpDir, id)
      await mkdir(platformDir, { recursive: true })

      const videoRel = relDir + '/' + id + '/video.mp4'
      await copyFile(videoSource, join(platformDir, 'video.mp4'))
      await record(videoRel, { bytes: videoBytes })

      // X 主帖单独带 60 秒切片；全片仍留给回复 1
      if (id === 'x' && publish?.clip?.path) {
        const clipSource = join(baseDir, publish.clip.path)
        try {
          await copyFile(clipSource, join(platformDir, 'video-60s.mp4'))
          await record(relDir + '/' + id + '/video-60s.mp4')
          clipIncluded = true
        } catch {
          // 切片文件没了不阻断导出，README 会退回“上传全片”的说明
        }
      }

      if (id === 'xiaohongshu' && publish?.cover?.path) {
        const coverSource = join(baseDir, publish.cover.path)
        const coverName = 'cover-' + publish.cover.width + 'x' + publish.cover.height + '.png'
        const coverRel = relDir + '/' + id + '/' + coverName
        try {
          await copyFile(coverSource, join(platformDir, coverName))
          await record(coverRel)
          coverIncluded = publish.cover
        } catch {
          // 封面文件没了就跳过，不阻断导出；README 会说明
        }
      }

      const copyRel = relDir + '/' + id + '/copy.md'
      const markdown = id === 'xiaohongshu'
        ? xhsCopyMarkdown(publish?.variants?.xiaohongshu ?? {})
        : xCopyMarkdown(publish?.variants?.x ?? {})
      await writeFile(join(platformDir, 'copy.md'), markdown, 'utf8')
      await record(copyRel)

      if (id === 'xiaohongshu' && Array.isArray(publish?.cards) && publish.cards.length) {
        const cardsDir = join(platformDir, 'cards')
        await mkdir(cardsDir, { recursive: true })
        for (let index = 0; index < publish.cards.length; index += 1) {
          const card = publish.cards[index]
          const name = String(index + 1).padStart(2, '0') + '.png'
          try {
            await copyFile(join(baseDir, card.path), join(cardsDir, name))
            await record(relDir + '/' + id + '/cards/' + name)
            cardsIncluded += 1
          } catch {
            // 单张卡片丢了就跳过，不阻断整个发布包
          }
        }
      }

      if (id === 'xiaohongshu' && String(publish?.variants?.xiaohongshu?.comment ?? '').trim()) {
        const commentRel = relDir + '/' + id + '/comment.md'
        await writeFile(join(platformDir, 'comment.md'), String(publish.variants.xiaohongshu.comment).trim() + '\n', 'utf8')
        await record(commentRel)
      }
    }

    const readmeRel = relDir + '/README.md'
    await writeFile(join(tmpDir, 'README.md'), readmeMarkdown({
      item, targets, stamp, ruleVersion, cover: coverIncluded,
      hasComment: Boolean(String(publish?.variants?.xiaohongshu?.comment ?? '').trim()),
      hasClip: clipIncluded,
      hasCards: cardsIncluded > 0,
      video: { secs: item.render.secs, bytes: videoBytes },
    }), 'utf8')
    await record(readmeRel)

    const checklistRel = relDir + '/checklist.md'
    await writeFile(join(tmpDir, 'checklist.md'), checklistMarkdown({
      item, targets,
      hasComment: Boolean(String(publish?.variants?.xiaohongshu?.comment ?? '').trim()),
      hasClip: clipIncluded,
      hasCards: cardsIncluded > 0,
    }), 'utf8')
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
    await writeFile(join(tmpDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8')
    files.push({
      path: manifestRel,
      name: 'manifest.json',
      bytes: await fileSize(join(tmpDir, 'manifest.json')),
      sha256: null,
    })

    await rename(tmpDir, absDir)
    return {
      stamp,
      relDir,
      absDir,
      slug: exportSlug(item),
      folderName: exportSlug(item) + '-' + stamp,
      targets,
      files,
      manifest,
    }
  } catch (err) {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {})
    throw err
  }
}
