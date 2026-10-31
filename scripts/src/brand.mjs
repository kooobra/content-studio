// Loads the brand pack: one folder with brand.config.json plus the brand's docs, art and specs.
// The engine reads every brand-specific value (name, colours, font, logo, characters, CTA words,
// forbidden phrases, voice, capture URL) from here, so the same engine renders any brand.
//
// Where the pack is found, first match wins:
//   1. CONTENT_BRAND = a brand folder or its brand.config.json
//   2. the current directory or its nearest parent that holds brand.config.json itself or content-brand/brand.config.json
//   3. the same search starting from the engine folder (a pack next to the skill)
// The chosen pack is printed once (stderr) so a wrong brand is never used silently.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CONFIG = "brand.config.json";

function locate() {
  const env = process.env.CONTENT_BRAND;
  if (env) {
    const p = path.resolve(env);
    const f = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, CONFIG) : p;
    if (!fs.existsSync(f)) throw new Error(`CONTENT_BRAND points to ${p}, but there is no ${CONFIG} there`);
    return f;
  }
  for (const start of [process.cwd(), ENGINE]) {
    for (let d = path.resolve(start); ; d = path.dirname(d)) {
      for (const f of [path.join(d, CONFIG), path.join(d, "content-brand", CONFIG)]) if (fs.existsSync(f)) return f;
      if (d === path.dirname(d)) break;
    }
  }
  throw new Error(`No brand pack found. Create content-brand/${CONFIG} in the project (see the brand-pack template), or set CONTENT_BRAND.`);
}

const hexRgb = (h) => {
  const x = h.replace("#", "");
  const n = x.length === 3 ? x.split("").map((c) => c + c).join("") : x;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)).join(",");
};

export const BRAND_FILE = locate();
export const BRAND_DIR = path.dirname(BRAND_FILE);
const raw = JSON.parse(fs.readFileSync(BRAND_FILE, "utf8"));

// absolute path / file:// URL of something inside the pack (paths in the config are relative to it)
export const bpath = (p) => (p ? path.resolve(BRAND_DIR, p) : null);
export const burl = (p) => (p ? `file://${bpath(p)}` : "");

const need = (k) => { if (raw[k] == null) throw new Error(`${BRAND_FILE}: "${k}" is required`); return raw[k]; };

// colours: primary/accent/ink are required, the rest fall back to them
const c0 = need("colors");
for (const k of ["primary", "accent", "ink"]) if (!c0[k]) throw new Error(`${BRAND_FILE}: colors.${k} is required`);
const colors = {
  primaryDeep: c0.primary, violet: c0.accent, onAccent: c0.ink, ctaMid: c0.primaryDeep || c0.primary,
  megaMid: c0.violet || c0.accent, megaEnd: c0.primary, gradMid: c0.violet || c0.accent,
  duoMid: c0.ink, duoLow: c0.ink, ...c0,
};
const rgb = Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, hexRgb(v)]));

const chars = raw.characters || { list: {} };
const characters = Object.fromEntries(Object.entries(chars.list || {}).map(([k, c]) =>
  [k, { name: c.name, tag: c.tag ?? "", cut: burl(c.cut), av: burl(c.avatar) }]));

const app = raw.app || null;

export const brand = {
  file: BRAND_FILE, dir: BRAND_DIR, raw,
  id: raw.id || path.basename(BRAND_DIR),
  name: need("name"), nameLatin: raw.nameLatin || "", url: raw.url || "", site: raw.site || (raw.url ? `https://${raw.url}` : ""),
  lang: raw.lang || "ar", dir_: raw.dir || "rtl",
  logo: burl(need("logo")),
  colors, rgb,
  font: raw.font,
  assets: { photos: bpath(raw.assets?.photos || "assets/photos"), ui: bpath(raw.assets?.ui || "assets/ui"),
            cut: bpath(raw.assets?.cut || "assets/cut"), credits: bpath(raw.assets?.credits || "assets/credits.txt") },
  characters, cast: chars.cast || Object.keys(characters), defaultCharacter: chars.default || Object.keys(characters)[0] || null,
  voiceNoteTag: chars.voiceNoteTag || "",
  cta: { mega: raw.cta?.mega || "", button: raw.cta?.button || "" },
  labels: { surveyTag: "", foodSurveyTag: "", swipe: "", pollReply: "", ...(raw.labels || {}) },
  app: app && { ...app, figure: app.figure ? burl(app.figure) : null, shots: app.shots || {}, splitLabels: app.splitLabels || {},
                coachAudio: app.coachAudio ? bpath(app.coachAudio) : null },
  truth: { forbidden: raw.truth?.forbidden || [], westernDigits: raw.truth?.westernDigits !== false, doc: bpath(raw.truth?.doc || "truth.md") },
  voice: { ...(raw.voice || {}), file: bpath(raw.voice?.file || "voice/voice.json"),
           narrator: { name: raw.voice?.narrator?.name || raw.name, tag: raw.voice?.narrator?.tag || "", av: burl(raw.voice?.narrator?.avatar || raw.logo) } },
  capture: { url: raw.capture?.url || raw.site || "", locale: raw.capture?.locale || "ar-SA", dismiss: raw.capture?.dismiss || [] },
  specs: bpath(raw.specs || "specs"),
};

if (!process.env.CONTENT_BRAND_QUIET) console.error(`brand: ${brand.name} (${BRAND_FILE})`);

// A scene that shows this app's own UI calls this, so a brand without it gets a clear message instead of a broken frame.
export function requireApp(what, scene) {
  const v = what.split(".").reduce((o, k) => o?.[k], brand.app);
  if (!v) throw new Error(`layout «${scene}» needs app.${what} in ${BRAND_FILE}; this brand does not define it, so use another layout`);
  return v;
}
