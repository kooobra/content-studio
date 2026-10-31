// Usage: node new-brand.mjs [target folder, default ./content-brand] [--name "اسم"] [--url example.com] [--primary #hex] [--accent #hex] [--ink #hex]
// Copies the empty brand-pack template into the project. Refuses to overwrite an existing pack.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TPL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../templates/brand-pack");
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const o = { name: opt("name"), url: opt("url"), primary: opt("primary"), accent: opt("accent"), ink: opt("ink") };
const dest = path.resolve(args[0] || "content-brand");
if (fs.existsSync(path.join(dest, "brand.config.json"))) { console.error(`a brand pack already exists at ${dest}; not touching it`); process.exit(1); }
fs.cpSync(TPL, dest, { recursive: true });
const f = path.join(dest, "brand.config.json");
const c = JSON.parse(fs.readFileSync(f, "utf8"));
const hex = (v) => { if (v && !/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(v)) throw new Error("not a hex colour: " + v); return v; };
if (o.name) { c.name = o.name; c.voice.narrator.name = o.name; }
if (o.url) { const u = o.url.replace(/^https?:\/\//, "").replace(/\/$/, ""); c.url = u; c.site = c.capture.url = `https://${u}`; c.id = c.id.startsWith("TODO") ? u.split(".")[0] : c.id; c.voice.namePrefix = `${c.id}-ad`; }
for (const k of ["primary", "accent", "ink"]) if (o[k]) c.colors[k] = hex(o[k]);
fs.writeFileSync(f, JSON.stringify(c, null, 2) + "\n");
console.log(`brand pack created at ${dest}. Next: fill the TODOs, then run check-brand.mjs`);
