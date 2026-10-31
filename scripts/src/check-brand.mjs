// Usage: node check-brand.mjs   (from the project, or CONTENT_BRAND=<folder>)
// Checks the brand pack: required values, files that must exist, leftover TODOs, and what optional parts are set.
// Exit code 1 when something required is missing.
import fs from "node:fs";
import path from "node:path";
import { brand, bpath } from "./brand.mjs";

const errs = [], warns = [], ok = [];
const raw = brand.raw;
const exists = (p) => p && fs.existsSync(p);
const file = (u) => u?.replace(/^file:\/\//, "");
const todo = JSON.stringify(raw).match(/TODO[^"]{0,40}/g) || [];
if (todo.length) warns.push(`brand.config.json still has ${todo.length} TODO(s): ${[...new Set(todo)].slice(0, 6).join(" | ")}`);
if (!exists(file(brand.logo))) errs.push(`logo not found: ${raw.logo}`);
for (const w of brand.font.weights) for (const x of brand.font.files) { const p = bpath(x.src.replace("{w}", w)); if (!exists(p)) errs.push(`font file missing: ${x.src.replace("{w}", w)}`); }
for (const [k, d] of Object.entries(brand.assets)) if (k !== "credits" && !exists(d)) errs.push(`assets folder missing: ${k} (${d})`);
const nPhotos = exists(brand.assets.photos) ? fs.readdirSync(brand.assets.photos).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).length : 0;
(nPhotos ? ok : warns).push(`${nPhotos} photo(s) in assets/photos`);
for (const [k, c] of Object.entries(brand.characters)) {
  if (k === "narrator") continue;
  if (!exists(file(c.cut))) errs.push(`character ${k}: cut-out missing`);
  if (!exists(file(c.av))) errs.push(`character ${k}: avatar missing`);
}
ok.push(`${Object.keys(brand.characters).length} character(s)` + (brand.defaultCharacter ? `, default ${brand.defaultCharacter}` : ""));
ok.push(brand.app ? "app scenes available (app block set)" : "no app block: app-only layouts (bodyMap, split, food, phoneCallouts, payoff) are off");
for (const [k, p] of Object.entries(raw.docs || {})) { const f = bpath(p); if (!exists(f)) warns.push(`doc missing: ${k} (${p})`); else if (fs.statSync(f).isFile() && /TODO/.test(fs.readFileSync(f, "utf8").slice(0, 20000))) warns.push(`${p} still has TODOs`); }
if (!brand.truth.forbidden.length) warns.push("truth.forbidden is empty");
(exists(brand.voice.file) ? ok : warns).push(exists(brand.voice.file) ? "narrator voice designed (voice/voice.json)" : "no narrator voice yet: the first voiceover run designs it");
const nSpecs = exists(brand.specs) ? fs.readdirSync(brand.specs, { recursive: true }).filter(f => /\.(video|carousel)\.(json|mjs)$/.test(f)).length : 0;
ok.push(`${nSpecs} spec(s) in specs/`);
console.log(`brand pack: ${brand.name} (${brand.dir})`);
for (const m of ok) console.log("  ok    " + m);
for (const m of warns) console.log("  todo  " + m);
for (const m of errs) console.log("  ERROR " + m);
process.exit(errs.length ? 1 : 0);
