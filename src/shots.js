// 一句一景：把一段旁白拆成 2-4 个镜头。
// 关键不是拆得细，是拆出来的镜头别长一个样——所以景别必须交替，评论句不新出图。

export const SHOT_SIZES = ['wide', 'medium', 'close', 'detail']

export const SHOT_SYSTEM = `你是纪录片分镜师。给你一段旁白，拆成 2-4 个镜头。

规则：
1. 每个镜头标景别：wide（全景/远景）、medium（中景）、close（特写）、detail（细节物件）。
2. 相邻两镜的景别必须不同。不许连续两个 medium，也不许三个都是中景——那是同一个画面换了三张皮。
3. 评论句不新出图。判断、总结、解释、「真正决定性的是……」「这是……的反面」这类句子没有可拍的东西，
   把它挂在上一镜上（reuse: true），不要硬憋一个意象。
4. 画面描述只写看得见的东西：谁、在哪、做什么、光从哪来、机位高低、前景有什么遮挡。
   不要写情绪词（「气氛紧张」），要写让人感到紧张的具体东西（「帐幔被风吹得贴住墙」）。
5. 不要和上一段已经用过的构图重复。

输出 JSON，不要解释：
{"shots":[{"text":"这一镜对应的原文片段","shot":"wide","desc":"画面描述","reuse":false}]}`

/** 拼给模型的用户消息：带上上一段用过的构图，避免撞图。 */
export function buildShotPrompt({ text, prevImage }) {
  const lines = [`旁白原文：`, text || '']
  if (prevImage) {
    lines.push('', '上一段已经用过的画面（别重复它的构图）：', String(prevImage).slice(0, 200))
  }
  return lines.join('\n')
}

/** 清洗模型给的镜头：景别合法、数量 2-4、相邻景别不重复（发现重复就换一个）。 */
export function normalizeShots(parsed, limit = 4) {
  const raw = Array.isArray(parsed?.shots) ? parsed.shots : []
  const shots = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const desc = String(row.desc ?? '').trim().slice(0, 300)
    if (!desc) continue
    let shot = String(row.shot ?? '').toLowerCase()
    if (!SHOT_SIZES.includes(shot)) shot = 'medium'
    // 相邻同景别：换成一个没连着用的
    if (shots.length && shots[shots.length - 1].shot === shot) {
      shot = SHOT_SIZES.find(size => size !== shot) ?? shot
    }
    shots.push({
      text: String(row.text ?? '').trim().slice(0, 200),
      shot,
      desc,
      reuse: row.reuse === true,
    })
    if (shots.length >= limit) break
  }
  return shots
}
