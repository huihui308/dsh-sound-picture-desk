// 说书稿：把一个题材写成能念出来的分段旁白，每段配一个可画的画面提示词。
import { callModel, extractJson } from './llm.js'
import { newId } from './store.js'

/** 视觉风格预设。风格后缀由代码追加，模型只负责画面内容，换风格不用重写稿。 */
export const VISUAL_STYLES = {
  cinematic: {
    label: '电影写实',
    suffix:
      'cinematic realism, natural skin texture with pores and fine lines, anatomically correct hands, practical light with a single named key light, film grain, muted period colors, shallow depth of field, vertical 9:16 composition, no text, no watermark, no lettering',
  },
  gongbi: {
    label: '国画工笔',
    suffix:
      'traditional Chinese gongbi fine-brush painting, mineral pigments, ink outlines, silk texture, muted earth palette, vertical hanging-scroll composition, no text, no seal, no calligraphy',
  },
  comic: {
    label: '连环画',
    suffix:
      'Chinese lianhuanhua storybook illustration, ink-wash line work with flat color wash, 1980s printed book texture, vertical composition, no text, no speech bubble, no lettering',
  },
  ink: {
    label: '水墨写意',
    suffix:
      'Chinese ink wash painting, expressive brush strokes, generous negative space, monochrome with one restrained accent color, rice paper grain, vertical composition, no text, no seal, no calligraphy',
  },
  dark: {
    label: '暗调悬疑',
    suffix:
      'moody low-key cinematic still, hard rim light, deep shadow with retained shadow detail and midtone separation, desaturated cool palette with one warm practical source, film grain, vertical 9:16 composition, no text, no watermark',
  },
}

export function styleLabel(id) {
  return VISUAL_STYLES[id]?.label ?? VISUAL_STYLES.cinematic.label
}

const SYSTEM = `你是一位靠嘴吃饭的说书人，给中文竖屏短视频写旁白稿。你写的东西要被人念出来听，不是被人读。

写法要求：
- 开篇第一句就是钩子，直接把人拽进场景。不要"今天我们来聊聊"、"大家好"，不要先交代背景再讲故事。
- 口语，短句。一句话别超过两次换气。用"话说"、"却说"、"这一下"、"谁也没想到"这类讲述腔调，但不要油滑，不要每句都抖机灵。
- 有时间线、有因果：谁做了什么，于是怎样，结果如何。听众要能一直知道自己在哪一步。
- 每段结尾留一个往下听的扣子（一个悬念、一个反常、一句反问），下一段接住它。
- 感情靠事实压出来，不靠形容词堆。不写"令人震惊的是"，直接说那件让人震惊的事。
- 涉及真实人物、年代、官职、称谓，必须用准确的；拿不准的写成模糊表述（"一位亲王"而不是编一个封号），绝不编造人名、年份、封号、数字。
- 不写免责声明、不写"本故事纯属"、不在正文里解释哪部分是史实哪部分是演绎。史实分寸体现在写什么、模糊什么。

每段还要给一个画面提示词（image），给画师/画图模型用：
- 只写画面内容：主体、动作、环境、前景遮挡、两三千件陈设、光源方向与色温、气氛。中文描述。
- 竖屏构图，主体偏中上，下半部留给字幕。
- 写清人数与动作（"只有一人"、"共三人"）。不要用否定句去消除人。
- 时代细节用形状写，不用朝代名："剃发留辫、无发髻、圆锥形暖帽带红缨、圆领前开襟外褂、马蹄袖"这样的具体形制。
- 不要写任何文字、字幕、印章、招牌内容。

只输出 JSON，不要别的话：
{"title":"这一期的封号，8 字以内","angle":"一句话说清这期讲什么","segments":[{"text":"本段旁白","image":"本段画面"}]}

直接输出这份 JSON：不要复述题目、不要解释思路、不要把稿子写进思考过程。`

function userPrompt({ topic, rawText, segmentCount, perSegmentChars, style, references }) {
  const lines = [
    `题材：${topic}`,
    `一共写 ${segmentCount} 段。每段旁白 ${perSegmentChars - 20}–${perSegmentChars + 20} 个汉字，念出来大约 ${Math.round(perSegmentChars / 4.2)} 秒。`,
    `画面风格：${VISUAL_STYLES[style]?.label ?? '电影写实'}。image 字段只写画面内容，不要重复风格词。`,
  ]
  if (references?.length) {
    lines.push(
      '',
      '用户给了这些参考视频，是他认可的同类作品。学它们的选题角度、开场钩子、结构节奏和语气，但不要照搬里面的具体内容和说法：',
      ...references.map(ref => `- ${ref.title ? `${ref.title}｜` : ''}${ref.url}`),
    )
  }
  if (rawText && rawText.trim()) {
    lines.push('', '以下是原始材料，按它的内容写，不要偏离，也不要照抄原句：', '', rawText.trim().slice(0, 12000))
  } else {
    lines.push('', '没有给原始材料：按公认的史实/公开事实写；边角细节拿不准就模糊处理。')
  }
  return lines.join('\n')
}

function normalizeSegments(rows) {
  const clean = []
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || typeof row !== 'object') continue
    const text = String(row.text ?? '').trim()
    if (!text) continue
    clean.push({
      id: newId('seg'),
      idx: clean.length,
      text,
      imagePrompt: String(row.image ?? row.imagePrompt ?? '').trim(),
      imagePath: null,
      audioPath: null,
      audioSecs: 0,
      error: null,
    })
  }
  return clean
}

/**
 * 生成说书稿。返回 { title, angle, segments }，不做落盘——调用方决定怎么存。
 */
export async function writeScript(ctx, { topic, rawText, settings, signal, route, references, onProgress }) {
  const requested = Math.max(3, Math.min(40, Number(settings?.segmentSeconds) > 0 ? Math.round(300 / Number(settings.segmentSeconds)) : 8))
  // 分段按目标时长算：整体先按 5 分钟基线，用户改了段长就跟着变
  const perSegmentChars = Math.max(90, Math.min(260, Math.round((Number(settings?.segmentSeconds) || 40) * 4.2)))
  const segmentCount = Math.max(3, Math.min(40, Math.round((Number(settings?.targetMinutes) || 5) * 60 / (Number(settings?.segmentSeconds) || 40)) || requested))
  const { text } = await callModel(ctx, {
    system: SYSTEM,
    user: userPrompt({ topic, rawText, segmentCount, perSegmentChars, style: settings?.visualStyle ?? 'cinematic', references }),
    // 推理型模型（glm-5.3 等）会先想很久，预算给小了正文就没地方放
    // 实测：3 段稿子思考约 9000 字（≈6000 token），给 7600 会截断白跑一轮，一次给够
    maxTokens: Math.min(48000, 12000 + segmentCount * 1500),
    signal,
    route,
    onProgress,
  })
  const plan = extractJson(text)
  const segments = normalizeSegments(plan.segments)
  if (segments.length < 2) throw new Error('模型返回的分段太少，重试一次或换个题材描述')
  return {
    title: String(plan.title ?? '').trim().slice(0, 40) || String(topic).slice(0, 40),
    angle: String(plan.angle ?? '').trim().slice(0, 200),
    segments,
  }
}
