// Final design system: coach-led spine (A) + editorial photo chrome (C) + product-truth callouts (B).
// Everything is plain HTML/CSS rendered by Chromium, so Arabic shaping is always correct.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ROOT = the engine folder (scripts/). Everything brand-specific comes from the brand pack (src/brand.mjs).
import { brand, burl } from "./brand.mjs";
export { brand };
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
// outputs never go inside the skill: CONTENT_OUT, else ./marketing-out in the current directory
export const OUT_BASE = path.resolve(process.env.CONTENT_OUT || "marketing-out");
// Brand font: one @font-face per weight and file (e.g. Arabic + Latin subsets, both needed or Latin text falls back).
const F = brand.font;
export const FONT = F.family;
const faces = (G) => G.weights.map(w => G.files.map(x => `
@font-face{font-family:${G.family};font-weight:${w};src:url(${burl(x.src.replace("{w}", w))}) format('woff2');${x.range ? `unicode-range:${x.range};` : ""}}`).join("")).join("");
const HF = brand.headingFont;
export const fontFaces = faces(F) + (HF ? faces(HF) : "");
// brand-level CSS added after the design system: heading font and the "flat" finish. Empty for a brand that sets neither.
export const brandCss = () => (HF ? `
.h,.mega,.outline,.qc .q{font-family:${HF.family},${F.family},sans-serif}` : "") + (brand.finish === "flat" ? `
.hl{box-shadow:none}
.chip.on,.chip[data-tap].on{background:${T.primary};box-shadow:none}
.qc .row.on{background:rgba(${R.primary},.22);box-shadow:none}
.cta-btn{background:${T.primary};box-shadow:0 18px 40px rgba(0,0,0,.35)}
.mega{background:none;-webkit-text-fill-color:${T.primary};color:${T.primary};filter:drop-shadow(0 8px 30px rgba(0,0,0,.45))}
.grad{background:none;-webkit-text-fill-color:${T.primary};color:${T.primary}}
.leak,.flash{display:none}
.duo:after{background:${T.ink};opacity:.55}
.dark:after{background:${T.ink};mix-blend-mode:multiply;opacity:.35}
.teal:after{background:none}
.badge{box-shadow:0 24px 60px rgba(0,0,0,.55)}
.cap .w.now{box-shadow:none}
.phone{box-shadow:0 70px 120px rgba(0,0,0,.75),0 0 0 2px rgba(255,255,255,.1),inset 0 0 0 2px rgba(255,255,255,.14)}` : "");
// AS("photos/x.jpg" | "ui/x.png" | "cut/x.png") -> file URL inside the brand pack
export const AS = p => { const i = p.indexOf("/"), k = p.slice(0, i); const dir = brand.assets[k]; if (!dir) throw new Error("unknown asset folder: " + p); return `file://${dir}/${p.slice(i + 1)}`; };
export const LOGO = brand.logo;
// T = brand colours (hex), R = the same as "r,g,b" for rgba(); P and C stay as short names for primary and accent
export const T = brand.colors, R = brand.rgb;
export const P = T.primary, C = T.accent;
const pwDir = "/opt/pw-browsers";
export const CHROME = process.env.CHROME_PATH
  || (fs.existsSync(pwDir) && fs.readdirSync(pwDir).filter(d => /^chromium-\d+$/.test(d)).sort().map(d => `${pwDir}/${d}/chrome-linux/chrome`).find(f => fs.existsSync(f)))
  || undefined; // undefined = playwright's own browser

// The app's own AI coach characters. Never labelled as real trainers or customers.
// The brand's characters (e.g. the app's AI coaches), from the brand pack. Never labelled as real people.
export const COACH = brand.characters;

// ---------- custom line icons (no emoji anywhere) ----------
const I = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
  gym: '<path d="M2.5 9v6M5.5 6.5v11M18.5 6.5v11M21.5 9v6M5.5 12h13"/>',
  tree: '<path d="M12 21v-6"/><path d="M12 3c3.3 0 6 2.6 6 5.8 0 2.4-1.5 4.4-3.6 5.2H9.6C7.5 13.2 6 11.2 6 8.8 6 5.6 8.7 3 12 3z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><path d="M4 20 20 4"/>',
  once: '<circle cx="12" cy="12" r="8.5"/><path d="M10.5 9.5 12.5 8v8.5"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  arrow: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.4"/>',
  plate: '<circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="8.5"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  level: '<path d="M5 20v-5M10 20v-9M15 20v-13M20 20V4"/>',
  spark: '<path d="M12 3.5 13.8 10.2 20.5 12 13.8 13.8 12 20.5 10.2 13.8 3.5 12 10.2 10.2z"/>',
  cart: '<path d="M3 4h2.5l2.2 11h10.6l2-8H7"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
  pen: '<path d="m4 20 1-4L16.5 4.5l3 3L8 19z"/>',
  swipe: '<path d="M20 12H6"/><path d="m11 7-5 5 5 5"/>',
  chat: '<path d="M4 5.5h16v10H9l-5 4z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"/>',
  camera: '<path d="M4 8h3.2L9 5.5h6L16.8 8H20v11H4z"/><circle cx="12" cy="13.2" r="3.4"/>',
  scan: '<path d="M4 9V5h4M16 5h4v4M20 15v4h-4M8 19H4v-4"/><path d="M8 12h8"/>',
  bookmark: '<path d="M6.5 4h11v16l-5.5-4-5.5 4z"/>',
  play: '<circle cx="12" cy="12" r="8.5"/><path d="m10 8.5 5.5 3.5-5.5 3.5z"/>',
  scale: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 9.5a5 5 0 0 1 7 0L12 12.5"/>',
  shield: '<path d="M12 3.5 19 6v6c0 4.2-3 7.2-7 8.5-4-1.3-7-4.3-7-8.5V6z"/>',
};
export const icon = (k, s = 32, color = "currentColor", sw = 2.2) =>
  `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${I[k]}</svg>`;
export const waIcon = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>`;

const grainSVG = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`)}`;

export const css = (W, H) => `
${fontFaces}
:root{--pink:${P};--cyan:${C};--ink:${T.ink}}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${T.ink}}
body{font-family:${FONT},sans-serif;color:#fff;direction:${brand.dir_};-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;font-variant-numeric:lining-nums}
.stage{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${T.ink};isolation:isolate}
.abs{position:absolute}
.ic{flex:none;display:block}
/* ---- photography: graded, never flat ---- */
.ph{position:absolute;overflow:hidden;background:#111}
.ph>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.duo>img{filter:grayscale(1) contrast(1.35) brightness(.9)}
.duo:after{content:"";position:absolute;inset:0;background:linear-gradient(155deg,${T.primary} 0%,${T.duoMid} 42%,${T.duoLow} 72%,${T.accent} 125%);mix-blend-mode:color;opacity:.92}
.teal>img{filter:saturate(.9) contrast(1.15) brightness(1.02)}
.teal:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(${R.accent},.16),rgba(${R.ink},.05) 50%,rgba(${R.primary},.24));mix-blend-mode:overlay}
.warm>img{filter:saturate(1.1) contrast(1.1) brightness(.98)}
.warm:after{content:"";position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 40%,transparent 55%,rgba(${R.ink},.5))}
.dark>img{filter:saturate(.7) contrast(1.15) brightness(.55)}
.dark:after{content:"";position:absolute;inset:0;mix-blend-mode:soft-light;background:linear-gradient(160deg,rgba(${R.primary},.85),rgba(${R.ink},.2) 45%,rgba(${R.accent},.75))}
.shade{position:absolute;inset:0;pointer-events:none}
.grain{position:absolute;inset:-50%;background-image:url("${grainSVG}");opacity:.14;mix-blend-mode:overlay;pointer-events:none;z-index:90}
.leak{position:absolute;border-radius:50%;mix-blend-mode:screen;filter:blur(60px);pointer-events:none}
/* ---- editorial chrome (from C) ---- */
.frame{position:absolute;inset:28px;border:2px solid rgba(255,255,255,.22);border-radius:6px;pointer-events:none;z-index:80}
.folio{position:absolute;z-index:81;direction:ltr;font-weight:700;font-size:24px;letter-spacing:5px;color:rgba(255,255,255,.8)}
.outline{position:absolute;font-weight:900;direction:ltr;color:transparent;-webkit-text-stroke:3px rgba(255,255,255,.7);line-height:.8;letter-spacing:-6px;z-index:6}
.mast{position:absolute;z-index:81;display:flex;align-items:center;gap:14px;font-weight:900;font-size:30px}
.mast img{width:60px;height:60px;border-radius:16px;box-shadow:0 0 0 2px rgba(255,255,255,.18),0 8px 30px rgba(${R.primary},.35)}
.mast small{display:block;font-weight:600;color:rgba(255,255,255,.6);font-size:19px;direction:ltr;text-align:right;margin-top:1px}
.kick{display:inline-flex;align-items:center;gap:14px;font-weight:800;color:#fff}
.kick:before{content:"";width:46px;height:6px;background:var(--pink);border-radius:3px}
.kick.c:before{background:var(--cyan)}
/* ---- type ---- */
.h{font-weight:900;line-height:1.22;letter-spacing:-.5px;text-shadow:0 6px 40px rgba(0,0,0,.55)}
.hl{display:inline-block;background:var(--pink);color:${T.onPrimary};padding:.02em .2em .04em;border-radius:.14em;line-height:1.08;box-shadow:0 12px 44px rgba(${R.primary},.5);text-shadow:none}
.hlc{display:inline-block;background:var(--cyan);color:${T.ink};padding:.02em .2em .04em;border-radius:.14em;line-height:1.08;text-shadow:none}
.grad{background:linear-gradient(90deg,${T.accent},${T.gradMid} 45%,${T.primary});-webkit-background-clip:text;background-clip:text;color:transparent;padding-bottom:.1em}
.pk{color:var(--pink)}.cy{color:var(--cyan)}
.sub{font-weight:500;line-height:1.45;color:rgba(255,255,255,.88);text-wrap:balance}
.sub b{color:#fff;font-weight:800}
.note{display:inline-flex;align-items:center;gap:12px;font-weight:700;color:rgba(255,255,255,.92);background:rgba(${R.ink},.72);border:1.5px solid rgba(255,255,255,.18);border-radius:999px;padding:10px 22px 8px 18px}
/* ---- glass + survey cards (verbatim app wording) ---- */
.glass{background:linear-gradient(160deg,rgba(38,32,52,.86),rgba(14,14,22,.9));border:1.5px solid rgba(255,255,255,.14);
  box-shadow:0 30px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.12);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}
.qc{position:absolute;border-radius:30px;padding:24px 26px 22px;z-index:30}
.qc .tag{display:flex;align-items:center;gap:8px;font-weight:700;color:var(--cyan);font-size:.7em;margin-bottom:8px}
.qc .tag:before{content:"";width:9px;height:9px;border-radius:50%;background:var(--cyan);box-shadow:0 0 10px var(--cyan)}
.qc .q{font-weight:800;line-height:1.3;margin-bottom:14px}
.qc .row{display:flex;align-items:center;gap:14px;border-radius:18px;padding:13px 16px 10px;margin-top:9px;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.1);font-weight:700;color:rgba(255,255,255,.82)}
.qc .row .rd{flex:none;width:28px;height:28px;border-radius:50%;border:2.5px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center}
.qc .row.on{background:linear-gradient(135deg,rgba(${R.primary},.32),rgba(${R.primaryDeep},.22));border-color:var(--pink);color:#fff;box-shadow:0 0 30px rgba(${R.primary},.3)}
.qc .row .rd svg{opacity:0}
.qc .row.on .rd{background:var(--pink);border-color:var(--pink)}.qc .row.on .rd svg{opacity:1}
.chips{display:flex;flex-wrap:wrap;gap:12px}
.chip{display:inline-flex;align-items:center;gap:10px;border-radius:999px;font-weight:700;padding:12px 24px 9px;white-space:nowrap;
  background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.18);color:rgba(255,255,255,.88)}
.chip.on{background:linear-gradient(135deg,${T.primary},${T.primaryDeep});border-color:transparent;color:${T.onPrimary};box-shadow:0 10px 30px rgba(${R.primary},.45),inset 0 1px 0 rgba(255,255,255,.35)}
.chip.cy{background:var(--cyan);border-color:transparent;color:${T.onAccent};box-shadow:0 10px 30px rgba(${R.accent},.35)}
.chip.w{background:#fff;color:${T.ink};border-color:#fff}
/* ---- stickers ---- */
.stk{position:absolute;z-index:40;display:inline-flex;align-items:center;gap:12px;padding:14px 28px 11px;border-radius:999px;font-weight:900;white-space:nowrap;box-shadow:0 16px 40px rgba(0,0,0,.5)}
.stk.w{background:#fff;color:${T.ink}}.stk.p{background:var(--pink);color:${T.onPrimary}}.stk.c{background:var(--cyan);color:${T.ink}}
.stk.k{background:rgba(${R.ink},.85);color:#fff;border:2px solid rgba(255,255,255,.25)}
.badge{position:absolute;z-index:42;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;line-height:1;background:var(--pink);color:${T.onPrimary};
  box-shadow:0 0 0 10px rgba(${R.primary},.25),0 24px 60px rgba(0,0,0,.55),0 0 60px rgba(${R.primary},.6)}
/* ---- coach cut-out with two-tone rim light (from A) ---- */
.coach{position:absolute;-webkit-mask-image:linear-gradient(to top,transparent 0,#000 22%)}
.coach .rim{position:absolute;inset:0;-webkit-mask-size:contain;-webkit-mask-repeat:no-repeat;-webkit-mask-position:bottom center;filter:blur(14px)}
.coach .rim.p{background:${T.primary};transform:translate(16px,-6px);opacity:.95}
.coach .rim.c{background:${T.accent};transform:translate(-16px,-6px);opacity:.85}
.coach img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:bottom center}
.coach .light{position:absolute;inset:0;-webkit-mask-size:contain;-webkit-mask-repeat:no-repeat;-webkit-mask-position:bottom center;mix-blend-mode:overlay;
  background:linear-gradient(90deg,rgba(${R.accent},.7),rgba(255,255,255,0) 38%,rgba(255,255,255,0) 62%,rgba(${R.primary},.8))}
.nametag{position:absolute;z-index:45;display:flex;align-items:center;gap:10px;font-weight:800;background:rgba(${R.ink},.78);border:1.5px solid rgba(255,255,255,.2);border-radius:999px;padding:9px 20px 7px;backdrop-filter:blur(10px)}
.nametag span{font-weight:500;color:rgba(255,255,255,.65);font-size:.8em}
/* ---- 3D phone with glare + floor reflection (from B) ---- */
.phone{position:absolute;border-radius:9% / 4.4%;padding:3.4%;background:linear-gradient(145deg,#4a4858,#121218 38%,#2c2a36);z-index:25;
  box-shadow:0 70px 120px rgba(0,0,0,.75),0 0 0 2px rgba(255,255,255,.1),inset 0 0 0 2px rgba(255,255,255,.14),0 0 90px rgba(${R.primary},.28)}
.phone.refl{-webkit-box-reflect:below 18px linear-gradient(transparent 72%,rgba(255,255,255,.16))}
.phone .scr{border-radius:7.5% / 3.6%;overflow:hidden;position:relative;background:#0b0a10}
.phone .sb{height:0;padding-top:9%;position:relative;background:#0b0a10}
.phone .sb i{position:absolute;top:22%;left:50%;width:30%;height:44%;transform:translateX(-50%);border-radius:99px;background:#000}
.phone .scr img{display:block;width:100%}
.phone .scr:after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.16),rgba(255,255,255,0) 32%);pointer-events:none}
.anc{position:absolute;width:2px;height:2px}
/* real UI cut-outs */
.ui{position:absolute;z-index:28;border-radius:26px;overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,.65),0 0 0 2px rgba(255,255,255,.12);background:#14121c}
.ui>img{display:block;width:100%;height:auto}
/* neon callouts (lines drawn by script to real UI anchors) */
.co{position:absolute;z-index:60;border-radius:22px;padding:16px 22px 13px;border-inline-start:5px solid var(--cyan)}
.co.p{border-inline-start-color:var(--pink)}
.co b{display:block;font-weight:900;line-height:1.2}
.co span{display:block;font-weight:500;color:rgba(255,255,255,.72);margin-top:4px;line-height:1.3}
svg.wires{position:absolute;inset:0;width:100%;height:100%;z-index:58;pointer-events:none;overflow:visible}
/* voice-note bubble */
.vn{display:flex;align-items:center;gap:20px;border-radius:36px;padding:20px 24px}
.vn .av{flex:none;border-radius:50%;padding:4px;background:linear-gradient(135deg,${T.primary},${T.accent})}
.vn .av img{display:block;border-radius:50%;width:100%;height:100%;object-fit:cover}
.vn .who{font-weight:800;display:flex;gap:12px;align-items:baseline}
.vn .who span{font-weight:500;color:rgba(255,255,255,.6)}
.vn .q{font-weight:700;line-height:1.38;margin-top:6px;text-wrap:balance}
.wave{display:flex;align-items:center;gap:5px;height:44px;direction:ltr}
.wave i{display:block;width:6px;border-radius:4px;background:linear-gradient(${T.primary},${T.accent})}
/* CTA */
.cta-btn{display:inline-flex;align-items:center;gap:20px;font-weight:900;border-radius:999px;color:${T.onPrimary};
  background:linear-gradient(100deg,${T.primary},${T.ctaMid} 55%,${T.violet});box-shadow:0 24px 70px rgba(${R.primary},.55),inset 0 2px 0 rgba(255,255,255,.35)}
.url{font-weight:800;direction:ltr;color:${T.accent};letter-spacing:.5px}
.mega{font-weight:900;line-height:1.05;background:linear-gradient(95deg,${T.accent} 0%,${T.megaMid} 40%,${T.primary} 75%,${T.megaEnd} 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 10px 50px rgba(${R.primary},.45));padding:.06em .04em .14em}
.tchip{display:inline-flex;align-items:center;gap:12px;font-weight:800;border-radius:999px;padding:12px 24px 9px;background:rgba(${R.ink},.7);border:1.5px solid rgba(${R.accent},.45);box-shadow:0 0 24px rgba(${R.accent},.18) inset}
.fine{font-weight:500;color:rgba(255,255,255,.72);line-height:1.45;text-wrap:balance}
.pin{position:absolute;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;background:${T.primary};z-index:5;box-shadow:0 0 0 10px rgba(${R.primary},.28),0 0 0 22px rgba(${R.primary},.12),0 0 40px ${T.primary}}
.pin.cy{background:${T.accent};box-shadow:0 0 0 10px rgba(${R.accent},.28),0 0 0 22px rgba(${R.accent},.12),0 0 40px ${T.accent}}
.polaroid{position:absolute;z-index:35;background:#f6f3ec;padding:16px 16px 0;border-radius:6px;box-shadow:0 40px 80px rgba(0,0,0,.6)}
.polaroid .im{background-size:cover;background-position:center;border-radius:2px}
.polaroid .pcap{color:#16141c;font-weight:800;text-align:center;padding:12px 0 14px}
`;

// ---------- components ----------
export const photo = (file, { x = 0, y = 0, w, h, grade = "dark", pos = "50% 50%", zoom = 1, origin = "50% 50%", cls = "", style = "", attrs = "" }) =>
  `<div class="ph ${grade} ${cls}" ${attrs} style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${style}"><img src="${AS("photos/" + file)}" style="object-position:${pos};transform:scale(${zoom});transform-origin:${origin}"></div>`;

export const shade = s => `<div class="shade" style="background:${s}"></div>`;

export const leaks = (list) => list.map(([x, y, s, c, o]) =>
  `<div class="leak" style="left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;background:radial-gradient(circle,${c},transparent 65%);opacity:${o}"></div>`).join("");

export const coach = (k, { x, y, w, h = w, id = "", style = "", cls = "", attrs = "" }) => {
  const c = COACH[k];
  if (!c) return ""; // brands without characters simply get no cut-out
  const m = `-webkit-mask-image:url('${c.cut}')`;
  return `<div class="coach ${cls}" ${id ? `id="${id}"` : ""} ${attrs} style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${style}">
    <div class="rim p" style="${m}"></div><div class="rim c" style="${m}"></div>
    <img src="${c.cut}"><div class="light" style="${m}"></div></div>`;
};

// phone with real UI screenshot; anchors are fractional points on the SCREENSHOT used as callout targets
export const phone = (shot, { x, y, w, rot = "", id, anchors = {}, style = "", attrs = "", cls = "" }) =>
  `<div class="phone ${cls}" id="${id}" ${attrs} style="left:${x}px;top:${y}px;width:${w}px;transform:${rot};${style}"><div class="scr"><div class="sb"><i></i></div><div style="position:relative"><img src="${AS("ui/" + (/\.(png|jpe?g|webp)$/i.test(shot) ? shot : shot + ".png"))}">${Object.entries(anchors).map(([k, [fx, fy]]) => `<i class="anc" data-anc="${id}.${k}" style="left:${fx * 100}%;top:${fy * 100}%"></i>`).join("")}</div></div></div>`;

export const uiCut = (shot, { x, y, w, rot = 0, id = "", anchors = {}, style = "", attrs = "" }) =>
  `<div class="ui" ${id ? `id="${id}"` : ""} ${attrs} style="left:${x}px;top:${y}px;width:${w}px;transform:rotate(${rot}deg);${style}"><img src="${AS("ui/" + (/\.(png|jpe?g|webp)$/i.test(shot) ? shot : shot + ".png"))}">${Object.entries(anchors).map(([k, [fx, fy]]) => `<i class="anc" data-anc="${id}.${k}" style="left:${fx * 100}%;top:${fy * 100}%"></i>`).join("")}</div>`;

// callout label; `to` = "phoneId.anchor"; color p|c
export const callout = ({ to, x, y, w, title, sub = "", fs = 34, color = "c", attrs = "" }) =>
  `<div class="co glass ${color === "p" ? "p" : ""}" data-to="${to}" data-col="${color === "p" ? P : C}" ${attrs} style="left:${x}px;top:${y}px;width:${w}px"><b style="font-size:${fs}px">${title}</b>${sub ? `<span style="font-size:${Math.round(fs * 0.68)}px">${sub}</span>` : ""}</div>`;

// survey card: question + option labels copied verbatim from the app's survey forms
export const qcard = ({ q, opts, x, y, w, fs = 30, rows = true, rot = 0, tag = brand.labels.surveyTag, attrs = "", id = "" }) =>
  `<div class="qc glass" ${id ? `id="${id}"` : ""} ${attrs} style="left:${x}px;top:${y}px;width:${w}px;font-size:${fs}px;transform:rotate(${rot}deg)">
    <div class="tag">${tag}</div><div class="q" style="font-size:${Math.round(fs * 1.1)}px">${q}</div>
    ${rows ? opts.map(([t, on, tap]) => `<div class="row ${on ? "on" : ""}" ${tap != null ? `data-tap="${tap}"` : ""}><span class="rd">${icon("check", 18, "#fff", 3.2)}</span>${t}</div>`).join("")
    : `<div class="chips">${opts.map(([t, on, tap]) => `<span class="chip ${on ? "on" : ""}" ${tap != null ? `data-tap="${tap}"` : ""} style="font-size:${fs}px">${t}</span>`).join("")}</div>`}
  </div>`;

export const wave = (n = 26, seed = 3, hmax = 44) => {
  let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  return `<div class="wave">${Array.from({ length: n }, () => `<i style="height:${Math.round(8 + r() * (hmax - 8))}px"></i>`).join("")}</div>`;
};

export const voiceNote = (k, quote, { w, fs = 32, av = 96 }) => {
  const c = COACH[k];
  if (!c) return "";
  return `<div class="vn glass" style="width:${w}px">
    <div class="av" style="width:${av}px;height:${av}px"><img src="${c.av}"></div>
    <div style="flex:1;min-width:0">
      <div class="who" style="font-size:${fs * 0.78}px">${c.name}<span>${[c.tag, brand.voiceNoteTag].filter(Boolean).join(" · ")}</span></div>
      <div class="q" style="font-size:${fs}px">«${quote}»</div>
    </div></div>`;
};

// brand masthead: logo + name + url. Shared by carousel slides and the video chrome.
export const mastInner = () => `<img src="${LOGO}"><div>${brand.name}${brand.url ? `<small>${brand.url}</small>` : ""}</div>`;
export const mast = ({ x = 66, y = 62, style = "" }) => `<div class="mast" style="right:${x}px;top:${y}px${style}">${mastInner()}</div>`;
export const folio = (i, n, { x = 66, y = 80 }) => `<div class="folio" style="left:${x}px;top:${y}px">${String(i).padStart(2, "0")} / ${String(n).padStart(2, "0")}</div>`;

// Draw glowing wires from every .co[data-to] to its anchor. Runs in the page (load + every video frame).
export const wiresScript = `
function drawWires(){
  const st=document.getElementById('stage');const sr=st.getBoundingClientRect();
  document.querySelectorAll('svg.wires').forEach(s=>s.remove());
  const groups=new Map();
  document.querySelectorAll('.co[data-to]').forEach(co=>{
    const a=document.querySelector('[data-anc="'+co.dataset.to+'"]'); if(!a)return;
    const host=co.closest('.scene')||st; if(!groups.has(host))groups.set(host,[]); groups.get(host).push([co,a]);});
  groups.forEach((list,host)=>{
    const hr=host.getBoundingClientRect();
    let svg='<svg class="wires" xmlns="http://www.w3.org/2000/svg">';
    list.forEach(([co,a])=>{
      if(host!==st&&host.style.display==='none')return;
      let op=1; for(let e=co;e&&e!==st;e=e.parentElement){op*=+getComputedStyle(e).opacity;} if(op<0.02)return;
      const r=co.getBoundingClientRect(), q=a.getBoundingClientRect();
      const ax=q.left+1-hr.left, ay=q.top+1-hr.top;
      const L=r.left-hr.left,R=r.right-hr.left,T=r.top-hr.top,B=r.bottom-hr.top;
      let d;
      if(ax>L+20&&ax<R-20){ const sy= ay>B ? B : T; d='M'+ax+' '+sy+' L'+ax+' '+ay; }
      else { const left = ax < L; const sx = left ? L : R, sy = T + (B-T)/2;
        const mx = sx + (left?-1:1)*Math.min(70,Math.abs(ax-sx)*0.35); d='M'+sx+' '+sy+' L'+mx+' '+sy+' L'+ax+' '+ay; }
      const col=co.dataset.col;
      svg+='<g opacity="'+op+'"><path d="'+d+'" stroke="'+col+'" stroke-width="10" fill="none" opacity=".25" style="filter:blur(6px)"/>'
        +'<path d="'+d+'" stroke="'+col+'" stroke-width="3.5" fill="none" stroke-linejoin="round"/>'
        +'<circle cx="'+ax+'" cy="'+ay+'" r="22" fill="none" stroke="'+col+'" stroke-width="3" opacity=".6"/>'
        +'<circle cx="'+ax+'" cy="'+ay+'" r="9" fill="'+col+'" style="filter:drop-shadow(0 0 8px '+col+')"/></g>';
    });
    svg+='</svg>'; host.insertAdjacentHTML('beforeend',svg);
  });
}`;

export const page = (W, H, body, extraCss = "", script = "") => `<!doctype html><html lang="${brand.lang}" dir="${brand.dir_}"><head><meta charset="utf-8"><style>${css(W, H)}${extraCss}${brandCss()}</style></head>
<body><div class="stage" id="stage">${body}<div class="grain"></div></div><script>${wiresScript}${script}</script></body></html>`;

// Truth gate: the brand's forbidden phrases (brand.config.json → truth.forbidden) must never reach a render.
export const FORBIDDEN = brand.truth.forbidden;
export function truthGate(html, where) {
  const text = html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<[^>]+>/g, " ");
  for (const f of FORBIDDEN) if (text.includes(f)) throw new Error(`TRUTH GATE: «${f}» found in ${where}`);
  if (brand.truth.westernDigits && /[٠-٩]/.test(text)) throw new Error(`NUMERALS: Arabic-Indic digit found in ${where}; use Western digits`);
}
