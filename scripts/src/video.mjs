// Usage: node scripts/src/video.mjs <spec.video.mjs> [outDir] [--snap 0,2.6,5.1]
// 1) checks every clip text against manifest.json, 2) times caption phrases with ffmpeg silencedetect,
// 3) renders frames with a deterministic window.renderAt(t), 4) synthesises the music bed (src/music.py),
// 5) mixes voice + music (ducked) and encodes <outDir>/video/main.mp4 (1080x1920, 30 fps, H.264 + AAC, -14 LUFS).
import { chromium } from "./deps.mjs";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { ROOT, OUT_BASE, CHROME, T, R, P, C, COACH, brand, mast, page, wave, truthGate } from "./lib.mjs";
import { vscenes } from "./vscenes.mjs";
import { loadSpec } from "./spec.mjs";

const args = process.argv.slice(2);
const snapIdx = args.indexOf("--snap");
const SNAP = snapIdx >= 0 ? args.splice(snapIdx, 2)[1] : null;
const musIdx = args.indexOf("--music");                 // --music <file.wav|mp3>: licensed track instead of the synth bed
const MUSIC = musIdx >= 0 ? path.resolve(args.splice(musIdx, 2)[1]) : null;
const mixIdx = args.indexOf("--mix-only");              // --mix-only: reuse build/frames, redo music + mix only
const MIX_ONLY = mixIdx >= 0 ? (args.splice(mixIdx, 1), true) : false;
const flagArg = (n) => { const i = args.indexOf(n); return i >= 0 ? (args.splice(i, 1), true) : false; };
const PREVIEW = flagArg("--preview");                   // --preview: half size, 15 fps -> video/preview.mp4 (fast review copy)
const TIMELINE = flagArg("--timeline");                 // --timeline: one still per scene + its voice line -> review/timeline.png
// WORKERS=n renders frames in n browser pages at once (same frames, faster). Default 1.
const WORKERS = Math.max(1, +process.env.WORKERS || 1);
if (!args[0]) { console.error("usage: node video.mjs <spec.video.mjs> [outDir] [--snap t1,t2] [--music file] [--mix-only]"); process.exit(1); }
const specPath = path.resolve(args[0]);

const spec = await loadSpec(specPath);
const OUT = path.resolve(args[1] || `${OUT_BASE}/${spec.id}`);
const FPS = PREVIEW ? 15 : 30, WD = 1080, HT = 1920, TOTAL = spec.total, SCALE = PREVIEW ? 0.5 : 1;
// Motion (see references/motion.md). A spec (or the brand's "defaults") sets:
//   motion:     "classic" (accepted look) | "spring" (all entrances + captions) | "auto" (spring entrances, calm captions)
//   transition: one name for every cut, or "auto" (picked per scene from its layout, see autoTransition); a scene can override
//   fx:         "none" | "auto" (every effect where it applies) | a list of: sweep, count, glare, impact, beat
//   look: "classic" pins all three to the accepted look (old specs use it so they re-render unchanged).
const MOTION = spec.motion || "classic";
const TRANS = ["whip", "fade", "zoom", "slide", "cut", "wipe", "iris", "rise", "blur", "glitch"];
const TD = { whip: 0.22, fade: 0.4, zoom: 0.36, slide: 0.3, cut: 0.02, wipe: 0.4, iris: 0.45, rise: 0.32, blur: 0.42, glitch: 0.24 };
const PHONE = ["phoneHero", "phoneCallouts", "phoneFeature", "food", "payoff"];
// auto: the cut matches what the next scene is. CTA zooms in, a closing question opens like an iris, app screens rise
// in like a feed, a list wipes in, the scene right after the hook glitches (pattern interrupt), two statements blur
// into each other. Never the same transition twice in a row (except into the CTA).
function autoTransition(i, prevPick) {
  const sc = spec.scenes[i], pv = spec.scenes[i - 1];
  let t = sc.layout === "cta" ? "zoom" : sc.layout === "ask" ? "iris"
    : PHONE.includes(sc.layout) ? (PHONE.includes(pv.layout) ? "slide" : "rise")
    : ["checklist", "answers"].includes(sc.layout) ? "wipe"
    : sc.layout === "statement" ? (pv.layout === "hook" ? "glitch" : pv.layout === "statement" ? "blur" : "whip")
    : ["bodyMap", "split", "photoQuestion"].includes(sc.layout) ? "whip" : "fade";
  if (t === prevPick && sc.layout !== "cta") t = ["whip", "blur", "fade", "wipe"].find(x => x !== prevPick);
  return t;
}
const TR_PICKED = [];
spec.scenes.forEach((sc, i) => {
  let t = sc.transition || spec.transition || "whip";
  if (t === "auto") t = i ? autoTransition(i, TR_PICKED[i - 1]) : "whip";
  if (!TRANS.includes(t)) throw new Error(`unknown transition «${t}» (use ${TRANS.join("|")} or auto)`);
  TR_PICKED.push(t);
});
const trOf = (s) => TR_PICKED[spec.scenes.indexOf(s)];
const tdOf = (s) => s.transitionDur ?? spec.transitionDur ?? TD[trOf(s)];
const FX_ALL = ["sweep", "count", "glare", "impact", "beat"];
const FX = spec.fx === "auto" ? FX_ALL : Array.isArray(spec.fx) ? spec.fx : [];
for (const x of FX) if (!FX_ALL.includes(x)) throw new Error(`unknown fx «${x}» (use ${FX_ALL.join("|")})`);
// pre-recorded character clips (brand.config → app.coachAudio/manifest.json), only needed by specs that use spec.clips
const AUD = brand.app?.coachAudio ? brand.app.coachAudio + "/" : null;
let manifest = null;
const clipMeta = (coachKey, key) => {
  if (!AUD) throw new Error(`spec.clips needs app.coachAudio in ${brand.file}`);
  manifest ??= JSON.parse(fs.readFileSync(AUD + "manifest.json", "utf8"));
  return manifest.coaches[coachKey]?.clips[key];
};
const BUILD = `${OUT}/build`; fs.mkdirSync(BUILD, { recursive: true });
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{FE0F}]/gu;

// ---------- 1+2. clips: verbatim check + phrase timing from silencedetect ----------
// spec.vo + assets/vo/<id>.json (src/voiceover.mjs) = the ad's own narrator; otherwise coach clips
const VO_FILE = `${OUT}/vo/${spec.id}.json`;
const VO = spec.vo && fs.existsSync(VO_FILE) ? JSON.parse(fs.readFileSync(VO_FILE, "utf8")).lines : null;
if (VO) COACH.narrator = brand.voice.narrator;
const clipSrc = VO ? VO.map(l => ({ key: l.text, at: l.at, coach: "narrator", file: l.file, seconds: l.seconds })) : spec.clips;
const clips = clipSrc.map(c => {
  const coachKey = c.coach || spec.coach;
  const m = c.file ? { file: c.file, seconds: c.seconds } : clipMeta(coachKey, c.key);
  if (!m) throw new Error(`clip text not in manifest (${coachKey}): ${c.key}`);
  const full = c.key.replace(EMOJI, "").trim();
  const shown = (c.shown || full).replace(EMOJI, "").trim();
  if (!full.startsWith(shown)) throw new Error("caption is not a verbatim prefix of the clip: " + shown);
  const file = c.file ? c.file : AUD + m.file, len = c.trim || m.seconds;
  // voiced segments
  const err = execFileSync("bash", ["-c", `ffmpeg -hide_banner -nostats -t ${len} -i "${file}" -af silencedetect=noise=-33dB:d=0.16 -f null - 2>&1 || true`]).toString();
  const ss = [...err.matchAll(/silence_start: ([\d.]+)/g)].map(x => +x[1]), se = [...err.matchAll(/silence_end: ([\d.]+)/g)].map(x => +x[1]);
  let segs = [], cur = 0;
  // build voiced = complement of silences within [0,len]
  const sil = ss.map((s, k) => [s, se[k] ?? len]);
  for (const [a, b] of sil) { if (a - cur > 0.08) segs.push([cur, a]); cur = b; }
  if (len - cur > 0.08) segs.push([cur, len]);
  const phrases = shown.split(/(?<=[،.!؟])\s+/).filter(Boolean);
  let ph;
  if (segs.length === phrases.length) ph = phrases.map((p, k) => [segs[k][0], segs[k][1], p]);
  else { // fallback: spread phrases over the voiced span by letter count
    const a = segs[0][0], b = segs[segs.length - 1][1];
    const L = phrases.map(p => p.replace(/[^؀-ۿ]/g, "").length), T = L.reduce((x, y) => x + y, 0);
    let acc = a; ph = phrases.map((p, k) => { const d = (b - a) * L[k] / T; const r = [acc, acc + d, p]; acc += d; return r; });
  }
  console.log(`clip ${m.file} @${c.at}s: ${segs.length} voiced segs / ${phrases.length} phrases ->`, ph.map(p => `${p[0].toFixed(2)}-${p[1].toFixed(2)} ${p[2]}`).join(" | "));
  return { ...c, coach: coachKey, file, len, shown, ph };
});
// word timing inside each phrase, weighted by letters
const capWords = clips.map(c => c.ph.map(([s, e, txt]) => {
  const ws = txt.split(" "); const L = ws.map(w => w.replace(/[^؀-ۿ]/g, "").length || 0.6); const T = L.reduce((a, b) => a + b, 0);
  let acc = s; return ws.map((w, i) => { const d = (e - s) * L[i] / T; const r = [c.at + acc, c.at + acc + d, w]; acc += d; return r; });
}));

// ---------- 3. page ----------
const scenesHtml = spec.scenes.map((s, i) => { if (!vscenes[s.layout]) throw new Error(`unknown video layout «${s.layout}»`);
  return `<section class="scene" data-t0="${s.t0}" data-t1="${s.t1}" data-tr="${trOf(s)}" data-td="${tdOf(s)}">${vscenes[s.layout](s, i)}</section>`; }).join("");
// caption window: from just before its first word to a beat after its last, but never past the next caption's start
// (they share one spot on screen, so an overlap shows two lines on top of each other)
const capS = clips.map(c => c.at + c.ph[0][0] - 0.2);
const capE = clips.map((c, ci) => Math.min(c.at + c.ph[c.ph.length - 1][1] + 0.35, capS[ci + 1] ?? Infinity));
const caps = clips.map((c, ci) => `
  <div class="cap" data-s="${capS[ci].toFixed(3)}" data-e="${capE[ci].toFixed(3)}">
    <div class="spk"><img src="${COACH[c.coach].av}"><b>${COACH[c.coach].name}</b><span>${COACH[c.coach].tag}</span>${wave(14, ci + 5, 34).replace('class="wave"', 'class="wave live"')}</div>
    ${capWords[ci].map(ph => `<div class="ln">${ph.map(([s, e, w]) => `<span class="w" data-s="${s.toFixed(3)}" data-e="${e.toFixed(3)}">${w}</span>`).join(" ")}</div>`).join("")}
  </div>`).join("");
const bars = spec.scenes.map(s => `<i data-t0="${s.t0}" data-t1="${s.t1}"><b></b></i>`).join("");
const chromeHtml = `<div class="bars">${bars}</div>
  ${mast({ x: 64, y: 84, style: ";z-index:85" })}
  <div class="caps">${caps}</div><div class="flash"></div>`;

const extraCss = `
.scene{position:absolute;inset:0;overflow:hidden;display:none}
.kb,.push,.drift,.float{position:absolute;inset:0}
.aw{position:absolute;inset:0;z-index:30}
.abs>.aw:only-child,.col>.aw{position:relative;inset:auto}
.wd{display:inline-block}
.chip.on,.chip[data-tap].on{background:linear-gradient(135deg,${T.primary},${T.primaryDeep});border-color:transparent;color:#fff;box-shadow:0 10px 30px rgba(${R.primary},.45)}
.caps{position:absolute;left:60px;right:140px;top:1310px;z-index:70}
.cap{position:absolute;left:0;right:0;top:0;display:none;flex-direction:column;align-items:center;gap:14px}
.cap .spk{display:flex;align-items:center;gap:12px;padding:7px 20px 7px 8px;border-radius:999px;background:rgba(${R.ink},.78);border:1.5px solid rgba(255,255,255,.16);font-size:26px;font-weight:800}
.cap .spk img{width:48px;height:48px;border-radius:50%;border:2px solid ${P};object-fit:cover}
.cap .spk span{color:rgba(255,255,255,.62);font-weight:500;font-size:22px}
.cap .spk .wave{height:30px;gap:4px}.cap .spk .wave i{width:5px}
.cap .ln{text-align:center;font-weight:900;font-size:62px;line-height:1.3;text-wrap:balance;max-width:880px;text-shadow:0 4px 0 rgba(0,0,0,.35),0 6px 30px rgba(0,0,0,.9)}
.cap .w{display:inline-block;padding:2px 12px 0;border-radius:16px;color:rgba(255,255,255,.45)}
.cap .w.said{color:#fff}
.cap .w.now{color:#fff;background:${P};box-shadow:0 10px 30px rgba(${R.primary},.55);text-shadow:none}
.bars{position:absolute;left:40px;right:40px;top:36px;display:flex;gap:8px;z-index:85;direction:ltr}
.bars i{flex:1;height:6px;border-radius:6px;background:rgba(255,255,255,.25);overflow:hidden;display:block}
.bars i b{display:block;height:100%;width:0;background:#fff}
.flash{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;opacity:0;z-index:84;
  background:radial-gradient(70% 45% at 85% 30%,rgba(${R.primary},.95),transparent 70%),radial-gradient(60% 40% at 10% 70%,rgba(${R.accent},.8),transparent 70%)}
`;

const script = `
const TOTAL=${TOTAL};
const cl=x=>Math.min(1,Math.max(0,x)), eo=x=>1-Math.pow(1-cl(x),3), eb=x=>{x=cl(x);const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
// damped spring (zeta .42, omega 13 over the animation's duration): overshoots ~20% once, then settles
const spr=x=>{x=cl(x);if(x>=1)return 1;const w=13,z=.42,wd=w*Math.sqrt(1-z*z);return 1-Math.exp(-z*w*x)*(Math.cos(wd*x)+z*w/wd*Math.sin(wd*x))};
const SPRING=${MOTION === "spring" || MOTION === "auto"}, E=SPRING?spr:eo, EB=SPRING?spr:eb, CE=${MOTION === "spring"}?spr:eo;
const FX=new Set(${JSON.stringify(FX)});
const scenes=[...document.querySelectorAll('.scene')], anims=[...document.querySelectorAll('[data-a]')], taps=[...document.querySelectorAll('[data-tap]')];
const capEls=[...document.querySelectorAll('.cap')], flash=document.querySelector('.flash'), barEls=[...document.querySelectorAll('.bars i')];
const bounds=scenes.slice(1).filter(s=>s.dataset.tr==='whip'||s.dataset.tr==='zoom').map(s=>+s.dataset.t0);
function noise(t,s){return Math.sin(t*1.7+s)*.6+Math.sin(t*3.1+s*2)*.3+Math.sin(t*7.3+s*3)*.1}
// ---- optional effects (FX), prepared once ----
// start time of an element = its own/closest animation start, else its scene start + lag
const startOf=(e,lag)=>{const a=e.closest('[data-a]');if(a)return +a.dataset.t+(+a.dataset.d)*0.4;const sc=e.closest('.scene');return (sc?+sc.dataset.t0:0)+lag;};
// impact: slams and pins shake their scene for a moment
scenes.forEach(sc=>{sc._hits=FX.has('impact')?[...sc.querySelectorAll('[data-a=slam],[data-a=pin]')].map(a=>+a.dataset.t+(+a.dataset.d)*0.25):[];});
// sweep: highlight blocks paint in from the reading side instead of appearing whole
const sweeps=FX.has('sweep')?[...document.querySelectorAll('.scene .hl,.scene .hlc')].map(e=>{const c=getComputedStyle(e).backgroundColor;e.style.backgroundColor='transparent';
  e.style.backgroundImage='linear-gradient('+c+','+c+')';e.style.backgroundRepeat='no-repeat';e.style.backgroundPosition=(document.dir==='rtl'?'right':'left')+' center';return [e,startOf(e,0.35)];}):[];
// count: numbers in headlines, stickers, callouts and chips count up (years like 2011 stay as they are)
const counts=[];
if(FX.has('count'))document.querySelectorAll('.scene .h,.scene .stk,.scene .co b,.scene .tchip').forEach(root=>{
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
  nodes.forEach(n=>{if(!/\d/.test(n.nodeValue))return;const fr=document.createElement('span');
    fr.innerHTML=n.nodeValue.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\d+(?:\.\d+)?/g,m=>{const v=+m;if(Number.isInteger(v)&&v>=1900&&v<=2100)return m;
      return '<span class="cnt" data-v="'+m+'" data-dec="'+((m.split('.')[1]||'').length)+'">'+m+'</span>';});
    n.replaceWith(...fr.childNodes);});
  root.querySelectorAll('.cnt').forEach(c=>{c.style.fontVariantNumeric='tabular-nums';counts.push([c,startOf(c,0.2)]);});});
// glare: a light sheen passes once across every phone and UI card
const glares=FX.has('glare')?[...document.querySelectorAll('.scene .phone .scr,.scene .ui')].map(e=>{const g=document.createElement('i');
  g.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:4;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.3) 50%,transparent 65%)';
  e.appendChild(g);return [g,startOf(e,0)+0.5];}):[];
window.renderAt=(t)=>{
  const last=scenes.length-1, ei=x=>{x=cl(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
  scenes.forEach((el,i)=>{const t0=+el.dataset.t0,t1=+el.dataset.t1;
    // the transition into a scene is set on that scene; Din = its length, Dout = the next scene's
    const nx=scenes[i+1], trIn=el.dataset.tr, trOut=nx?nx.dataset.tr:'', Din=+el.dataset.td, Dout=nx?+nx.dataset.td:0;
    const vis=t>=t0-(i?Din/2:0)&&t<t1+(i<last?Dout/2:0); el.style.display=vis?'block':'none'; if(!vis)return;
    let x=0,bl=0,sc=1,op=1,ty=0,gl=0,clip='';
    if(i>0&&t<t0+Din/2){const k=(t-(t0-Din/2))/Din;
      // whip-pan push: outgoing and incoming move together (no black gap), motion-blurred mid-move
      if(trIn==='whip'){x=-(1-ei(k))*1080;bl=Math.sin(Math.PI*cl(k))*20;}
      else if(trIn==='slide')x=-(1-ei(k))*1080;
      else if(trIn==='fade')op=ei(k);
      else if(trIn==='zoom'){op=ei(k);sc=1.14-0.14*ei(k);bl=(1-cl(k))*8;}
      else if(trIn==='cut')op=k<.5?0:1;
      else if(trIn==='wipe'){const a=100-ei(k)*130;clip='polygon('+a+'% 0,100% 0,100% 100%,'+(a+30)+'% 100%)';}
      else if(trIn==='iris')clip='circle('+(ei(k)*90)+'% at 50% 42%)';
      else if(trIn==='rise')ty=(1-ei(k))*1920;
      else if(trIn==='blur'){op=ei(k);bl=(1-cl(k))*24;}
      else if(trIn==='glitch'){op=k<.5?0:1;gl=Math.sin(Math.PI*cl(k));}}
    if(i<last&&t>t1-Dout/2){const k=(t-(t1-Dout/2))/Dout;
      if(trOut==='whip'){x=ei(k)*1080;bl=Math.sin(Math.PI*cl(k))*20;}
      else if(trOut==='slide')x=ei(k)*1080;
      else if(trOut==='zoom'){sc=1+0.08*ei(k);}
      else if(trOut==='rise')ty=-ei(k)*1920;
      else if(trOut==='blur')bl=cl(k)*24;
      else if(trOut==='glitch')gl=Math.sin(Math.PI*cl(k));}
    if(gl>0.01)x+=Math.sin(t*173.3+i)*Math.cos(t*311.7)*44*gl;
    let amp=0; el._hits.forEach(h=>{if(t>=h)amp+=Math.exp(-(t-h)*14)*14;}); if(amp>0.2){x+=Math.sin(t*90)*amp;ty+=Math.cos(t*77)*amp*0.6;}
    el.style.transform='translateX('+x+'px)'+(ty?' translateY('+ty+'px)':'')+(sc!==1?' scale('+sc+')':'');
    el.style.filter=gl>0.01?(bl>0.3?'blur('+bl+'px) ':'')+'drop-shadow('+(10*gl)+'px 0 0 rgba(255,0,90,.75)) drop-shadow('+(-10*gl)+'px 0 0 rgba(0,240,255,.75))':bl>0.3?'blur('+bl+'px)':'none'; el.style.zIndex=i+1;
    el.style.opacity=op<1?op:''; el.style.clipPath=clip;
    const p=(t-t0)/(t1-t0);
    el.querySelectorAll('.kb').forEach(k=>{k.style.transform='scale('+(1.05+0.08*p)+') translate('+(noise(t,i)*6)+'px,'+(-p*26)+'px)';});
    el.querySelectorAll('.push').forEach(c=>{const punch=c.dataset.punch?(1+0.07*(1-eo(t/0.6))):1;
      c.style.transformOrigin='35% 40%';c.style.transform='translate('+(noise(t*1.2,i+2)*9-p*14)+'px,'+(noise(t,i+5)*6)+'px) scale('+(punch*(1+0.06*p))+') rotate('+(noise(t*.8,i)*0.6)+'deg)';});
    el.querySelectorAll('.drift').forEach(d=>{const a=+d.dataset.amp;d.style.transform='translate('+(Math.sin(t*.8+i)*a)+'px,'+(Math.cos(t*.6+i)*a)+'px)';
      if(FX.has('beat'))d.style.opacity=0.72+0.28*Math.exp(-(t%0.5)*7);});
    el.querySelectorAll('.float').forEach(f=>{f.style.transform='translateY('+(Math.sin(t*2.2)*12)+'px)';});
  });
  anims.forEach(el=>{const a=el.dataset.a,t0=+el.dataset.t,d=+el.dataset.d;const k=(t-t0)/d;let o=1,tr='';const e=E(k);
    if(a==='up'){o=cl(e);tr='translateY('+((1-e)*60)+'px)';}
    else if(a==='fade'){o=cl(e);}
    else if(a==='word'){o=cl(k*2.2);tr='translateY('+((1-EB(k))*50)+'px) scale('+(1+0.12*(1-E(k)))+')';}
    else if(a==='slam'){o=cl(k*3);tr='scale('+(1+0.6*(1-EB(k)))+')';}
    else if(a==='pop'){o=cl(k*3);tr='scale('+(0.4+0.6*EB(k))+')';}
    else if(a==='pin'){o=cl(k*3);tr='scale('+(0.3+0.7*EB(k))*(1+0.08*Math.sin(Math.max(0,t-t0)*6))+')';}
    else if(a==='right'){o=cl(k*2);tr='translateX('+((1-e)*-260)+'px)';}
    else if(a==='left'){o=cl(k*2);tr='translateX('+((1-e)*260)+'px)';}
    else if(a==='rise'){o=cl(k*2);tr='translateY('+((1-e)*420)+'px) rotate('+((1-e)*-6)+'deg)';}
    else if(a==='drop'){o=cl(k*2);tr='translateY('+(-(1-EB(k))*200)+'px) rotate('+((1-e)*10)+'deg)';}
    el.style.opacity=o; el.style.transform=tr;});
  taps.forEach(el=>{const tt=+el.dataset.tap;const on=t>=tt;el.classList.toggle('on',on);
    el.style.transform=on?'scale('+(1+0.12*Math.exp(-(t-tt)*7)*Math.cos((t-tt)*14))+')':'none';});
  capEls.forEach(c=>{const s=+c.dataset.s,e=+c.dataset.e;const vis=t>=s&&t<e;c.style.display=vis?'flex':'none';if(!vis)return;
    c.style.opacity=cl((t-s)/0.15)*cl((e-t)/0.15); c.style.transform='translateY('+((1-CE((t-s)/0.25))*24)+'px)';
    const lns=[...c.querySelectorAll('.ln')];let act=0;lns.forEach((l,j)=>{if(t>=+l.querySelector('.w').dataset.s-0.15)act=j;});
    lns.forEach((l,j)=>{l.style.display=j===act?'block':'none';});
    let speaking=false;
    c.querySelectorAll('.w').forEach(w=>{const s=+w.dataset.s,e=+w.dataset.e;w.classList.toggle('said',t>=e);const now=t>=s&&t<e;w.classList.toggle('now',now);if(now)speaking=true;
      w.style.transform=now?'scale('+(1+0.08*Math.exp(-(t-s)*10))+')':'none';});
    c.querySelectorAll('.wave i').forEach((b,j)=>{b.style.height=(speaking?(8+22*Math.abs(Math.sin(t*9+j*1.7)*Math.sin(t*4.3+j))):6)+'px';});
  });
  let f=0; bounds.forEach(b=>{f=Math.max(f,Math.exp(-Math.pow((t-b)/0.07,2))*0.35)}); flash.style.opacity=f;
  barEls.forEach(b=>{const t0=+b.dataset.t0,t1=+b.dataset.t1;b.firstChild.style.width=(cl((t-t0)/(t1-t0))*100)+'%';});
  document.querySelectorAll('.pulse').forEach(p=>{const s=1+0.035*Math.max(0,Math.sin(t*6));p.style.transform='scale('+s+')';p.style.boxShadow='0 24px 70px rgba(${R.primary},'+(0.45+0.3*Math.max(0,Math.sin(t*6)))+'),inset 0 2px 0 rgba(255,255,255,.35)'});
  sweeps.forEach(([e,st])=>{e.style.backgroundSize=(eo((t-st)/0.35)*100)+'% 100%';});
  counts.forEach(([c,st])=>{const v=+c.dataset.v,dec=+c.dataset.dec,k=eo((t-st)/0.7);c.textContent=dec?(v*k).toFixed(dec):String(Math.round(v*k));});
  glares.forEach(([g,st])=>{g.style.transform='translateX('+(-130+260*eo((t-st)/0.9))+'%)';});
  drawWires();
};
document.fonts.ready.then(()=>{document.body.dataset.ready=1});`;

const html = page(WD, HT, scenesHtml + chromeHtml, extraCss, script);
truthGate(html, `${spec.id} video`);
fs.writeFileSync(`${BUILD}/video.html`, html);

const FR = PREVIEW ? `${BUILD}/preview_frames` : `${BUILD}/frames`, NF = Math.round(TOTAL * FPS);
if (!MIX_ONLY) {
const browser = await chromium.launch({ executablePath: CHROME });
const openPage = async (scale = SCALE) => {
  const pg = await browser.newPage({ viewport: { width: WD, height: HT }, deviceScaleFactor: scale });
  await pg.goto(`file://${BUILD}/video.html`, { waitUntil: "load" });
  await pg.waitForSelector("body[data-ready]");
  await pg.waitForTimeout(300);
  return pg;
};
const pg = await openPage();
if (SNAP) {
  for (const ts of SNAP.split(",")) { await pg.evaluate(t => window.renderAt(t), +ts); await pg.screenshot({ path: `${BUILD}/snap_${ts}.jpg`, type: "jpeg", quality: 85 }); }
  await browser.close(); console.log("snapshots in", BUILD); process.exit(0);
}
if (TIMELINE) { await timeline(browser); await browser.close(); process.exit(0); }
// FRAMES=a-b re-renders only that frame range into the existing build/frames
const [F0, F1] = process.env.FRAMES ? process.env.FRAMES.split("-").map(Number) : [0, NF - 1];
if (!process.env.FRAMES) { fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true }); }
// renderAt(t) sets every element from t alone, so frames can be split across pages in any order
const pages = [pg, ...await Promise.all(Array.from({ length: WORKERS - 1 }, () => openPage()))];
const n = F1 - F0 + 1, per = Math.ceil(n / pages.length);
// a page that starts mid-video first plays the 12 frames before its range (shots discarded): Chromium's blur/backdrop
// caching depends on the previous frames, and this makes a chunk match a straight run of the whole video
await Promise.all(pages.map(async (p, w) => {
  const s0 = F0 + w * per;
  for (let f = Math.max(0, s0 - 12); f < s0; f++) { await p.evaluate(t => window.renderAt(t), f / FPS); await p.screenshot({ type: "jpeg", quality: 92 }); }
  for (let f = F0 + w * per; f <= Math.min(F1, F0 + (w + 1) * per - 1); f++) {
    await p.evaluate(t => window.renderAt(t), f / FPS);
    await p.screenshot({ path: `${FR}/f${String(f).padStart(5, "0")}.jpg`, type: "jpeg", quality: 92 });
    if (f % 150 === 0) console.log("frame", f, "/", NF);
  }
}));
await browser.close();
}

// ---------- 4+5. music + mix ----------
const cuts = spec.scenes.slice(1).map(s => s.t0).join(",");
const ducks = clips.map(c => `${(c.at).toFixed(2)}-${(c.at + c.len).toFixed(2)}`).join(",");
if (MUSIC) execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", MUSIC, "-t", String(TOTAL), "-ar", "48000", "-ac", "2", `${BUILD}/music.wav`]);
else execFileSync("python3", ["-I", `${ROOT}/scripts/src/music.py`, `${BUILD}/music.wav`, String(TOTAL), cuts, ducks], { stdio: "inherit" });
const inputs = clips.flatMap(c => ["-i", c.file]);
const vf = clips.map((c, k) => `[${k + 1}]atrim=0:${c.len}${c.trim ? `,afade=t=out:st=${(c.len - 0.12).toFixed(2)}:d=0.12` : ""},aresample=48000,adelay=${Math.round(c.at * 1000)}:all=1[a${k}]`).join(";");
const mi = clips.length + 1;
const filter = `${vf};${clips.map((_, k) => `[a${k}]`).join("")}amix=inputs=${clips.length}:normalize=0:duration=longest,apad=whole_dur=${TOTAL},atrim=0:${TOTAL},highpass=f=80,acompressor=threshold=0.1:ratio=3:attack=5:release=120,volume=1.7[voice];` +
  (MUSIC ? `[voice]asplit=2[vo][key];[${mi}]aresample=48000,volume=0.5[m0];[m0][key]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=350,afade=t=out:st=${TOTAL - 1}:d=1[mus];`
         : `[${mi}]aresample=48000,volume=0.55,afade=t=out:st=${TOTAL - 1}:d=1[mus];`) + `[${MUSIC ? "vo" : "voice"}][mus]amix=inputs=2:normalize=0:duration=first,aformat=channel_layouts=stereo,loudnorm=I=-14:TP=-1.5:LRA=9[aout]`;
fs.mkdirSync(`${OUT}/video`, { recursive: true });
const MP4 = `${OUT}/video/${PREVIEW ? "preview" : "main"}.mp4`;
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", String(FPS), "-i", `${FR}/f%05d.jpg`, ...inputs, "-i", `${BUILD}/music.wav`,
  "-filter_complex", filter, "-map", "0:v", "-map", "[aout]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", PREVIEW ? "26" : "18", "-preset", PREVIEW ? "veryfast" : "medium", "-profile:v", "high",
  "-r", String(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", String(TOTAL), "-movflags", "+faststart", MP4], { stdio: "inherit" });
fs.writeFileSync(`${BUILD}/clips.json`, JSON.stringify(clips.map(c => ({ file: c.file, at: c.at, trim: c.trim || null, text: c.key, shown: c.shown, phrases: c.ph })), null, 1));
console.log("video ->", MP4);

// ---------- timeline: one still per scene with its time, transition and voice line ----------
// Flags a voice line that needs more than ~2.6 words/s for its window (it will sound rushed or overrun).
async function timeline(browser) {
  const shot = await browser.newPage({ viewport: { width: WD, height: HT }, deviceScaleFactor: 0.25 });
  await shot.goto(`file://${BUILD}/video.html`, { waitUntil: "load" }); await shot.waitForSelector("body[data-ready]"); await shot.waitForTimeout(300);
  const lines = VO ? VO.map(l => ({ at: l.at, text: l.text, sec: l.seconds })) : (spec.vo?.lines || []).map(l => ({ at: l.at, text: l.text }));
  const cards = [];
  for (const [i, s] of spec.scenes.entries()) {
    const tm = s.t0 + Math.min(1.6, (s.t1 - s.t0) * 0.7);
    await shot.evaluate(t => window.renderAt(t), tm);
    const img = (await shot.screenshot({ type: "jpeg", quality: 80 })).toString("base64");
    const l = lines.find(x => x.at >= s.t0 - 0.05 && x.at < s.t1);
    const next = lines.find(x => l && x.at > l.at)?.at ?? TOTAL, win = l ? next - l.at - 0.15 : 0;
    const words = l ? l.text.split(/\s+/).filter(Boolean).length : 0, wps = l ? words / win : 0;
    const warn = l && (wps > 2.6 || (l.sec && l.sec > win + 0.05));
    cards.push(`<div class="c"><img src="data:image/jpeg;base64,${img}"><div class="m"><b>${i + 1} · ${s.layout}</b><span>${s.t0.toFixed(1)}–${s.t1.toFixed(1)}s · ${i ? trOf(s) : "start"}</span></div>
      <div class="v ${warn ? "warn" : ""}">${l ? `${l.text}<small>${words} words · window ${win.toFixed(1)}s · ${wps.toFixed(1)} w/s${l.sec ? ` · voice ${l.sec.toFixed(1)}s` : ""}</small>` : "<small>no voice line</small>"}</div></div>`);
  }
  const W = Math.min(6, spec.scenes.length) * 290 + 40, TH = 90 + Math.ceil(spec.scenes.length / 6) * 700;
  const html = page(W, TH, `<div style="position:absolute;inset:0;padding:24px;overflow:hidden">
    <div style="font-weight:900;font-size:30px;margin-bottom:16px;direction:ltr">${spec.id} · ${TOTAL}s · ${spec.motion || "classic"} motion · ${spec.transition || "whip"}</div>
    <div class="g">${cards.join("")}</div></div>`, `
    .g{display:flex;flex-wrap:wrap;gap:20px;direction:ltr}.c{width:270px;direction:rtl}.c img{width:270px;height:480px;border-radius:14px;display:block}
    .m{display:flex;justify-content:space-between;font-size:16px;margin:8px 2px;color:#fff;direction:ltr}.m span{color:rgba(255,255,255,.6)}
    .v{font-size:19px;font-weight:700;line-height:1.4;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.07);min-height:100px}
    .v small{display:block;direction:ltr;text-align:left;font-size:14px;font-weight:500;color:rgba(255,255,255,.6);margin-top:6px}
    .v.warn{background:rgba(255,80,80,.25);outline:2px solid #ff5050}`, "document.fonts.ready.then(()=>{document.body.dataset.ready=1})");
  const f = `${BUILD}/timeline.html`; fs.writeFileSync(f, html);
  const p = await browser.newPage({ viewport: { width: W, height: TH } });
  await p.goto(`file://${f}`); await p.waitForSelector("body[data-ready]");
  fs.mkdirSync(`${OUT}/review`, { recursive: true });
  await p.screenshot({ path: `${OUT}/review/timeline.png`, fullPage: true });
  console.log("timeline ->", `${OUT}/review/timeline.png`);
}
