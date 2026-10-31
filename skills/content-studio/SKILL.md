---
name: content-studio
description: >-
  Brand content engine. Renders on-brand social carousels (feed 1080x1350 + story 1080x1920), stories and 9:16
  Reels/TikTok/Shorts videos with a designed Gemini TTS narrator, karaoke captions, automatic motion and transitions,
  an original music bed and a truth gate, all from a small spec file and the project's brand pack
  (content-brand/brand.config.json). Use it whenever the user asks for marketing or social content for the project
  (بوست، كاروسيل، ستوري، ريلز، تيك توك، فيديو إعلاني، سكربت، تعليق صوتي، محتوى الشهر), wants to change a video's
  voice, script or motion, needs sizes or safe zones, or wants a batch for a content calendar. If the project has no
  content-brand/ yet, use the new-brand skill first.
---

# Content studio (engine)

The engine is brand-free. Everything that makes the output look and sound like a brand lives in the project's
**brand pack**, `content-brand/` at the project root, read through one file: `content-brand/brand.config.json`.

Engine folder (this plugin): `${CLAUDE_PLUGIN_ROOT}`. Scripts: `${CLAUDE_PLUGIN_ROOT}/scripts/src`.
Dependencies folder (kept across updates): `${CLAUDE_PLUGIN_DATA}`.

## Before anything
1. **Find the brand pack.** `content-brand/brand.config.json` in the project (or `CONTENT_BRAND=<folder>`). No pack → run the `new-brand` skill first; never invent a brand.
2. **Read the brand's own docs,** listed in `brand.config.json → docs`: `rules` (the owner's ground rules, they override this file), `truth` (what may be claimed: always, before any copy), `brand` (visual identity, safe zones), `voice` (narrator), `publishing`. Look at `examples/` for the accepted quality bar.
3. **Setup once per session:**
   ```bash
   bash "${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh" "${CLAUDE_PLUGIN_DATA}"
   export CONTENT_STUDIO_DEPS="${CLAUDE_PLUGIN_DATA}" CONTENT_OUT=<a folder outside the repo, e.g. the session scratchpad>
   S="${CLAUDE_PLUGIN_ROOT}/scripts/src"
   ```
   In the Claude cloud box Chromium is already at `/opt/pw-browsers`; never run `playwright install`. Elsewhere set `CHROME_PATH`.

## Engine rules (for every brand)
- **Truth gate.** Every claim must match the brand's `truth.md`. The build blocks `truth.forbidden` phrases and (if `truth.westernDigits`) Arabic-Indic digits, but it can't catch a new false claim. You can: list each claim and tick it against truth.md before writing the spec.
- **Real visuals in every frame**: graded photo, character cut-out, real UI screen. Never fake a screen; capture it from the brand's site.
- **One voice per brand**: reuse the designed narrator in the pack's `voice/voice.json`. `text` = words only, `style` = delivery direction in English.
- **Keys stay secret**: read `GEMINI_API_KEY` from the environment; never print it, write it to a file, or commit it.
- **Don't edit the product's code** to fit marketing. The engine only reads the brand pack.
- **Never publish or schedule** unless the owner explicitly asks for that item.

## Workflow
1. **Brief:** topic, audience, formats (carousel / video / both), and whether the video ends with a CTA (`cta` scene, words from `brand.config.json → cta`) or a question (`ask`).
2. **Truth check:** as above. Look up anything new in the product (code, pricing page) and copy UI wording verbatim.
3. **Spec:** write `content-brand/specs/<campaign>/<id>.video.json` / `.carousel.json` (or `.mjs`). Fields and layouts: `references/specs.md`. Reusable pieces: `brand.config.json → presets` (`{"preset": "cta"}`, `"vo": {"preset": "narrator"}`, `"style": "@hook"`). Layouts that need the brand's app (`bodyMap`, `split`, `food`, …) work only when the config has the `app` block.
4. **Voice:** one line per scene, ≈2.4 words/s of its window. `node $S/voiceover.mjs <spec> --dry`, then without `--dry` (needs `GEMINI_API_KEY`). Fix single lines with `--only=N`.
5. **Render:**
   - carousel: `node $S/carousel.mjs <spec>` (≈20 s)
   - video check: `node $S/video.mjs <spec> --timeline` (a still per scene + its voice line, rushed lines in red), `--snap 1,5,9`, `--preview`
   - final: `WORKERS=<cores> node $S/video.mjs <spec>` (run in the background)
   Motion: new specs follow the brand's `defaults` (normally `auto`: the engine picks the transition per scene and adds effects where they fit). `look: "classic"` pins the accepted classic look. Details and the auto rules: `references/motion.md`.
6. **Review like the owner:** `"$(node $S/python.mjs)" -I $S/review.py $CONTENT_OUT/<id>` and look at the sheets. Check the caption band (y 1310–1530), text over faces, cut-off Arabic, the highlight word, fine print, claims vs truth. Fix and re-render only the affected frames with `FRAMES=a-b`.
7. **Deliver** the mp4/PNGs and the post copy, in the language and tone the brand's rules ask for.

## Batch
One id per line in `plan.txt`, specs in one folder: `SPEC_DIR=content-brand/specs/<campaign> bash $S/batch.sh plan.txt 2`.

## New assets
- Photo (Pexels/Unsplash only, credited): `bash $S/fetch_photo.sh "<image URL>" name.jpg "what/where"` → the pack's `assets/photos/` + credits.
- UI screen: `node $S/capture.mjs <url> content-brand/assets/ui/name.png "<selector>"`, or `node $S/cap_landing.mjs <outDir>` for the shots listed in `brand.config.json → capture.shots`. Behind the cloud proxy set `NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`; never disable TLS checks.

## Files
| Path | What |
|---|---|
| `references/specs.md` | every layout and its fields, JSON specs, commands |
| `references/motion.md` | motion, the 10 transitions, the 10 improvements, what `auto` picks |
| `${CLAUDE_PLUGIN_ROOT}/templates/brand-pack/` | the empty brand pack the `new-brand` skill copies |
