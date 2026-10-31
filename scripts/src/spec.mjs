// Loads a spec: either a JS module (default export) or a plain JSON data file.
//
// JSON specs are pure data, so they can be written by hand, by a script or by Claude without code:
//   "$include": ["_common.json"]   shallow-merge other JSON files first (relative to this file; "vo" merges one level deep)
//   { "preset": "cta", ... }        on a scene/slide or on "vo": start from brand.config.json → presets.<name>
//   "style": "@hook"                a voice style from brand.config.json → presets.styles.hook
// Anything set in the spec itself wins over the include and the preset.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { brand } from "./brand.mjs";

const presets = brand.raw.presets || {};
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

function preset(o, where) {
  if (!isObj(o) || !o.preset) return o;
  const p = presets[o.preset];
  if (!p) throw new Error(`${where}: preset «${o.preset}» is not in ${brand.file} → presets`);
  const { preset: _, ...rest } = o;
  return { ...structuredClone(p), ...rest };
}
const style = (s, where) => {
  if (typeof s !== "string" || !s.startsWith("@")) return s;
  const v = presets.styles?.[s.slice(1)];
  if (!v) throw new Error(`${where}: style «${s}» is not in ${brand.file} → presets.styles`);
  return v;
};

function readJson(file, seen = new Set()) {
  if (seen.has(file)) throw new Error("circular $include: " + file);
  seen.add(file);
  const own = JSON.parse(fs.readFileSync(file, "utf8"));
  let base = {};
  for (const inc of [].concat(own.$include || [])) {
    const part = readJson(path.resolve(path.dirname(file), inc), seen);
    base = { ...base, ...part, vo: isObj(base.vo) || isObj(part.vo) ? { ...base.vo, ...part.vo } : part.vo ?? base.vo };
  }
  const { $include, $comment, ...rest } = own;
  const out = { ...base, ...rest };
  if (isObj(base.vo) && isObj(rest.vo)) out.vo = { ...base.vo, ...rest.vo };
  return out;
}

// Motion defaults: look:"classic" pins the accepted look (old specs carry it, so they re-render unchanged);
// otherwise any of motion / transition / fx the spec leaves out comes from brand.config.json → defaults.
function withDefaults(s) {
  if (s.look === "classic") return { motion: "classic", transition: "whip", fx: "none", ...s };
  const d = brand.raw.defaults || {};
  const out = { ...s };
  for (const k of ["motion", "transition", "fx"]) if (out[k] == null && d[k] != null) out[k] = d[k];
  return out;
}

export async function loadSpec(file) {
  const p = path.resolve(file);
  if (!p.endsWith(".json")) return withDefaults((await import(pathToFileURL(p))).default);
  const s = readJson(p);
  const where = path.basename(p);
  if (s.vo) {
    s.vo = preset(s.vo, where);
    s.vo.style = style(s.vo.style, where);
    s.vo.lines = (s.vo.lines || []).map((l) => ({ ...l, ...(l.style ? { style: style(l.style, where) } : {}) }));
  }
  for (const k of ["scenes", "slides"]) if (s[k]) s[k] = s[k].map((x, i) => preset(x, `${where} ${k}[${i}]`));
  return withDefaults(s);
}
