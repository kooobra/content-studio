// 9:16 video scene layouts. Each returns HTML for one <section class="scene">.
// Safe zone: scene content stays in y 200..1290, captions live in 1310..1530, nothing important below 1540,
// and nothing important right of x=960 below y=800 (TikTok/Reels right rail).
import { brand, requireApp } from "./brand.mjs";
import { AS, T, R, P, C, COACH, photo, shade, leaks, coach, phone, uiCut, callout, icon, waIcon } from "./lib.mjs";

// animation wrapper: type in up|fade|pop|drop|left|right|rise|slam|word, absolute start time t, duration d
const an = (type, t, d = 0.45, origin = "50% 50%") => `data-a="${type}" data-t="${t.toFixed(3)}" data-d="${d}" style="transform-origin:${origin}"`;
const W = (type, t, d, inner, origin) => `<div class="aw" ${an(type, t, d, origin)}>${inner}</div>`;
const kb = (inner) => `<div class="kb">${inner}</div>`;

// headline with word-by-word reveal (tokens keep <span ...>…</span> together; "<br>" breaks lines)
function words(html, t, step = 0.07, still = false) {
  // letters or punctuation glued to a highlighted word («و<span>تلف</span>», «<span>الجهاز</span>؟») stay one token
  const toks = html.match(/[^\s<]*<span[^>]*>.*?<\/span>[^\s<]*|<br>|[^\s<]+/g);
  let k = 0;
  return toks.map(tok => tok === "<br>" ? "<br>" : `<span class="wd" ${still ? "" : an("word", t + step * k++, 0.42, "50% 80%")}>${tok}</span>`).join(" ");
}
const H = (html, { t, fs = 120, top = 230, kick = "", still = false, right = 72, w = 936 }) => `
  <div class="abs" style="right:${right}px;top:${top}px;width:${w}px;text-align:right;z-index:50">
    ${kick ? `<div class="kick" style="font-size:34px;margin-bottom:26px" ${still ? "" : an("up", t, 0.35)}>${kick}</div>` : ""}
    <div class="h" style="font-size:${fs}px">${words(html, t + 0.06, 0.07, still)}</div></div>`;

const qcardV = ({ q, opts, x, y, w, fs = 32, rows = true, t0 }) => `
  <div class="qc glass" style="left:${x}px;top:${y}px;width:${w}px;font-size:${fs}px">
    <div class="tag">${brand.labels.surveyTag}</div><div class="q" style="font-size:${Math.round(fs * 1.1)}px">${q}</div>
    ${rows ? opts.map(([tx, on, tap]) => `<div class="row" ${tap != null ? `data-tap="${(t0 + tap).toFixed(3)}"` : ""}><span class="rd">${icon("check", 18, "#fff", 3.2)}</span>${tx}</div>`).join("")
      : `<div class="chips">${opts.map(([tx, on, tap]) => `<span class="chip" ${tap != null ? `data-tap="${(t0 + tap).toFixed(3)}"` : ""} style="font-size:${fs}px">${tx}</span>`).join("")}</div>`}
  </div>`;
const kickN = (n, label) => `<b class="pk" style="font-weight:900">${n}</b>&nbsp; ${label}`;
const DEF = () => brand.defaultCharacter;
// default kicker label of an app scene (brand.config → app.sceneLabels), "" when the brand has none
const SL = (k) => brand.app?.sceneLabels?.[k] || "";
const darkTB = shade(`linear-gradient(to bottom,rgba(${R.ink},.9) 0%,rgba(${R.ink},.35) 20%,rgba(${R.ink},.12) 42%,rgba(${R.ink},.45) 60%,rgba(${R.ink},.82) 70%,rgba(${R.ink},.72) 100%)`);

export const vscenes = {
  hook(d) {
    const t = d.t0;
    return `
    ${kb(photo(d.bg, { w: 1080, h: 1920, grade: "duo", pos: "50% 30%" }))}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.92) 0%,rgba(${R.ink},.35) 24%,rgba(${R.ink},.05) 50%,rgba(${R.ink},.55) 68%,rgba(${R.ink},.7) 100%)`)}
    <div class="drift" data-amp="40">${leaks([[900, 640, 1000, P, .6], [120, 940, 1000, C, .5], [540, 1500, 800, T.violet, .35]])}</div>
    <div class="push" data-punch="1">${coach(d.coach || DEF(), { x: -60, y: 600, w: 1200 })}</div>
    <div class="abs" style="left:0;right:0;top:1250px;bottom:0;background:linear-gradient(to bottom,rgba(${R.ink},0),rgba(${R.ink},.8) 300px);z-index:10"></div>
    ${H(d.h, { t, fs: 124, top: 220, kick: d.kick, still: true })}
    ${d.pops.map((p, k) => { const pos = [[60, 760, -6], [700, 700, 5], [40, 1010, 4], [720, 980, -5]][k];
      return `<div class="abs" style="left:${pos[0]}px;top:${pos[1]}px;z-index:40;transform:rotate(${pos[2]}deg)">${W("pop", t + 0.85 + k * 0.22, 0.4, `<div class="stk ${k % 2 ? "c" : "p"}" style="position:relative;font-size:46px">${p}</div>`)}</div>`; }).join("")}
`;
  },

  photoQuestion(d, i) {
    const t = d.t0;
    return `
    ${kb(photo(d.photo, { w: 1080, h: 1920, grade: "teal", pos: d.pos }))}
    ${darkTB}
    <div class="drift" data-amp="30">${leaks([[150, 1000, 900, P, .45], [980, 700, 700, C, .3]])}</div>
    ${H(d.h.join(" ").replace(d.h[0] + " ", d.h[0] + " <br>"), { t, fs: 132, kick: kickN(d.num, d.label || SL("photoQuestion")) })}
    <div class="abs" style="left:0;top:0;width:1080px;height:1920px">${W("right", t + 0.2, 0.5, qcardV({ ...d.card, x: 130, y: 760, w: 820, fs: 36, t0: t }))}</div>`;
  },

  phoneCallouts(d) {
    const t = d.t0;
    const anchors = Object.fromEntries(d.callouts.map((c, k) => ["a" + k, c.anc]));
    return `
    ${kb(photo(d.bg, { w: 1080, h: 1920, grade: "dark", pos: "50% 60%" }))}
    ${darkTB}
    <div class="drift" data-amp="30">${leaks([[760, 800, 900, P, .45], [140, 1100, 800, C, .35]])}</div>
    ${H(d.h.join(" "), { t, fs: 124, kick: kickN(d.num || "01", d.label || SL("phoneCallouts")) })}
    ${W("rise", t + 0.1, 0.55, phone(d.shot || requireApp("shots.default", "phoneCallouts"), { x: 520, y: 470, w: 400, id: "vp" + t, rot: "perspective(1800px) rotateY(-14deg) rotateZ(3deg)", anchors }))}
    ${d.callouts.map((c, k) => W("left", t + 0.55 + k * 0.35, 0.4, callout({ to: `vp${t}.a${k}`, x: 64, y: 600 + k * 230, w: 400, title: c.title, sub: c.sub, fs: 38, color: c.col }))).join("")}
    ${d.card ? W("up", t + 0.3, 0.45, qcardV({ ...d.card, x: 64, y: 990, w: 470, fs: 27, rows: false, t0: t })) : ""}`;
  },

  split(d) {
    const L0 = { ...requireApp("splitLabels", "split"), ...(d.labels || {}) }, swap = requireApp("shots.swap", "split");
    const t = d.t0, ph = 1300, mid = 540;
    const LCLIP = `polygon(0 0,${mid + 120}px 0,${mid - 120}px ${ph}px,0 ${ph}px)`, RCLIP = `polygon(${mid + 128}px 0,1080px 0,1080px ${ph}px,${mid - 112}px ${ph}px)`;
    return `
    <div class="kb"><div class="abs" style="inset:0 0 auto 0;height:${ph}px;clip-path:${RCLIP}">${photo(d.right, { w: 1080, h: ph, grade: "warm", pos: "45% 50%" })}</div>
    <div class="abs" style="inset:0 0 auto 0;height:${ph}px;clip-path:${LCLIP}">${photo(d.left, { w: 1080, h: ph, grade: "duo", pos: "50% 60%" })}</div></div>
    <svg class="abs" style="left:0;top:0;z-index:4" width="1080" height="${ph}"><line x1="${mid + 124}" y1="0" x2="${mid - 116}" y2="${ph}" stroke="${P}" stroke-width="8"/></svg>
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.9) 0%,rgba(${R.ink},.2) 22%,rgba(${R.ink},0) 40%,rgba(${R.ink},.35) 58%,${T.ink} 70%)`)}
    ${H(d.h, { t, fs: 106, kick: kickN(d.num, d.label || SL("split")) })}
    <div class="abs" style="left:${mid - 95}px;top:500px;z-index:45">${W("slam", t + 0.2, 0.45, `<div class="badge" style="position:relative;width:190px;height:190px;font-size:78px;transform:rotate(-8deg)">${L0.or}</div>`)}</div>
    <div class="abs" style="right:90px;top:520px;z-index:44;transform:rotate(3deg)">${W("pop", t + 0.35, 0.4, `<div class="stk w" style="position:relative;font-size:46px">${icon(L0.aIcon, 44, P, 2.6)}${L0.a}</div>`)}</div>
    <div class="abs" style="left:80px;top:540px;z-index:44;transform:rotate(-3deg)">${W("pop", t + 0.45, 0.4, `<div class="stk c" style="position:relative;font-size:46px">${icon(L0.bIcon, 44, T.ink, 2.6)}${L0.b}</div>`)}</div>
    ${W("up", t + 0.5, 0.45, qcardV({ ...d.card, x: 130, y: 820, w: 640, fs: 33, t0: t }))}
    ${W("pop", t + 1.5, 0.4, uiCut(swap, { x: 540, y: 1190, w: 400, rot: -3, style: `border-radius:22px;box-shadow:0 30px 70px rgba(0,0,0,.6),0 0 0 2px rgba(${R.accent},.5),0 0 50px rgba(${R.accent},.35)` }), "75% 60%")}`;
  },

  answers(d) {
    const t = d.t0;
    return `
    ${kb(photo(d.bg, { w: 1080, h: 1920, grade: "duo", pos: "50% 40%" }))}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.92) 0%,rgba(${R.ink},.3) 25%,rgba(${R.ink},.1) 50%,rgba(${R.ink},.6) 66%,rgba(${R.ink},.75) 100%)`)}
    <div class="drift" data-amp="40">${leaks([[300, 800, 1000, P, .55], [900, 1000, 800, C, .45]])}</div>
    <div class="push">${coach(d.coach || DEF(), { x: -400, y: 430, w: 1160 })}</div>
    <div class="abs" style="left:0;right:0;top:1200px;bottom:0;background:linear-gradient(to bottom,rgba(${R.ink},0),rgba(${R.ink},.85) 300px);z-index:10"></div>
    ${H(d.h, { t, fs: 124 })}
    <div class="abs col" style="right:130px;top:580px;width:560px;z-index:40;display:flex;flex-direction:column;align-items:flex-start;gap:22px">
      ${d.answers.map((a, k) => W("right", t + 0.2 + k * 0.22, 0.38, `<div class="stk ${k % 2 ? "w" : "p"}" style="position:relative;font-size:40px;box-shadow:0 18px 44px rgba(0,0,0,.55)">${icon("check", 36, k % 2 ? P : "#fff", 3)}${a}</div>`)).join("")}
    </div>
`;
  },

  bodyMap(d) {
    const t = d.t0, bx = 560, by = 500, bh = 600, bw = bh * 900 / 1350;
    return `
    ${kb(photo(d.bg, { w: 1080, h: 1920, grade: "dark", pos: "50% 60%" }))}
    ${darkTB}
    <div class="drift" data-amp="30">${leaks([[bx + bw / 2, by + bh / 2, 900, C, .45], [140, 1000, 800, P, .35]])}</div>
    ${H(d.h, { t, fs: 96, kick: kickN(d.num, d.label || SL("bodyMap")) })}
    ${W("fade", t + 0.15, 0.5, `<div class="abs" style="left:${bx}px;top:${by}px;width:${bw}px;height:${bh}px;z-index:20">
      <div class="abs" style="inset:10% -10% 0;border-radius:50%;background:radial-gradient(circle,rgba(${R.accent},.3),transparent 65%);filter:blur(10px)"></div>
      <img src="${requireApp("figure", "bodyMap")}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 24px rgba(${R.accent},.35))">
      <div class="aw" ${an("pin", t + 0.6, 0.5)}><div class="pin" style="left:${bw * 0.5}px;top:${bh * 0.4}px"></div></div><i class="anc" data-anc="bm${t}.back" style="left:50%;top:40%"></i>
      <div class="aw" ${an("pin", t + 1.0, 0.5)}><div class="pin cy" style="left:${bw * 0.36}px;top:${bh * 0.69}px"></div></div><i class="anc" data-anc="bm${t}.knee" style="left:36%;top:69%"></i></div>`)}
    ${W("left", t + 0.7, 0.4, callout({ to: `bm${t}.back`, x: 64, y: 680, w: 400, title: d.inj[0], fs: 34, color: "p" }))}
    ${W("left", t + 1.1, 0.4, callout({ to: `bm${t}.knee`, x: 64, y: 860, w: 400, title: d.inj[1], fs: 34 }))}
    ${W("up", t + 1.3, 0.4, `<div class="note" style="position:absolute;left:64px;top:1010px;font-size:28px;z-index:50">${icon("info", 32, C)}${d.disclaimer}</div>`)}
    ${W("up", t + 0.9, 0.45, qcardV({ ...d.card, x: 64, y: 1090, w: 886, fs: 30, rows: false, t0: t }))}`;
  },

  food(d) {
    const t = d.t0;
    return `
    ${kb(photo(d.photo, { w: 1080, h: 1920, grade: "warm", pos: "50% 45%", zoom: 1.05 }))}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.9) 0%,rgba(${R.ink},.15) 22%,rgba(${R.ink},.05) 40%,rgba(${R.ink},.7) 56%,rgba(${R.ink},.88) 68%,rgba(${R.ink},.8) 100%)`)}
    ${H(d.h, { t, fs: 104, kick: kickN(d.num, d.label || SL("food")) })}
    ${W("rise", t + 0.1, 0.5, phone(d.shot || requireApp("shots.meals", "food"), { x: 80, y: 500, w: 380, id: "fp" + t, rot: "perspective(1800px) rotateY(14deg) rotateZ(-3deg)", anchors: { ring: [0.88, 0.335] } }))}
    ${W("right", t + 0.5, 0.4, callout({ to: `fp${t}.ring`, x: 540, y: 470, w: 400, title: d.callout[0], sub: d.callout[1], fs: 38, color: "p" }))}
    ${W("drop", t + 0.3, 0.5, `<div class="polaroid" style="left:560px;top:690px;width:390px;transform:rotate(4deg)"><div class="im" style="height:220px;background-image:url('${AS("photos/" + d.polaroid)}');background-position:30% 50%"></div><div class="pcap" style="font-size:30px">${d.polaroidCap}</div></div>`)}
    ${W("up", t + 0.7, 0.45, `<div class="abs glass" style="left:64px;top:1030px;width:886px;border-radius:30px;padding:22px 24px;z-index:45">
      <div class="chips">${d.cuisines.map(([tx, x]) => x === "cy" ? `<span class="chip cy" style="font-size:30px">${icon("pen", 26, T.onAccent, 2.4)}${tx}</span>` : `<span class="chip" ${x != null ? `data-tap="${(t + x).toFixed(3)}"` : ""} style="font-size:30px">${tx}</span>`).join("")}</div>
      <div style="display:flex;align-items:center;gap:16px;margin-top:16px;font-weight:800;font-size:32px" ${an("up", t + 2.4, 0.4)}>
        <span style="flex:none;width:54px;height:54px;border-radius:16px;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px rgba(37,211,102,.45)">${waIcon(32)}</span><span>${d.whatsapp}</span></div></div>`)}`;
  },

  payoff(d) {
    const t = d.t0;
    return `
    ${kb(photo(d.bg, { w: 1080, h: 1920, grade: "dark", pos: "50% 50%" }))}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.92) 0%,rgba(${R.ink},.4) 25%,rgba(${R.ink},.35) 55%,rgba(${R.ink},.8) 75%,rgba(${R.ink},.7) 100%)`)}
    <div class="drift" data-amp="40">${leaks([[300, 900, 1000, C, .45], [820, 900, 1000, P, .55]])}</div>
    ${H(d.h, { t, fs: 124 })}
    ${W("rise", t + 0.1, 0.55, phone((d.phones || [])[0] || requireApp("shots.default", "payoff"), { x: 110, y: 560, w: 400, id: "pw" + t, rot: "perspective(1800px) rotateY(12deg) rotateZ(-7deg)" }))}
    ${W("rise", t + 0.25, 0.55, phone((d.phones || [])[1] || requireApp("shots.meals", "payoff"), { x: 530, y: 610, w: 400, id: "pm" + t, rot: "perspective(1800px) rotateY(-12deg) rotateZ(6deg)" }))}
    <div class="abs" style="left:70px;top:640px;z-index:60;transform:rotate(-6deg)">${W("pop", t + 0.7, 0.4, `<div class="stk w" style="position:relative;font-size:42px">${icon(d.stickerIcons?.[0] || "cal", 40, P, 2.6)}${d.stickers[0]}</div>`)}</div>
    <div class="abs" style="left:470px;top:1040px;z-index:60;transform:rotate(5deg)">${W("pop", t + 0.95, 0.4, `<div class="stk p" style="position:relative;font-size:42px">${icon(d.stickerIcons?.[1] || "plate", 40, "#fff", 2.6)}${d.stickers[1]}</div>`)}</div>
    ${d.time ? `<div class="abs" style="left:64px;right:130px;top:1330px;z-index:60;display:flex;justify-content:center">${W("up", t + 1.3, 0.45, `<div class="tchip" style="position:relative;font-size:40px;padding:20px 34px 16px;background:rgba(${R.ink},.85)">${icon(d.timeIcon || "clock", 40, C)}${d.time}</div>`)}</div>` : ""}`;
  },

  // cta: the brand's closing scene (words from brand.config → cta, overridable per spec with d.mega / d.button)
  cta(d) {
    const t = d.t0, shot = d.shot || brand.app?.shots?.default;
    return `
    ${kb(photo(d.bg, { w: 1080, h: 1920, grade: "dark", pos: "50% 50%" }))}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.95) 0%,rgba(${R.ink},.45) 22%,rgba(${R.ink},.3) 36%,rgba(${R.ink},.9) 55%,rgba(${R.ink},.75) 100%)`)}
    <div class="drift" data-amp="40">${leaks([[860, 640, 1000, P, .6], [150, 820, 900, C, .45]])}</div>
    ${shot ? `<div class="float">${W("left", t + 0.05, 0.5, phone(shot, { x: 64, y: 330, w: 280, id: "cp" + t, rot: "perspective(1800px) rotateY(18deg) rotateZ(-5deg)", cls: "refl" }))}</div>` : ""}
    <div class="push">${coach(d.coach || DEF(), { x: 440, y: 400, w: 600 })}</div>
    <div class="abs" style="left:0;right:0;top:880px;bottom:0;background:linear-gradient(to bottom,rgba(${R.ink},0),rgba(${R.ink},.92) 160px,rgba(${R.ink},.8) 100%);z-index:30"></div>
    ${H(d.h, { t, fs: 84, kick: d.kick, top: 210 })}
    <div class="abs" style="right:130px;left:64px;top:735px;z-index:50;text-align:right">
      <div class="mega" style="font-size:210px" ${an("slam", t + 0.25, 0.5)}>${d.mega ?? brand.cta.mega}</div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:-6px">${d.chips.map(([ic, tx], k) => `<span class="tchip" style="font-size:28px" ${an("pop", t + 0.6 + k * 0.15, 0.35)}>${icon(ic, 28, C)}${tx}</span>`).join("")}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:22px" ${an("up", t + 1.0, 0.4)}>
        <div class="cta-btn pulse" style="font-size:52px;padding:22px 52px 16px">${d.button ?? brand.cta.button} ${icon("arrow", 46, T.onPrimary, 2.8)}</div>
        <div class="url" style="font-size:44px">${brand.url}</div></div>
      <div style="display:flex;align-items:center;gap:14px;margin-top:18px" ${an("fade", t + 1.3, 0.4)}>
        <div style="display:flex;direction:ltr">${brand.cast.filter(k => COACH[k]).map((k, j) => `<img src="${COACH[k].av}" style="width:48px;height:48px;border-radius:50%;border:3px solid ${T.ink};margin-left:${j ? -14 : 0}px;object-fit:cover">`).join("")}</div>
        <div class="fine" style="font-size:24px;color:#fff">${d.coachesNote || ""}</div></div>
      <div class="fine" style="font-size:24px;margin-top:6px;line-height:1.35" ${an("fade", t + 1.4, 0.4)}>${d.fine}</div>
    </div>`;
  },

  // ---- generic scenes (added for the content calendar) ----
  // statement: one big idea over a graded photo. d: bg, grade?, pos?, kick?, h, fs?, coach?, stickers?: [{tx, icon?, col: p|c|w|k, x, y, rot}]
  statement(d) {
    const t = d.t0;
    return `
    ${kb(photo(d.bg, { w: 1080, h: 1920, grade: d.grade || "duo", pos: d.pos || "50% 45%" }))}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.9) 0%,rgba(${R.ink},.4) 26%,rgba(${R.ink},.15) 48%,rgba(${R.ink},.6) 66%,rgba(${R.ink},.78) 100%)`)}
    <div class="drift" data-amp="40">${leaks([[880, 700, 1000, P, .5], [140, 1000, 900, C, .45]])}</div>
    ${d.coach ? `<div class="push">${coach(d.coach, { x: d.coachX ?? 260, y: 560, w: 1000 })}</div><div class="abs" style="left:0;right:0;top:1240px;bottom:0;background:linear-gradient(to bottom,rgba(${R.ink},0),rgba(${R.ink},.85) 260px);z-index:10"></div>` : ""}
    ${H(d.h, { t, fs: d.fs || 128, kick: d.kick || "", top: 230 })}
    ${(d.stickers || []).map((s, k) => `<div class="abs" style="left:${s.x}px;top:${s.y}px;z-index:44;transform:rotate(${s.rot || 0}deg)">${W("pop", t + 0.6 + k * 0.25, 0.4, `<div class="stk ${s.col || "w"}" style="position:relative;font-size:${s.fs || 44}px">${s.icon ? icon(s.icon, (s.fs || 44) - 2, s.col === "w" ? P : s.col === "c" ? T.ink : s.col === "p" ? T.onPrimary : "#fff", 2.6) : ""}${s.tx}</div>`)}</div>`).join("")}`;
  },

  // phoneHero: a real app screen as the hero. d: bg, num?, label?, h, shot, w?, callouts: [{anc:[fx,fy], title, sub?, col}], chip?: {icon, tx}
  phoneHero(d) {
    const t = d.t0, id = "ph" + String(t).replace(".", "_"), w = d.w || 390;
    const anchors = Object.fromEntries((d.callouts || []).map((c, k) => ["a" + k, c.anc]));
    return `
    ${kb(photo(d.bg, { w: 1080, h: 1920, grade: d.grade || "dark", pos: d.pos || "50% 55%" }))}
    ${darkTB}
    <div class="drift" data-amp="30">${leaks([[780, 860, 900, P, .45], [160, 1100, 800, C, .38]])}</div>
    ${H(d.h, { t, fs: d.fs || 104, kick: d.label ? kickN(d.num || "", d.label) : "" })}
    ${W("rise", t + 0.1, 0.55, phone(d.shot, { x: 1000 - w - 40, y: d.y || 540, w, id, rot: "perspective(1800px) rotateY(-14deg) rotateZ(3deg)", anchors }))}
    ${(d.callouts || []).map((c, k) => W("left", t + 0.55 + k * 0.4, 0.4, callout({ to: `${id}.a${k}`, x: 64, y: (d.cy || 640) + k * 220, w: 400, title: c.title, sub: c.sub || "", fs: 36, color: c.col || (k % 2 ? "c" : "p") }))).join("")}
    ${d.chip ? `<div class="abs" style="left:64px;top:${(d.cy || 640) + (d.callouts || []).length * 220 + 10}px;z-index:50">${W("up", t + 0.6 + (d.callouts || []).length * 0.4, 0.4, `<div class="note" style="position:relative;font-size:28px">${icon(d.chip.icon || "info", 30, C)}${d.chip.tx}</div>`)}</div>` : ""}`;
  },

  // checklist: rows that tick in one by one. d: bg, kick?, h, rows: [[icon, text, tag, tone p|c|w]], coach?
  checklist(d) {
    const t = d.t0;
    return `
    ${kb(photo(d.bg, { w: 1080, h: 1920, grade: d.grade || "dark", pos: d.pos || "50% 50%" }))}
    ${darkTB}
    <div class="drift" data-amp="30">${leaks([[900, 800, 900, P, .45], [120, 1150, 800, C, .4]])}</div>
    ${H(d.h, { t, fs: d.fs || 104, kick: d.kick || "" })}
    <div class="abs glass" style="left:64px;top:${d.top || 600}px;width:880px;border-radius:34px;padding:18px 30px;z-index:45">
      ${d.rows.map(([ic, tx, tag, tone], k) => `<div ${an("right", t + 0.35 + k * 0.32, 0.38)}><div style="display:flex;align-items:center;gap:20px;padding:20px 0;${k ? "border-top:1.5px solid rgba(255,255,255,.1);" : ""}">
        <span style="flex:none;width:76px;height:76px;border-radius:20px;display:flex;align-items:center;justify-content:center;background:${tone === "c" ? `rgba(${R.accent},.16)` : tone === "w" ? "rgba(255,255,255,.1)" : `rgba(${R.primary},.18)`}">${icon(ic, 42, tone === "c" ? C : tone === "w" ? "#fff" : P, 2.4)}</span>
        <span style="flex:1;font-weight:800;font-size:${d.rowFs || 44}px;line-height:1.25">${tx}</span>
        ${tag ? `<span class="stk ${tone === "c" ? "c" : tone === "w" ? "k" : "p"}" style="position:relative;font-size:30px;padding:11px 22px 8px;box-shadow:none">${tag}</span>` : ""}</div></div>`).join("")}
    </div>`;
  },

  // ask: closing scene for non-CTA videos (comment / save prompt). d: bg, coach?, h, prompt: {icon, tx}
  ask(d) {
    const t = d.t0;
    return `
    ${kb(photo(d.bg, { w: 1080, h: 1920, grade: d.grade || "duo", pos: d.pos || "50% 40%" }))}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.92) 0%,rgba(${R.ink},.35) 26%,rgba(${R.ink},.15) 50%,rgba(${R.ink},.65) 66%,rgba(${R.ink},.8) 100%)`)}
    <div class="drift" data-amp="40">${leaks([[300, 820, 1000, P, .55], [900, 1000, 800, C, .45]])}</div>
    <div class="push">${coach(d.coach || DEF(), { x: 380, y: 560, w: 900 })}</div>
    <div class="abs" style="left:0;right:0;top:1200px;bottom:0;background:linear-gradient(to bottom,rgba(${R.ink},0),rgba(${R.ink},.88) 280px);z-index:10"></div>
    ${H(d.h, { t, fs: d.fs || 112 })}
    <div class="abs" style="left:64px;top:${d.py || 760}px;z-index:46;transform:rotate(-4deg)">${W("slam", t + 0.5, 0.45, `<div class="stk p" style="position:relative;font-size:50px;padding:20px 36px 15px">${icon(d.prompt.icon || "pen", 48, "#fff", 2.6)}${d.prompt.tx}</div>`)}</div>
    <div class="abs" style="left:64px;top:${(d.py || 760) + 150}px;z-index:46">${W("up", t + 0.9, 0.4, `<div class="tchip" style="position:relative;font-size:34px">${icon("arrow", 32, C)}<span style="direction:ltr">${brand.url}</span></div>`)}</div>`;
  },
};
