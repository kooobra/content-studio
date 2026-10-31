// Usage: node scripts/src/carousel.mjs <spec.carousel.mjs> [outDir] [slideList e.g. 0,5]
// Renders every slide twice: feed 1080x1350 and story 1080x1920 -> <outDir>/{feed,story}/NN.png
import { chromium } from "./deps.mjs";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { OUT_BASE, CHROME, mast, page, truthGate } from "./lib.mjs";
import { layouts } from "./layouts.mjs";
import { loadSpec } from "./spec.mjs";

if (!process.argv[2]) { console.error("usage: node carousel.mjs <spec.carousel.mjs> [outDir] [slides e.g. 0,5]"); process.exit(1); }
const specPath = path.resolve(process.argv[2]);
const spec = await loadSpec(specPath);
const OUT = path.resolve(process.argv[3] || `${OUT_BASE}/${spec.id}/carousel`);
const n = spec.slides.length;
const only = process.argv[4] ? process.argv[4].split(",").map(Number) : [...Array(n).keys()];
const TMP = `${OUT}/../build/html`; fs.mkdirSync(TMP, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
for (const [fmt, H] of [["feed", 1350], ["story", 1920]]) {
  fs.mkdirSync(`${OUT}/${fmt}`, { recursive: true });
  const pg = await browser.newPage({ viewport: { width: 1080, height: H } });
  for (const i of only) {
    const d = spec.slides[i], ctx = { S: H > 1500, W: 1080, H, i, n };
    const html = page(1080, H, layouts[d.layout](d, ctx) + chromeFor(ctx, spec.folio !== false), "", "document.fonts.ready.then(()=>{drawWires();document.body.dataset.ready=1})");
    truthGate(html, `${spec.id} ${fmt} slide ${i + 1}`);
    const f = `${TMP}/${spec.id}_${fmt}_${i + 1}.html`;
    fs.writeFileSync(f, html);
    await pg.goto("file://" + f, { waitUntil: "load" });
    await pg.waitForSelector("body[data-ready]");
    await pg.waitForTimeout(120);
    await pg.screenshot({ path: `${OUT}/${fmt}/${String(i + 1).padStart(2, "0")}.png` });
  }
  await pg.close();
}
await browser.close();
console.log(`carousel ${spec.id}: ${only.length} slides x 2 formats -> ${OUT}`);

// folio=false (spec level) drops the «01 / 06» counter, for stories that are posted one by one.
function chromeFor({ S, i, n }, folio = true) {
  return `<div class="frame"></div>
  ${mast({ x: 66, y: S ? 150 : 62 })}
  ${folio ? `<div class="folio" style="left:66px;top:${S ? 172 : 84}px">${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}</div>` : ""}`;
}
