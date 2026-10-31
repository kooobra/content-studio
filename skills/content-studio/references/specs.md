# Spec files, layouts and the batch

Every post is a small spec file. The layouts, brand, CTA truth block, music and captions are fixed, so a new item means editing text, photo names, UI names and voice lines only. **Start by copying the brand's example specs** (for Smart AI Fitness: `content-brand/specs/tailoring.carousel.mjs` and `tailoring.video.mjs`). They're the accepted reference and show every field in use.

Specs belong to the brand, so they live in the brand pack (`content-brand/specs/<campaign>/<id>.*.mjs`), never in the engine. The engine folder holds only code.

**Brand-dependent layouts.** Layouts that show one app's own screens need the brand's optional `app` block in `brand.config.json`: `coachBody`/`bodyMap` (`app.figure`), `split` (`app.splitLabels` + `app.shots.swap`), `food` (`app.shots.meals`), `phoneCallouts`/`payoff` (`app.shots.*`). A brand without them gets a clear error and uses the generic layouts instead (`statement`, `checklist`, `phoneHero`, `rows`, `phoneFeature`, `poll`, `ask`, `cta`). Words that belong to the brand (CTA «مجاناً»/button, survey tags, swipe hint, URL, characters) also come from the config; a spec can override the CTA words with `mega` and `button`.

## Carousel spec
```js
export default { id: "home-vs-gym", slides: [ { layout: "cover", ... }, ... ] }   // 6 slides is the sweet spot
```
One spec renders **both** 1080×1350 (feed) and 1080×1920 (story), each laid out separately.

| layout | Purpose | Fields |
|---|---|---|
| `cover` | slide 1: hook + up to 3 characters from `characters.cast` | `bg`, `bgPos`, `kick`, `h` (HTML, one `.hl` word), `coachesLine`, `topics[]` (4 short topics listed on the cover) |
| `photoHero` | full-bleed photo + 2 survey cards | `photo`, `pos`, `num`, `card1`, `card2` (`{q, opts:[[text, selected?]]}`), `kick`, `h`, `sub`, `quote` (verbatim Sarah line) |
| `split` | diagonal A «ولا» B | `right`, `rightPos`, `left`, `leftPos`, `num`, `card`, `kick`, `h`, `sub`, `quote` |
| `coachBody` | coach cameo + body map with injury pins (needs `app.figure`) | `bg`, `coach` (a character key), `num`, `inj[]` (survey option names), `kick`, `h`, `card`, `sub`, `disclaimer` («معلومات عامة، مو بديل عن الطبيب», required whenever injuries appear) |
| `food` | food photo + polaroid + phone callout + cuisines | `photo`, `pos`, `num`, `polaroid`, `polaroidCap`, `callout:[title, sub]`, `kick`, `h`, `cuisineQ`, `cuisines:[[name, "on"|"cy"]]`, `whatsapp` (HTML), `quote` |
| `cta` | last slide | `bg`, `kick`, `h`, `chips:[[icon, text]]`, `coachesNote:[line1, line2]`, `fine`, `mega?`, `button?`, `coach?`, `shot?` |
| `phoneFeature` | one feature proven by a real screen | `bg`, `grade?`, `num`, `kick`, `h`, `sub`, `shot` (name in the brand's `assets/ui`), `callouts:[{anc:[fx,fy], title, sub?, col}]`, `note?:{icon, tx}` |
| `rows` | value slide for educational carousels (tips, foods, numbers) as a glass list | `bg`, `grade?`, `pos?`, `num?`, `kick`, `h`, `sub?`, `rows:[[icon, text, tag, tone p|c|w]]`, `top?`, `note?:{icon, tx}` (put the source or «معلومات عامة» here) |
| `poll` | story poll/quiz/question with the options printed (posting is automated, so **no in-app stickers**) | `bg`, `grade?`, `kind` («استطلاع» / «اختبار» / «سؤال» / «الجواب»), `h`, `sub?`, `opts:[[text, on?]]` (`on` = the highlighted answer; `[]` for an open question), `cta?:{icon, tx}` (default «جاوب بالخاص»). Without `opts` it falls back to the old dashed sticker box, which is retired. Set `folio: false` on story-only specs to drop the «01 / 10» counter. Example: `campaign-2026-10-weeks1-2/stories_v2.carousel.mjs`. |

Rotate the **lead layout** week to week so the feed never looks templated. The first slide is always a hook, the last always `cta`.

## Video spec
```js
export default {
  id: "tailoring", total: 27.2, coach: "sarah",
  vo: { model, voice, style, lines: [{ at, text, style? }] },   // own narrator, see voice.md
  clips: [ { key, at, trim?, shown? } ],                          // fallback: app coach clips (verbatim manifest keys)
  scenes: [ { layout, t0, t1, ...fields } ],
}
```
- Scene times sit on the 0.5 s grid (120 BPM). 8–9 scenes in 25–30 s, no single shot over about 4 s.
- `vo.lines[k].at` ≈ `scenes[k].t0 + 0.15`.

| layout | Fields |
|---|---|
| `hook` | `bg`, `kick`, `h`, `pops[]` (2–4 floating question stickers), `coach?`. Shows the default character's cut-out, so frame 0 is composed. |
| `photoQuestion` | `photo`, `pos`, `num`, `h:[w1,w2,w3]` (word-by-word), `card:{q, opts:[[text, sel?, tapAt?]]}` (`tapAt` = seconds after t0 when it turns pink) |
| `phoneCallouts` | `bg`, `h[]`, `card`, `callouts:[{anc:[fx,fy], title, sub, col:"c"|"p"}]`. The phone shows real UI, and `anc` points at the feature on it. |
| `split` | `right`, `left`, `num`, `h`, `card` |
| `answers` | `bg`, `h`, `answers[]` (the chosen options stacking up into «إجاباتك.. خطتك») |
| `bodyMap` | `bg`, `num`, `h`, `inj[]`, `card`, `sub`, `disclaimer` |
| `food` | `photo`, `polaroid`, `polaroidCap`, `num`, `h`, `callout`, `cuisines:[[name, tapAt|"cy"]]`, `whatsapp` |
| `payoff` | `bg`, `h`, `stickers:[workout, food]` over the two real phones. Optional `time` + `timeIcon` chip, but keep it out of the caption band; it's normally left out. |
| `cta` | `bg`, `kick`, `h`, `chips`, `coachesNote`, `fine`, `mega?`, `button?`, `coach?`, `shot?` (pulsing button, floating phone when the brand has `app.shots.default`) |
| `statement` | one big idea over a photo: `bg`, `grade?`, `pos?`, `kick?`, `h`, `fs?`, `coach?`, `coachX?`, `stickers?:[{tx, icon?, col:p|c|w|k, x, y, rot, fs?}]` |
| `phoneHero` | a real screen as the hero: `bg`, `num?`, `label?`, `h`, `fs?`, `shot`, `w?` (390), `y?` (540), `callouts:[{anc, title, sub?, col}]`, `chip?:{icon, tx}` |
| `checklist` | rows that tick in one by one: `bg`, `kick?`, `h`, `rows:[[icon, text, tag, tone p|c|w]]`, `top?`, `rowFs?` |
| `ask` | closing scene for non-CTA videos: `bg`, `coach?`, `h`, `fs?`, `prompt:{icon, tx}` («اكتبه بالتعليقات» / «احفظ الفيديو») |

All existing scenes also take `label` (the kicker text next to the number) and `coach` where a coach appears; `phoneCallouts` takes `shot` and an optional `card`; `payoff` takes `phones:[shot, shot]` and `stickerIcons`.

### Brand finish and fonts (brand.config.json)
- `finish`: `neon` (default: gradients, glows, light leaks) or `flat` (solid brand colours only, for brands that forbid gradients).
- `colors.onPrimary`: text/icon colour on primary blocks (highlights, stickers, CTA button, karaoke word); default `#fff`.
- `font.heading`: a second family for headlines (`.h`, `.mega`); body text keeps `font.family`.
- UI screens can be `.png`, `.jpg` or `.webp`: give the file name with its extension in `shot`.

### Motion
`motion`, `transition` (spec or scene), `transitionDur` and `fx` are described in **references/motion.md** (10 transitions, 10 improvements, and what `auto` picks). New specs get the brand's `defaults` (auto for Smart AI Fitness); `look: "classic"` keeps the accepted Oct 2026 look.

### JSON specs (data only)
A spec can be a `.json` file instead of `.mjs`: same fields, no code. Extras:
- `"$include": ["_common.json"]` merges shared fields first (`vo` merges one level deep).
- `{"preset": "cta", "t0": 23, "t1": 27}` starts a scene/slide from `brand.config.json → presets.cta`; `"vo": {"preset": "narrator", "lines": [...]}` takes the brand narrator.
- `"style": "@hook"` on a voice line = `presets.styles.hook`.
All scripts (`carousel`, `voiceover`, `video`, `batch`) take `.json` or `.mjs`.

**Headline markup tip:** put punctuation and attached letters *inside* the highlight span (`<span class="hl">مطبخك؟</span>`, `<span class="hl">وتحتار</span>`). Otherwise «؟» floats off the pink block.

**Shared spec module:** a campaign folder can hold a `_common.mjs` (narrator `VOICE`, delivery styles `HOOK`/`CLOSE`/`ASK`, and a `CTA(t0, t1)` scene builder) that every spec imports. See the first two-weeks batch for the pattern.

## Commands (run from the project root; outputs go to `$CONTENT_OUT`, default `./marketing-out`)
The brand pack is found automatically (`content-brand/brand.config.json` in the current folder or a parent), or set `CONTENT_BRAND=<folder>`.
```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh" "${CLAUDE_PLUGIN_DATA}"   # once per session; then export CONTENT_STUDIO_DEPS="${CLAUDE_PLUGIN_DATA}"
S="${CLAUDE_PLUGIN_ROOT}/scripts/src"
export CONTENT_OUT=/path/outside/the/repo                            # e.g. the session scratchpad

node $S/carousel.mjs content-brand/specs/<id>.carousel.mjs           # ~20 s -> $CONTENT_OUT/<id>/carousel/{feed,story}/NN.png
node $S/carousel.mjs specs/<id>.carousel.mjs "" 0,5                  # only slides 1 and 6 (default out dir)
node $S/voiceover.mjs specs/<id>.video.mjs --dry                     # check the line windows first
node $S/voiceover.mjs specs/<id>.video.mjs                           # generate the narration (GEMINI_API_KEY)
node $S/video.mjs specs/<id>.video.mjs --snap 0,5,12,21,25           # quick stills into <out>/build/snap_*.jpg (seconds)
node $S/video.mjs specs/<id>.video.mjs                               # full render
WORKERS=4 node $S/video.mjs specs/<id>.video.mjs                     # same frames, rendered in 4 browser pages at once (use the core count)
node $S/video.mjs specs/<id>.video.mjs --preview                     # half size, 15 fps -> video/preview.mp4 in about a quarter of the time
node $S/video.mjs specs/<id>.video.mjs --timeline                    # review/timeline.png: a still per scene + its voice line, rushed lines in red
FRAMES=585-690 node $S/video.mjs specs/<id>.video.mjs                # re-render only those frames (30 fps) after a small fix, then re-mux
node $S/video.mjs specs/<id>.video.mjs "" --mix-only [--music x.wav] # new audio on the existing frames
"$(node $S/python.mjs)" -I $S/review.py $CONTENT_OUT/<id>   # contact sheets in <id>/review/
SPEC_DIR=content-brand/specs/<campaign> $S/batch.sh plan.txt 2       # a whole month: one id per line, 2 in parallel
```
Rendering is deterministic: `window.renderAt(t)` positions everything for time t, and each frame is a Chromium screenshot. Changing a spec field and re-running always gives the same result.

## New assets
- Photo: `$S/fetch_photo.sh "<pexels/unsplash image URL>" name.jpg "what/where"` → the brand pack's `assets/photos/name.jpg` + a line in its credits file.
- UI: `node $S/capture.mjs <site URL> content-brand/assets/ui/name.png "<selector>"`. For the site's animated feature demos use `node $S/cap_landing.mjs <outDir>` (what it captures is listed in `brand.config.json` → `capture.shots`), then crop the 18 px phone border off (`crop=iw-36:ih-36:18:18`). Set `NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` behind the cloud proxy. Never disable TLS checks.
- Smart AI Fitness screens in `content-brand/assets/ui`: workouts, meals, **ui_workouts_v2** / **ui_nutrition** (protein and calories left) / **ui_water** / **ui_body** (BMI, measurements, «تحليل InBody الذكي» tab) from the landing's «هكذا يبدو من الداخل» showcase, ui_day, ui_lunch, ui_summary, ui_week, ui_swap, **ui_home** (dashboard), **ui_coach_chat** / **ui_coach_chat_short** (empty middle removed), **ui_meal_log**, **ui_machine**.
- Character cut-outs: a new pose needs `rembg` (`isnet-general-use`) on an image the brand owns.
- New photos and UI go into the brand pack's `assets/`. Commit them with their credits line.
