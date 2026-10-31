// Usage: node scripts/src/cap_landing.mjs <outDir>
// Captures the brand site's real feature demos (sample data, no login) as UI assets. What to capture is listed in
// brand.config.json → capture.shots: [{ name, sel, wait?, click?, clickIndex?, eachTab? }]
//   click/clickIndex: click that element first (e.g. a tab); eachTab: one shot per matching tab, "{i}" in name = index.
// Demos are animated: each shot waits until the demo has played, so the frame shows a finished state.
import { chromium } from "./deps.mjs";
import { proxyRoutes } from "./net.mjs";
import { CHROME, brand } from "./lib.mjs";
const out = process.argv[2];
if (!out || !brand.capture.url) { console.error("usage: cap_landing.mjs <outDir>  (needs capture.url in the brand config)"); process.exit(1); }
const b = await chromium.launch({ executablePath: CHROME });
const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: brand.capture.locale });
await proxyRoutes(ctx);
const p = await ctx.newPage();
await p.goto(brand.capture.url, { waitUntil: "networkidle", timeout: 90000 });
const h = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < h; y += 400) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(200); }
// dismiss prompts (e.g. notifications) by their button text
for (const t of brand.capture.dismiss) { const x = p.getByText(t).first(); if (await x.count()) await x.click().catch(() => {}); }
async function shot(sel, name, wait = 6000, before) {
  const el = p.locator(sel).first();
  if (!(await el.count())) { console.log("missing", sel); return; }
  // animated elements never become "stable", so scroll with the DOM API and clip the page shot instead
  await el.evaluate(e => e.scrollIntoView({ block: "center" }));
  if (before) await before();
  await p.waitForTimeout(wait);
  await el.evaluate(e => e.scrollIntoView({ block: "center" }));
  await p.waitForTimeout(300);
  const bb = await el.boundingBox();
  if (!bb) { console.log("no box", name); return; }
  const sy = await p.evaluate(() => window.scrollY);
  await p.screenshot({ path: `${out}/${name}.png`, clip: { ...bb, y: bb.y + sy }, fullPage: true }); console.log("ok", name, Math.round(bb.width), Math.round(bb.height));
}
for (const s of brand.raw.capture?.shots || []) {
  if (s.eachTab) {
    const tabs = p.locator(s.eachTab), n = await tabs.count();
    for (let i = 0; i < n; i++) await shot(s.sel, s.name.replace("{i}", i), s.wait, async () => tabs.nth(i).evaluate(e => e.click()));
  } else {
    const before = s.click ? async () => { const c = p.locator(s.click).nth(s.clickIndex || 0); if (await c.count()) await c.evaluate(e => e.click()); } : undefined;
    await shot(s.sel, s.name, s.wait, before);
  }
}
await b.close();
