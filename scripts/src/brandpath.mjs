// Usage: node scripts/src/brandpath.mjs [dir|photos|ui|cut|credits|specs|file]  -> prints that path of the active brand pack
import { brand } from "./brand.mjs";
const k = process.argv[2] || "dir";
const v = { dir: brand.dir, file: brand.file, specs: brand.specs, ...brand.assets }[k];
if (!v) { console.error("unknown key: " + k); process.exit(1); }
console.log(v);
