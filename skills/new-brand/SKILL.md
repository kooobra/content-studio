---
name: new-brand
description: >-
  Sets up a brand pack (content-brand/) for the content-studio engine in the current project: copies the empty
  template, then fills identity, colours, font, logo, truth and voice from the project's own site and code, asking the
  owner about anything that can't be confirmed. Use when the user asks to prepare content/brand setup for a new project
  (جهّز حزمة براند، براند جديد، ركّب أداة المحتوى لمشروع), or when content-studio finds no content-brand/.
argument-hint: "[site URL]"
---

# New brand pack

Goal: a `content-brand/` folder that `content-studio` can render from, where every value is **taken from the brand's
own sources or confirmed by the owner**. Never guess an identity, a colour, a claim or a voice.

Scripts: `${CLAUDE_PLUGIN_ROOT}/scripts/src`. Site URL argument (if given): $ARGUMENTS

## Steps
1. **Don't overwrite.** If `content-brand/brand.config.json` exists, stop and show its state with
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/src/check-brand.mjs"` instead.
2. **Collect from the project (read only, never edit the product):**
   - name (Arabic and Latin), domain/URL: site `<title>`, `package.json`, app manifest, README.
   - colours: CSS variables, Tailwind config, theme files, `manifest.json` `theme_color`. Note the file each value came from.
   - font: CSS `@font-face` / font imports. Keep Tajawal (bundled, OFL) only if the brand has no Arabic font of its own; a brand font must have a licence that allows use in marketing.
   - logo: the highest-resolution square logo in the repo (`public/`, `assets/`), PNG or SVG.
   - product truth: what the product does, prices, limits, free tier, from code and the pricing/terms pages. Record the source of each claim.
   - characters/mascots, app screens: only if the product really has them.
3. **Create the pack:**
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/src/new-brand.mjs" content-brand --name "<name>" --url <domain> --primary <#hex> --accent <#hex> --ink <#hex>`
   Then copy the logo to `content-brand/assets/` and set `logo`; set `font` if the brand has its own.
4. **Write the docs** in the pack from what you found: `truth.md` (allowed claims with sources, forbidden list), `brand.md` (identity with sources), `voice.md`, `rules.md`, `publishing.md`. Put every forbidden phrase in `brand.config.json → truth.forbidden` too.
5. **Ask the owner before guessing** (one short list, in their language): anything missing or unclear in identity (secondary colours, logo variant, font), the narrator's voice (gender, age, dialect, tone), the call to action words (`cta.mega`, `cta.button`), claims you couldn't confirm, platforms, and any content rules. Fill the answers in.
6. **Assets:** a few on-brand photos with `bash "${CLAUDE_PLUGIN_ROOT}/scripts/src/fetch_photo.sh" "<pexels/unsplash URL>" name.jpg "note"` (run from the project; they land in the pack with credits), and real UI screens with `capture.mjs` if the product has a public UI.
7. **Check:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/src/check-brand.mjs"` until it shows no ERROR, then render the starter `content-brand/specs/examples/hello.carousel.json` with `carousel.mjs` and look at it with the owner.
8. **Commit** the pack only if the owner asks. Never publish anything.
