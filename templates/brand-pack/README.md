# Brand pack

Everything that makes the content look and sound like this brand. The content-studio engine reads it through
`brand.config.json` and nothing else. Fill every `TODO`, then check with:

```bash
node "<plugin>/scripts/src/check-brand.mjs"
```

| Path | What |
|---|---|
| `brand.config.json` | name, URL, colours, font, logo, characters, CTA words, forbidden phrases, voice, capture list, motion defaults, presets |
| `rules.md` | the owner's ground rules (they override the engine's defaults) |
| `truth.md` | what we may claim and what is forbidden |
| `brand.md` | visual identity |
| `voice.md` | narrator persona and tone |
| `publishing.md` | platforms, captions, links, times |
| `assets/` | logo, photos (+ credits), real UI screens, character cut-outs and avatars |
| `fonts/` | the brand font (Tajawal by default, OFL) |
| `voice/voice.json` | written by the first voiceover run (the designed narrator's id) |
| `specs/` | every post and video spec; `examples/` holds two starters |
