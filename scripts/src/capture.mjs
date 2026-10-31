// Usage: node scripts/src/capture.mjs <url> <out.png> [selector]
// Captures a REAL app screen from the public site (sample data, no login, no forms) at 430x932 @3x.
// All requests go through Node's fetch (src/net.mjs) so TLS is verified normally (set NODE_EXTRA_CA_CERTS if behind a proxy).
// With a selector, only that element is captured (e.g. a phone screen in the landing showcase).
import { chromium } from "./deps.mjs";
import { proxyRoutes } from "./net.mjs";
import { CHROME, brand } from "./lib.mjs";
const [url, out, sel] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: CHROME });
const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: brand.capture.locale });
await proxyRoutes(ctx);
const p = await ctx.newPage();
await p.goto(url, { waitUntil: "networkidle", timeout: 90000 });
const h = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < h; y += 500) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(250); }
if (sel) { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(800); await el.screenshot({ path: out }); }
else { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1000); await p.screenshot({ path: out, fullPage: true }); }
await b.close(); console.log("captured", out);
