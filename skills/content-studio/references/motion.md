# Motion: what the engine can do, and what «auto» picks

Every video spec gets three settings, from the spec itself or from the brand's `brand.config.json → defaults`:

| Setting | Values |
|---|---|
| `motion` | `classic` (the accepted Oct 2026 curves) · `spring` (springs on entrances and captions) · `auto` (springs on entrances, calm captions) |
| `transition` | one of the ten below for every cut, or `auto`; a scene's own `transition` always wins. `transitionDur` (spec or scene) overrides the length |
| `fx` | `none` · `auto` (all five effects wherever they apply) · a list, e.g. `["count", "glare"]` |

`look: "classic"` pins all three to the accepted look. Every spec made before Nov 2026 carries it, so old videos re-render unchanged.
Smart AI Fitness's brand pack sets `defaults` to `auto` / `auto` / `auto`, so a new spec gets the automatic choices without asking for them.

## Transitions (10)
| Name | Length | Looks like |
|---|---|---|
| `whip` | 0.22 s | the accepted whip-pan push with motion blur + colour flash |
| `fade` | 0.40 s | cross-dissolve |
| `zoom` | 0.36 s | next scene zooms down into place, outgoing pushes in; flash |
| `slide` | 0.30 s | push sideways without blur |
| `cut` | — | hard cut |
| `wipe` | 0.40 s | diagonal wipe from the reading side |
| `iris` | 0.45 s | circle opens from the centre |
| `rise` | 0.32 s | vertical swipe, like the next post in a feed |
| `blur` | 0.42 s | outgoing melts into blur, incoming sharpens |
| `glitch` | 0.24 s | RGB-split jitter cut (pattern interrupt) |

### What `transition: "auto"` picks (into each scene)
| Next scene | Transition | Why |
|---|---|---|
| `cta` | `zoom` | lands on the offer with weight |
| `ask` | `iris` | opens up to the viewer |
| an app screen (`phoneHero`, `phoneCallouts`, `phoneFeature`, `food`, `payoff`) | `rise`, or `slide` after another app screen | feels like scrolling the app |
| `checklist`, `answers` | `wipe` | a list "turns the page" |
| `statement` right after the hook | `glitch` | pattern interrupt where viewers drop off |
| `statement` after a `statement` | `blur` | one idea melting into the next |
| other `statement`, `bodyMap`, `split`, `photoQuestion` | `whip` | the brand's signature cut |
| anything else | `fade` | |
The same transition never comes twice in a row (except into the CTA); the next one from whip → blur → fade → wipe is used instead.

## Improvements (10)
| # | Name | Switch | What it does |
|---|---|---|---|
| 1 | Spring motion | `motion: spring/auto` | entrances settle with one soft overshoot instead of a fixed curve |
| 2 | Transitions | `transition` | the ten above, per scene |
| 3 | Parallel render | `WORKERS=n` | same frames, ~2.3× faster on 4 cores |
| 4 | Preview | `--preview` | half size, 15 fps, ~4× faster |
| 5 | Timeline | `--timeline` | a still per scene with its transition and voice line; rushed lines in red |
| 6 | Highlight sweep | `fx: sweep` | pink/cyan highlight blocks paint in from the reading side |
| 7 | Number count-up | `fx: count` | numbers in headlines, stickers, callouts and chips count up (years such as 2011 stay) |
| 8 | Screen glare | `fx: glare` | a light sheen passes once across every phone and UI card |
| 9 | Impact shake | `fx: impact` | slams and map pins shake their scene for a moment |
| 10 | Beat pulse | `fx: beat` | light leaks breathe on the 120 BPM beat of the music bed |
Plus JSON specs with presets (specs.md). Caption fix (always on): a caption now ends before the next one starts, so two lines never sit on top of each other at a cut.
