# Story Desk · DSH Plugin

[中文](README.md) | **English**

Turn a topic, a slice of history, or a book into a vertical storytelling video: script → character references → voice → images → final cut, all inside one panel.

It is a plugin for [DeepSeek Harness](https://github.com/deepseek-ai) (DSH). No editing software involved — it outputs a 1080×1920 `.mp4` plus an `.srt` subtitle file.

---

## What it does

The usual workflow is "write a script → hunt for footage → record voiceover → edit", hopping between five or six tools per video. This plugin collapses the whole chain into one panel, and **lets you stop and fix any step**:

- Script doesn't sound right? Edit the text inline, then move on.
- Need characters to look consistent? Lock a reference portrait first; every later shot follows it.
- Unsure about the voice? Nine voices, click and listen, then decide.
- Bad image? Regenerate that one shot instead of the whole batch.

**Output**: a vertical mp4 (1080×1920, optionally with burned-in subtitles) and a matching `.srt`.

---

## Requirements

| Dependency | Notes |
|---|---|
| **DSH** | DeepSeek Harness itself; the plugin renders inside its panel |
| **ffmpeg** | Required for rendering (`ffmpeg` and `ffprobe` on PATH) |
| **Writing model** | Uses models already configured in DSH — no extra key |
| **Speech synthesis** | Xiaomi MiMo TTS (audio returned via `chat/completions`); without it you can pick a voice but not dub |
| **Image generation** | Any OpenAI-compatible `/v1/images/generations`, or a local service; MiniMax `image-01` uses its own native endpoint |

Any OpenAI-compatible image endpoint works: Alibaba MaaS, MiniMax, OpenAI, or self-hosted. Presets for these ship with the plugin.

MiniMax ships two lanes, routed automatically by model name: `image-01` / `image-01-live` use the native `POST /v1/image_generation` (flat ¥0.025 per image, slower), while the `MiniMax-H3-Image` family uses the OpenAI-compatible entry (token-billed, ~¥0.25 per 1024×1792 image but only a few seconds). Both appear in the provider dropdown.

---

## Installation

### 1. Get the code

```bash
git clone git@github.com:huihui308/dsh-story-desk.git
cd dsh-story-desk
```

### 2. Install into the profile

DSH loads plugins from the profile's `node_modules`. Use `dsh plugin` to install the local directory (it links rather than copies, so code changes take effect immediately):

```bash
# <profile> is your actual profile name (default: web)
dsh plugin --profile web add /absolute/path/to/dsh-story-desk
```

Or symlink it manually:

```bash
ln -s "$(pwd)" ~/.dsh/profiles/web/node_modules/dsh-story-desk
```

### 3. Enable it

Restart `dsh web`, open **Plugins**, find **dsh-story-desk** and flip the switch.

"Story Desk" appears in the sidebar when it's working. If not, refresh the page.

### 4. Configure channels once

Click the gear icon → tabs **Image** and **Voice** — fill in endpoint and key for each:

Settings has three tabs: **Image** / **Voice** / **General**.

- Pick a provider from the dropdown (Alibaba MaaS / MiniMax / OpenAI / Xiaomi MiMo…); endpoint and model auto-fill but stay editable.
- **General** holds the trash retention period and defaults for new projects. Motion, grading, transitions and intro are chosen per project on the Final cut tab.
- Voice requires a key, otherwise dubbing is unavailable.
- For a local image service (no key), enter the endpoint up to `/v1`.

---

## Managing projects

The left list holds every project; hover a row and a small × appears on its right:

- Click it → confirm → the project moves to **Trash** (not deleted outright; script, images and render are kept)
- The Trash entry sits at the bottom of the list with a count badge; from there you can **restore**, **delete permanently**, or **empty it**
- Retention defaults to **7 days**, configurable under Settings → General (1–365). Expired entries are removed together with their project folder

Once a task is running, a **Stop** button appears next to the progress bar. It kills the ffmpeg child process directly, so it stops within a second instead of finishing the current step; you can start a new run immediately after.

## Quick start

Six tabs, walk them top to bottom. Each tab shows its state (`✓` done / `●` current).

### ① Idea

Enter a **topic** (e.g. "The Xuanwu Gate Incident", "An Lushan Rebellion", "1587, A Year of No Significance"), set **target duration** and **seconds per segment**, then click **Generate script**.

- Paste source material into "Raw material" — the script follows it without copying sentences.
- Paste links to reference videos into "Reference videos" — the writer learns their angle and pacing.
- Pick which model writes the script here (defaults to DSH's current model).

> A 3-segment script takes roughly 1–3 minutes depending on the model. Reasoning-heavy models think for a long time first; the UI shows "model is reasoning (N chars)".

### ② Script

Segments with narration and a visual description. **Edit inline — saves on blur.** Confirm the script before moving on.

Changing text invalidates that segment's audio and image.

### ③ Reference images (optional but recommended)

Click **Extract characters and scenes**. The model picks out characters and key locations that **actually recur**, with image-ready descriptions.

- Draw them one at a time; unhappy with one? Type "too young", "armor too bright" and hit **Redraw with this note** — the change accumulates.
- Happy? Hit **Approve**. The approved description is appended to every following shot.

> Note: consistency is currently at the **text level** — the image model receives the description, not the reference image. True image-level consistency needs an img2img-capable channel.

### ④ Voice

Nine voices, ranked (narrator-suitable male voices first). **Click any row to synthesize a ~15-second sample on the spot and play it**, which also selects that voice.

This tab only picks the voice — bulk dubbing happens in the final step.

### ⑤ Storyboard

Choose **visual style** (cinematic / gongbi / comic / ink / dark mystery) and **aspect ratio**, then **Generate images**.

- **Preview 5 styles** renders the same line in all five styles so you can pick before batch generation.
- Regenerate any single shot. Click an image for a zoomable viewer.

### ⑥ Final cut

Click **Dub and render**: missing audio is filled in first, then shots are rendered, concatenated, and subtitled — all in one pass.

**Effects** (applied at render time):

| Option | Choices | Notes |
|---|---|---|
| Motion | slow push-in / slow pull-out / static | zoompan-based; upscales 2× first to avoid jitter |
| Grade | none / warm / cool / film | ffmpeg colorbalance + eq; film adds a vignette |
| Transition | cut / fade / through black / dissolve / wipe left / circle open | xfade + acrossfade; requires re-encoding |
| Intro | none / title card | HyperFrames renders an HTML title card (3 s) with the project title |
| Parallel render | auto / 1 / 2 / 4 / 8 workers | Renders several shots at once. Auto mode derives from the logical core count (one worker per 4 cores, clamped to 1–8) |

**Rendering prefers a hardware encoder** — Apple VideoToolbox, NVIDIA NVENC, Intel QSV, AMD AMF — and falls back to CPU when none is usable. The active encoder is shown at the bottom of this tab.

Measured on the same 10-second clip: CPU 35.4 s → NVENC 3.97 s; a 2-minute video went from 640 s to about 100 s.

Force CPU with `STORY_DESK_ENCODER=cpu`.

Preview the result in place, or **Export** to a chosen folder (defaults to `~/Downloads`), named after the project title.

---

## Where data lives

```
$DSH_HOME/story-desk/
├── state.json              projects, scripts, settings
├── secrets.json            channel keys (0600)
└── projects/<id>/
    ├── audio/              per-segment narration mp3
    ├── anchors/            reference image candidates and finals
    ├── images/             per-segment visuals
    ├── renders/            final mp4 / srt / ass
    ├── samples/            voice audition samples
    └── work/               render intermediates
```

`$DSH_HOME` defaults to `~/.dsh`. Scripts live in `state.json` under `items[].segments[]` — there is no separate script file.

---

## Troubleshooting

**"Model returned no body text, truncated by length limit"**
The model spent its whole token budget reasoning. Switch to a direct model such as DeepSeek-V4-Pro (~3 min). Long-reasoning models like glm-5.3 or mimo-flash are a poor fit for script writing.

**Image generation returns 503 / ComfyUI unreachable**
Your local image model isn't running. Start Qwen-Image from the Gen Studio console, or switch to a hosted provider in Settings.

**No audio / key error when dubbing**
Fill in the key under Settings → Voice. Keys are stored in `secrets.json`, never committed.

**Script generation feels stuck**
Read the progress text: "model is reasoning (N chars)" means it's thinking — if the count climbs, it's alive. Hard timeout is 20 minutes.

---

## Development

```
index.js           entry, re-exports host
client.js          panel UI (hand-written single-file bundle, uses DSH-injected react)
src/host.js        routes, task orchestration
src/script.js      writing prompt and parsing
src/tts.js         voice list and speech synthesis
src/images.js      image channels and error translation
src/render.js      ffmpeg pipeline (Ken Burns, concat, subtitles)
src/store.js       persistence, default settings
src/jobs.js        background tasks, progress, timeouts
src/llm.js         model calls, streaming progress, empty-output fallback
docs/DETAIL.md     implementation notes
```

After editing, reload the plugin: in **Plugins**, toggle **dsh-story-desk** off and on, then refresh the page.

No build step — source is deployment. Note that `dsh plugin --profile web <pnpm args>` only installs packages; there is no separate enable/disable subcommand.

---

## License

Private repository. Do not redistribute without permission.
