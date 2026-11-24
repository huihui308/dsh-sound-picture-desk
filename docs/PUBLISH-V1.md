# 发布功能 V1 设计：小红书 / X 发布包

> 状态：已实现（develop，2026-11-23） · 分支 `develop`
> 前置讨论：媒体工作台功能拆解 → 只取「发布包 + 引导」，不碰账号。
> 本文只定方案，不含实现。

## 1. 背景

声画工作台已经能出 1080×1920 成片 + SRT。下一步补上「成片之后」：按平台生成文案、封面和发布包，用户自己复制文案、上传视频。第一版只做小红书和 X。

不做自动发布的理由：插件跑在客户自己的 DSH 上，账号风险从「托管」变成「操作 + 归因」；选择器维护是一人团队扛不住的长期成本；客户环境（Chrome、显示器、代理、杀软）不可控。发布包零账号、零依赖、跨环境，是能长期当默认路径的版本。

## 2. 目标与非目标

### 目标

1. 成片后一键生成小红书 / X 两套文案变体，可编辑。
2. 小红书 3:4 封面自动生成；不动成片首帧用的 `item.cover`。
3. 发布前检查：字数、时长、大小、比例，超限给出修法。
4. 发布包导出：本地目录 + 远程 Web 浏览器下载都能拿到文件。
5. 发布记录与作品级指标手动回填，字段先留。

### 非目标

- 不登录平台、不填表、不自动点发布、不采集数据。
- 不做定时发布、多账号、团队协作。
- 不自动切条/重剪（长视频只提示，不处理）。
- V1 不做多语言 UI（沿用现有中文界面）。

## 3. 平台规则（初值，以平台后台实测校准）

| 项 | 小红书 | X |
|---|---|---|
| 视频比例 / 尺寸 | 9:16，1080×1920 推荐 | 同左（X 支持竖屏） |
| 视频时长 | ≤ 15 分钟（账号档位可能不同） | ≤ 2:20（非 Premium）；Premium 更长 |
| 视频大小 | 初值 2 GB，待校准 | ≤ 512 MB |
| 标题 | ≤ 20 字 | 与正文合并，无独立标题 |
| 正文 | ≤ 1000 字 | 单条 ≤ 280 加权字符 |
| 话题 | ≤ 10 个，建议 3–5 个 | 1–3 个，内联在正文里 |
| 封面 | 3:4，1080×1440 | 取视频首帧，不出独立封面 |
| 其他 | 1 条笔记 1 个视频 | 1 条帖子 1 个视频或 ≤ 4 张图 |

落地要求：

- 规则集中放 `src/publish/rules.js`，改一处就行；带 `RULE_VERSION` 标记口径日期。V1 随插件版本发布，不做数据目录热覆盖（真需要再补）。
- X 计数按官方加权口径：CJK 字符 2、URL 23、其余 1，不要用简单字符数。
- 界面不再单独显示规则版本与校准日期（v1.1 发布页顶部已移除）；规则版本写进 `manifest.json` 与 `RULE_VERSION`，随插件版本发布。

## 4. 页面与交互

- 入口：成片页之后加一个独立「发布」入口。**不要塞进 `STAGES` / `TAB_KEYS`**，阶段派生保持六阶段不变；只有 `stageOf(item) === 'rendered'` 时可点。
- 页面结构：平台页签（小红书 / X）/ 当前平台文案 / 封面（仅小红书页）/ 发布前检查与导出。两个平台固定都进发布包，不再做目标平台勾选；老 `publish.json` 里的窄 `targets` 读入时自动修正。
- 主流程：顶部「小红书 / X」两个平台页签切换；每页「一键生成」只生成当前平台的标题 / 正文 / 话题（X 是合并的一条）→ 编辑（计数、超限标红、一键复制）→ 小红书页生成 3:4 封面 → 发布前检查（只显示当前平台，另一平台的超限单独提示）→ 导出。两个平台都进发布包。
- 复制走 `navigator.clipboard`，非安全上下文（局域网 http）降级到可全选的 textarea。
- 可选按钮：`window.open` 打开平台投稿页，只导航、不代操作。
- 文案未通过校验时阻断导出，必须改到达标；视频超限只警告并给修法（切条建议），不硬阻断。

## 5. 导出包结构

```
exports/<YYYYMMDD-HHmmss>/
  README.md              # 每平台传什么、从哪进
  checklist.md           # 平台 | 账号 | 状态 | 链接
  manifest.json          # 文件清单 + sha256 + 规则版本 + 项目/时间
  xiaohongshu/
    video.mp4            # 导出时复制，作为不可变快照
    cover-1080x1440.png
    copy.md              # 标题 / 正文 / 话题
  x/
    video.mp4
    copy.md              # 合并正文（≤ 280 加权）
```

- 目录写在项目 `exports/<stamp>/` 下；`MEDIA_DIRS` 增加 `exports`，复用现有媒体路由 + `<a download>`，远程 Web 直接下载。
- 桌面版额外提供「复制到指定目录」，复用现有导出目录输入。
- V1 不做 zip；逐个文件下载，V1.1 视需求补打包。

## 6. 文案生成

- 输入：项目标题、分段文本、口吻、平台规则、可选受众。
- 输出严格 JSON：

```json
{ "xiaohongshu": { "title": "", "body": "", "tags": [] }, "x": { "text": "" } }
```

- Prompt 约束：小红书标题带钩子 ≤ 20 字、正文分段 300–600 字、话题 3–5 个；X 单条 ≤ 280 加权、中文紧凑、不用外链、话题 1–3 个内联。
- 生成后校验；超限自动重试一次（把超出数量反馈给模型），仍超限就展示错误 + 手动改。
- 复用 `callModel`（DSH 当前模型），沿用 `item.model` 覆盖；可取消，超时沿用 jobs 队列的 20 分钟看门狗。
- 结果写 `publish.json`；重新生成前确认覆盖。

## 7. 数据模型：`publish.json`

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-11-23T09:00:00.000Z",
  "targets": ["xiaohongshu", "x"],
  "variants": {
    "xiaohongshu": { "title": "", "body": "", "tags": [] },
    "x": { "text": "" }
  },
  "cover": {
    "path": "covers/xhs-1712.png", "title": "", "width": 1080, "height": 1440, "at": null,
    "sourceRef": "segment:s001", "layout": "bottom", "fontScale": 1, "textSource": "auto"
  },
  "exports": [{ "at": "", "stamp": "", "dir": "", "targets": [] }],
  "records": [{
    "platform": "xiaohongshu",
    "status": "published",
    "url": "",
    "note": "",
    "at": "",
    "metrics": {}
  }],
  "revisions": [{
    "id": "rev_...", "at": "2026-11-23T06:20:00.000Z",
    "scope": ["title"], "status": "proposed",
    "feedback": "标题不要用问句，控制在 16 字内",
    "before": { "title": "旧标题" },
    "after": { "title": "改后的标题" },
    "model": "…", "note": "改短了", "appliedAt": null
  }]
}
```

- 每项目独立文件，不进 `state.json`（它已有锁争用）。
- 写入沿用 `state.json` 的纪律：锁文件 + 持锁重读 + `tmp`/`rename` 原子写，防止桌面端和 Web 端双 Host 覆盖；锁对陈旧文件用 `rename` 原子接管。
- 没有文件的旧项目按默认空对象处理，不需要迁移。

## 8. 服务端改动

- 新模块：`src/publish/rules.js`（规则 + 计数 + 校验）、`copy.js`（生成与解析）、`export.js`（打包/清单）。
- `host.js` 新增 action：`publish/read`、`publish/generate`、`publish/save`、`publish/cover`、`publish/export`、`publish/record`。
- `MEDIA_DIRS` 增加 `exports`。
- 从 `makeCover` 抽出 `renderCoverFile()`（底图 + 大字 + 输出路径）；小红书 3:4 封面单独存 `publish.cover`，保留 `item.cover` 给成片首帧。
- 导出时用 `probeDuration()`、`stat()` 做时长与大小检查。
- 不新增 npm 依赖。

## 9. 客户端改动

- 新视图独立于六页签，复用现有样式 token、`DropSelect`、复制/下载组件。
- 计数、超限红标、复制按钮、下载链接、导出进度。
- 平台页签角标显示该平台超限数；顶部不再显示规则版本 / 不碰账号提示。
- 错误翻人话，参照现有「本机生图模型没启动 → 去 Gen Studio」的处理方式。

## 10. 测试

- `node:test`：X 加权计数、小红书码点计数（含 emoji）、文件名安全化（Windows 保留名）、视频 warn / 阻断判定、manifest、同秒导出后缀、导出快照、缺封面、坏 JSON、陈旧锁、文案重试与保留首版。
- 手工：短片与长片各一条；桌面本地导出 + 远程 Web 下载；两平台各实际发布一次；回填记录。
- 回归：六阶段流程、旧项目打开、原有「导出成片」功能不受影响。

## 11. 验收标准

- 一条成片从点「发布」到两平台各自可发 ≤ 10 分钟（含文案微调）。
- 文案默认可用率 ≥ 80%（不编辑直接发）。
- 超限检查 100% 拦截（字数），视频超限有明确修法提示。
- 桌面版与远程 Web 都能拿到全部文件。
- 全流程没有任何平台登录或账号相关网络请求（LLM / 生图 / TTS 通道除外）。
- 失败信息能照着修。

## 12. 里程碑（约 5–6 人日）

| 阶段 | 内容 | 估算 |
|---|---|---|
| M1 | 规则 + 计数 + 文案生成 | 1.5 天 |
| M2 | 小红书 3:4 封面 + 导出包 + 下载 | 1.5 天 |
| M3 | 发布页 UI + 记录/清单 | 1.5 天 |
| M4 | 测试 + 文档 + 验收 | 1 天 |

完成后 `develop` 合并回 `master`（`--no-ff`），版本 1.1.0。

## 13. 风险与开放问题

- 平台规则会变：集中配置 + `RULE_VERSION` 标记日期；改规则随插件版本发布。
- X 账号档位未知：时长/大小超限给警告，提示 Premium 可忽略，不硬阻断。
- 长视频不适配短视频平台：V1 只提示切条，不做自动切条。
- 文案 JSON 解析不稳定：重试 + 手动编辑兜底。
- 封面中文字体跨平台：复用现有 `COVER_FONT`，缺失时提示。
- 大文件下载：流式响应，不做断点续传。
- 开放问题：发布是否最终拆成独立插件（V1 不拆，模块内聚，等加浏览器自动化再评估）。

## 14. 分支与发布流程

- `master` 稳定，`develop` 开发；不再直接往 `master` 提交功能。
- 功能完成 → 自测 + 验收 → `git switch master && git merge --no-ff develop` → 版本 1.1.0 → push。
- 回滚：暂时移除「发布」入口或 revert 合并提交；接口都在 `publish/*` 命名空间下，便于整体摘掉。

## 15. 实现落点（2026-11-23）

- 规则 / 计数 / 校验：`src/publish/rules.js`；文案生成：`src/publish/copy.js`；发布包：`src/publish/export.js`。
- Host：`publish/read`、`publish/generate`、`publish/save`、`publish/cover`、`publish/export`、`publish/record` 六个 action；`MEDIA_DIRS` 加 `exports`，`.md` / `.txt` 可下载。按意见修改新增 `publish/revise`、`publish/revise/apply`、`publish/revise/discard`、`publish/revise/revert`。
- 2026-11-23 复审修复：发布范围固定双平台并修正老窄 `targets`；单平台生成不再用空串覆盖另一平台；导出改为 copy 快照 + 临时目录原子 rename + 同秒后缀；锁陈旧接管原子化、超时 15 秒；文案 JSON 解析失败纠偏重试、重试更差保留首版；导出/封面在任务运行时返回 409；视频时长缺失补 `probeDuration` 并给 warn；小红书计数统一按码点（emoji 算 1）。
- 导出目录选择增加保护：不允许把发布包复制到自己里面；复制失败只回传错误，不影响项目内导出。
- 客户端：「发布」是六个阶段页签之外的独立入口（不进 `STAGES` / `TAB_KEYS`），项目有 `render` 才可点；发布页内用平台页签切换，每平台独立一键生成，页签角标显示该平台超限数。
- 存储：`projects/<id>/publish.json`（`schemaVersion: 1`，独立锁 + 双 Host 防覆盖）；发布包在 `projects/<id>/exports/<时间戳>/`。
- 与设计稿的差异：
  - 生成文案后自动补一张小红书 3:4 封面（失败不影响文案）；导出时封面缺失会再试一次。
  - 视频超平台时长 / 大小只 warn 不挡导出；文案超限才挡。
  - V1 不做 zip；远程访问逐个文件下载。
  - 封面标题按字数自动缩字号，20 字也不会溢出 1080 宽。
- 测试：`npm test`（规则 / 计数 / 导出包 / publish.json 读写 / 按意见修改，共 36 项）。
- 验证前需重启 `dsh-web.service`：Host 半片改了，不重启看不到新接口。

## 16. 按意见修改（V1，2026-11-23）

### 交互

- 标题、正文、封面右上角各有「提意见」；弹层里勾选要改的字段（可多选），选快捷标签或直接写意见。
- 提交前先保存当前草稿作为基线；后台任务只生成 **提案**，不改 `variants` / `cover`。
- 提案弹窗对比旧/新：采用 / 再改一版 / 保留原样。采用才写回；写回后可从「修改历史」回滚。
- 封面单独三栏：文字（3 条候选，选中采用）、底图（分镜图 / 参考图 / 成片封面缩略图）、排版（底部/顶部、字号小/中/大）。
- 标题采用后，若封面大字是自动跟随且已有封面，提示是否同步；手动改过的封面大字不自动动。

### 数据

- `publish.revisions[]`：`id / at / scope / feedback / status(proposed|accepted|rejected|reverted) / before / after / model / note / appliedAt`，最多 30 条。
- `before/after` 只存 scope 内字段；封面大字提案的 `after.coverTexts` 最多 5 条候选。
- `cover` 增加 `sourceRef / layout(bottom|top) / fontScale / textSource(auto|manual)`，保证可复现重渲染。

### API 与状态机

- `publish/revise`：校验 scope、feedback（2–500 字）、任务互斥；先把旧 proposed 标 rejected，再启动 `publish-revise` 任务。
- `publish/revise/apply`：确认提案仍是 proposed；比较当前字段与 `before`，不一致时返回 409 `changed`（客户端确认后可带 `force`）；封面大字按 `coverTextIndex` 选中后重渲染封面；写回后用 `accepted` 标记。
- `publish/revise/discard`：proposed → rejected，内容不变。
- `publish/revise/revert`：accepted → reverted，把 before 写回；封面大字会按旧文字重渲染。
- 任务失败 / 模型返回不可用：不产生提案，原内容不动；网络类错误在 `llm.js` 自动重试两次（优先按 DSH 归一化失败码 `TRANSPORT` / `TIMEOUT` 判定，`ETIMEDOUT` / `ECONNRESET` 等文本作兜底），仍失败给「稍后再试或换模型」提示。

### Prompt 与校验

- `src/publish/revise.js`：输入旁白稿、当前文案、scope、用户意见；要求只输出勾选字段，禁止编造事实。
- 标题 ≤20 码点、正文 ≤1000 码点、封面大字每条 ≤20 码点；不满足就带错误反馈重试一次，仍失败抛错。
- 封面大字一次给 3 条候选，去重；客户端用 radio 选择。

### 边界

- 未勾选字段 100% 不合并；提案弹窗展示 before/after，避免模型顺手改全文。
- 任务跑的过程中用户继续编辑：采用时检测 `before` 不匹配，先确认再强制采用。
- 提案未采用不写入草稿；刷新页面提案仍在（`publish.json` 落盘）。
- V1 只做小红书；X 的按意见修改留到后续。
