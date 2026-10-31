// Carousel slide layouts. Each takes (d = slide data from a spec, ctx = {S, W, H, i, n}) and returns HTML.
// Six distinct compositions so the carousel never looks templated:
//   cover (3 coaches), photoHero (full-bleed photo + survey cards), split (home|gym diagonal),
//   coachBody (coach cameo + body map), food (photo + polaroid + phone callout), cta (character + 3D phone + the brand's mega word)
import { brand, requireApp } from "./brand.mjs";
import { AS, T, R, P, C, COACH, photo, shade, leaks, coach, phone, uiCut, callout, qcard, icon, waIcon, voiceNote, mast, folio } from "./lib.mjs";

const chrome = ({ S, i, n }) => `<div class="frame"></div>${mast({ y: S ? 150 : 62 })}${folio(i + 1, n, { y: S ? 170 : 82 })}`;
const head = ({ kick, kc = "", h, fs, sub = "", subFs = 34, x = 72, y, w = 936, align = "right", style = "" }) => `
  <div class="abs" style="right:${x}px;top:${y}px;width:${w}px;text-align:${align};z-index:50;${style}">
    ${kick ? `<div class="kick ${kc}" style="font-size:${Math.round(fs * 0.3)}px;margin-bottom:${Math.round(fs * 0.3)}px">${kick}</div>` : ""}
    <div class="h" style="font-size:${fs}px">${h}</div>
    ${sub ? `<div class="sub" style="font-size:${subFs}px;margin-top:${Math.round(subFs * 0.55)}px">${sub}</div>` : ""}
  </div>`;
const quoteBox = (d, S) => d.quote ? `<div class="abs" style="right:56px;top:${S ? 1630 : 1158}px;z-index:50">${voiceNote(brand.defaultCharacter, d.quote, S ? { w: 968, fs: 30, av: 88 } : { w: 968, fs: 26, av: 70 })}</div>` : "";
const disclaimer = (t, fs) => `<span class="note" style="font-size:${fs}px">${icon("info", fs + 4, C)}${t}</span>`;

export const layouts = {
  cover(d, { S, H }) {
    const k = S ? 1.18 : 1;
    const cy = S ? 760 : 560;
    // the cast (brand.config → characters.cast): first one in the middle, second on the left, third on the right
    const [lead1, lead2, lead3] = brand.cast;
    return `
    ${photo(d.bg, { w: 1080, h: H, grade: "duo", pos: d.bgPos || "50% 40%" })}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.94) 0%,rgba(${R.ink},.55) ${S ? 26 : 32}%,rgba(${R.ink},.15) 55%,rgba(${R.ink},.2) 70%,${T.ink} ${S ? 94 : 96}%)`)}
    ${leaks([[900, cy + 120, 900, P, .55], [140, cy + 300, 900, C, .45], [540, cy + 700, 700, T.violet, .35]])}
    ${coach(lead2, { x: -150 * k, y: cy + 30, w: 640 * k, style: "filter:brightness(.72) saturate(.9)" })}
    ${coach(lead3, { x: 1080 - 600 * k + 110, y: cy + 50, w: 620 * k, style: "filter:brightness(.72) saturate(.9)" })}
    ${coach(lead1, { x: 540 - 380 * k, y: cy + 50, w: 760 * k })}
    <div class="abs" style="left:0;right:0;bottom:0;height:${S ? 520 : 330}px;background:linear-gradient(to top,${T.ink} ${S ? 45 : 30}%,rgba(${R.ink},0))"></div>
    ${[[lead2, 70, cy + 150 * k], [lead1, 470, cy + 70 * k], [lead3, 870, cy + 170 * k]].filter(([c]) => COACH[c]).map(([c, x, y]) => [COACH[c].name, x, y]).map(([t, x, y]) => `<div class="nametag" style="left:${x}px;top:${y}px;font-size:${S ? 30 : 26}px">${t}</div>`).join("")}
    ${head({ kick: d.kick, h: d.h, fs: S ? 128 : 124, y: S ? 300 : 160 })}
    <div class="abs" style="left:72px;right:72px;top:${S ? 1560 : H - 230}px;z-index:50">
      <div class="sub" style="font-size:${S ? 30 : 26}px;color:rgba(255,255,255,.72);margin-bottom:${S ? 18 : 14}px">${d.coachesLine || ""}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:20px">
        <div style="display:flex;flex-wrap:wrap;gap:10px 26px;font-weight:800;font-size:${S ? 32 : 28}px">${d.topics.map((t, j) => `<span style="display:inline-flex;align-items:center;gap:10px"><i style="width:10px;height:10px;border-radius:50%;background:${j % 2 ? C : P};box-shadow:0 0 12px ${j % 2 ? C : P}"></i>${t}</span>`).join("")}</div>
        <div class="stk w" style="position:relative;font-size:${S ? 34 : 30}px;flex:none">${brand.labels.swipe} ${icon("swipe", S ? 34 : 30, T.ink, 2.6)}</div>
      </div>
    </div>`;
  },

  photoHero(d, { S, H }) {
    const ph = S ? 1080 : 690;
    return `
    ${photo(d.photo, { w: 1080, h: ph + 120, grade: "teal", pos: d.pos || "50% 50%" })}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.75) 0%,rgba(${R.ink},0) 22%,rgba(${R.ink},0) ${Math.round(ph / H * 100) - 22}%,${T.ink} ${Math.round((ph + 110) / H * 100)}%)`)}
    ${leaks([[150, ph - 50, 700, P, .35], [980, ph - 300, 600, C, .25]])}
    <div class="outline" style="font-size:${S ? 260 : 210}px;left:60px;top:${S ? 250 : 140}px">${d.num}</div>
    ${qcard({ ...d.card1, x: S ? 380 : 420, y: S ? 300 : 150, w: S ? 640 : 600, fs: S ? 32 : 28, rot: -1.5 })}
    ${qcard({ ...d.card2, x: S ? 60 : 56, y: S ? 790 : 500, w: S ? 680 : 600, fs: S ? 31 : 27, rows: false, rot: 1.2 })}
    ${head({ kick: d.kick, h: d.h, fs: S ? 104 : 88, sub: d.sub, subFs: S ? 34 : 31, y: S ? ph + 60 : ph + 50 })}
    ${quoteBox(d, S)}`;
  },

  // split: two options side by side (app-specific: needs app.splitLabels + app.shots.swap in the brand pack)
  split(d, { S, H }) {
    const L0 = { ...requireApp("splitLabels", "split"), ...(d.labels || {}) }, swap = requireApp("shots.swap", "split");
    const ph = S ? 1080 : 700, mid = 540;
    const LCLIP = `polygon(0 0,${mid + 90}px 0,${mid - 90}px ${ph}px,0 ${ph}px)`;
    const RCLIP = `polygon(${mid + 98}px 0,1080px 0,1080px ${ph}px,${mid - 82}px ${ph}px)`;
    return `
    <div class="abs" style="inset:0 0 auto 0;height:${ph}px;clip-path:${RCLIP}">${photo(d.right, { w: 1080, h: ph, grade: "warm", pos: d.rightPos || "60% 50%", zoom: 1.05 })}</div>
    <div class="abs" style="inset:0 0 auto 0;height:${ph}px;clip-path:${LCLIP}">${photo(d.left, { w: 1080, h: ph, grade: "duo", pos: d.leftPos || "50% 50%" })}</div>
    <svg class="abs" style="left:0;top:0;z-index:4" width="1080" height="${ph}"><line x1="${mid + 94}" y1="0" x2="${mid - 86}" y2="${ph}" stroke="${P}" stroke-width="8"/></svg>
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.7) 0%,rgba(${R.ink},0) 18%,rgba(${R.ink},0) ${Math.round(ph / H * 100) - 14}%,${T.ink} ${Math.round((ph + 40) / H * 100)}%)`)}
    <div class="badge" style="left:${mid - (S ? 95 : 80)}px;top:${ph / 2 - (S ? 95 : 80)}px;width:${S ? 190 : 160}px;height:${S ? 190 : 160}px;font-size:${S ? 76 : 64}px;transform:rotate(-8deg)">${L0.or}</div>
    <div class="stk w" style="right:${S ? 80 : 70}px;top:${S ? 300 : 175}px;font-size:${S ? 44 : 38}px;transform:rotate(3deg)">${icon(L0.aIcon, S ? 42 : 36, P, 2.6)}${L0.a}</div>
    <div class="stk c" style="left:${S ? 80 : 70}px;top:${S ? 430 : 300}px;font-size:${S ? 44 : 38}px;transform:rotate(-3deg)">${icon(L0.bIcon, S ? 42 : 36, T.ink, 2.6)}${L0.b}</div>
    <div class="outline" style="font-size:${S ? 190 : 150}px;left:66px;top:${S ? 250 : 135}px;z-index:8">${d.num}</div>
    ${qcard({ ...d.card, x: S ? 56 : 50, y: S ? 680 : 450, w: S ? 600 : 530, fs: S ? 30 : 25, rot: -1.5 })}
    ${uiCut(swap, { x: S ? 670 : 610, y: S ? 880 : 555, w: S ? 380 : 400, rot: 2, style: `border-radius:22px;box-shadow:0 30px 70px rgba(0,0,0,.6),0 0 0 2px rgba(${R.accent},.5),0 0 50px rgba(${R.accent},.35)` })}
    <div class="note" style="position:absolute;z-index:45;right:${S ? 70 : 75}px;top:${S ? 990 : 660}px;font-size:${S ? 24 : 21}px">${icon("spark", 20, C)}${L0.note}</div>
    ${head({ kick: d.kick, kc: "c", h: d.h, fs: S ? 100 : 92, sub: d.sub, subFs: S ? 38 : 31, y: S ? ph + 150 : ph + 40 })}
    ${quoteBox(d, S)}`;
  },

  coachBody(d, { S, H }) {
    const by = S ? 790 : 450, bh = S ? 660 : 540, bw = bh * 900 / 1350, bx = S ? 620 : 640;
    return `
    ${photo(d.bg, { w: 1080, h: H, grade: "dark", pos: "50% 60%" })}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.95) 0%,rgba(${R.ink},.6) 30%,rgba(${R.ink},.45) 55%,${T.ink} ${S ? 88 : 86}%)`)}
    ${leaks([[bx + bw / 2, by + bh / 2, 800, C, .35], [160, by + 300, 800, P, .35]])}
    <div class="outline" style="font-size:${S ? 190 : 160}px;left:64px;top:${S ? 260 : 150}px;-webkit-text-stroke-color:rgba(255,255,255,.45)">${d.num}</div>
    ${coach(d.coach, { x: S ? -250 : -220, y: S ? 690 : 400, w: S ? 840 : 760 })}
    <div class="nametag" style="left:${S ? 60 : 56}px;top:${S ? 1370 : 905}px;font-size:${S ? 28 : 24}px">${COACH[d.coach].name}<span>${COACH[d.coach].tag}</span></div>
    <div class="abs" style="left:${bx}px;top:${by}px;width:${bw}px;height:${bh}px;z-index:20">
      <div class="abs" style="inset:10% -10% 0;border-radius:50%;background:radial-gradient(circle,rgba(${R.accent},.25),transparent 65%);filter:blur(10px)"></div>
      <img src="${requireApp("figure", "coachBody")}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 24px rgba(${R.accent},.35))">
      <div class="pin" style="left:50%;top:40%"></div><i class="anc" data-anc="body.back" style="left:50%;top:40%"></i>
      <div class="pin cy" style="left:36%;top:69%"></div><i class="anc" data-anc="body.knee" style="left:36%;top:69%"></i>
    </div>
    ${callout({ to: "body.back", x: S ? 290 : 300, y: S ? 1030 : 630, w: S ? 340 : 310, title: d.inj[0], fs: S ? 30 : 26, color: "p" })}
    ${callout({ to: "body.knee", x: S ? 360 : 370, y: S ? 1250 : 820, w: S ? 270 : 240, title: d.inj[1], fs: S ? 30 : 26 })}
    ${head({ kick: d.kick, h: d.h, fs: S ? 90 : 80, y: S ? 470 : 150, w: S ? 936 : 860 })}
    ${qcard({ ...d.card, x: 56, y: S ? 1460 : 990, w: 968, fs: S ? 30 : 27, rows: false })}
    <div class="abs" style="right:60px;left:60px;top:${S ? 1705 : H - 118}px;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:16px">
      <div class="sub" style="font-size:${S ? 28 : 26}px">${d.sub}</div>${disclaimer(d.disclaimer, S ? 25 : 24)}
    </div>`;
  },

  food(d, { S, H }) {
    const ph = S ? 1000 : 720;
    const pw = S ? 360 : 320, px = S ? 50 : 46, py = S ? 330 : 190;
    return `
    ${photo(d.photo, { w: 1080, h: ph + 140, grade: "warm", pos: d.pos || "50% 60%", zoom: 1.08 })}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.8) 0%,rgba(${R.ink},.05) 20%,rgba(${R.ink},0) ${Math.round(ph / H * 100) - 25}%,${T.ink} ${Math.round((ph + 130) / H * 100)}%)`)}
    <div class="outline" style="font-size:${S ? 230 : 190}px;right:70px;top:${S ? 420 : 150}px;-webkit-text-stroke-color:rgba(255,255,255,.9);filter:drop-shadow(0 4px 20px rgba(0,0,0,.6))">${d.num}</div>
    <div class="polaroid" style="right:${S ? 70 : 64}px;top:${S ? 660 : 345}px;width:${S ? 430 : 380}px;transform:rotate(4deg)"><div class="im" style="height:${S ? 240 : 210}px;background-image:url('${AS("photos/" + d.polaroid)}');background-position:30% 50%"></div><div class="pcap" style="font-size:${S ? 32 : 28}px">${d.polaroidCap}</div></div>
    ${phone(d.shot || requireApp("shots.meals", "food"), { x: px, y: py, w: pw, id: "ph", rot: "perspective(1800px) rotateY(14deg) rotateZ(-3deg)", anchors: { ring: [0.88, 0.335] } })}
    ${callout({ to: "ph.ring", x: S ? 470 : 430, y: S ? 270 : 190, w: S ? 360 : 330, title: d.callout[0], sub: d.callout[1], fs: S ? 34 : 30, color: "p" })}
    ${head({ kick: d.kick, h: d.h, fs: S ? 104 : 92, y: S ? ph + 20 : ph - 40, w: 960 })}
    <div class="abs" style="right:60px;left:60px;top:${S ? ph + 270 : ph + 200}px;z-index:50">
      <div class="qc" style="position:relative;padding:0;font-size:${S ? 30 : 26}px"><div class="tag">${brand.labels.foodSurveyTag}</div><div style="font-weight:800;margin-bottom:16px">${d.cuisineQ}</div></div>
      <div class="chips">${d.cuisines.map(([t, cls]) => `<span class="chip ${cls || ""}" style="font-size:${S ? 32 : 28}px">${cls === "cy" ? icon("pen", S ? 28 : 24, T.onAccent, 2.4) : ""}${t}</span>`).join("")}</div>
      <div style="display:flex;align-items:center;gap:16px;margin-top:${S ? 28 : 22}px;font-weight:800;font-size:${S ? 32 : 28}px">
        <span style="flex:none;width:${S ? 58 : 50}px;height:${S ? 58 : 50}px;border-radius:16px;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px rgba(37,211,102,.45)">${waIcon(S ? 34 : 30)}</span>
        <span>${d.whatsapp}</span></div>
    </div>
    ${S && d.quote ? `<div class="abs" style="right:56px;top:1610px;z-index:50">${voiceNote(brand.defaultCharacter, d.quote, { w: 968, fs: 30, av: 88 })}</div>` : ""}`;
  },

  // cta: the brand's closing slide. Words come from brand.config → cta (d.mega / d.button override them);
  // the phone shows app.shots.default when the brand has an app, and the character is characters.default.
  cta(d, { S, H }) {
    const lead = d.coach || brand.defaultCharacter, shot = d.shot || brand.app?.shots?.default;
    return `
    ${photo(d.bg, { w: 1080, h: H, grade: "dark", pos: "50% 50%" })}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.95) 0%,rgba(${R.ink},.45) 30%,rgba(${R.ink},.3) 48%,${T.ink} ${S ? 70 : 66}%)`)}
    ${leaks([[860, S ? 820 : 560, 900, P, .6], [150, S ? 980 : 700, 800, C, .45]])}
    ${shot ? phone(shot, { x: S ? 60 : 64, y: S ? 560 : 340, w: S ? 360 : 290, id: "cph", rot: "perspective(1800px) rotateY(18deg) rotateZ(-5deg)", anchors: { plan: [0.19, 0.378] }, cls: "refl" }) : ""}
    ${coach(lead, { x: S ? 340 : 440, y: S ? 400 : 290, w: S ? 780 : 640 })}
    ${COACH[lead] ? `<div class="nametag" style="right:${S ? 70 : 64}px;top:${S ? 700 : 440}px;font-size:${S ? 28 : 24}px">${COACH[lead].name}<span>${COACH[lead].tag}</span></div>` : ""}
    <div class="abs" style="left:0;right:0;top:${S ? 1080 : 760}px;bottom:0;background:linear-gradient(to bottom,rgba(${R.ink},0),${T.ink} ${S ? 220 : 160}px);z-index:30"></div>
    ${head({ kick: d.kick, h: d.h, fs: S ? 92 : 76, y: S ? 290 : 150 })}
    <div class="abs" style="right:60px;left:60px;top:${S ? 1030 : 685}px;z-index:50;text-align:right">
      <div class="mega" style="font-size:${S ? 250 : 190}px">${d.mega ?? brand.cta.mega}</div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:${S ? 6 : 0}px">${d.chips.map(([ic, t]) => `<span class="tchip" style="font-size:${S ? 31 : 25}px">${icon(ic, S ? 30 : 24, C)}${t}</span>`).join("")}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:${S ? 34 : 24}px">
        <div class="cta-btn" style="font-size:${S ? 56 : 48}px;padding:${S ? "26px 58px 20px" : "22px 50px 16px"}">${d.button ?? brand.cta.button} ${icon("arrow", S ? 50 : 42, T.onPrimary, 2.8)}</div>
        <div class="url" style="font-size:${S ? 46 : 40}px">${brand.url}</div>
      </div>
      <div style="display:flex;align-items:center;gap:16px;margin-top:${S ? 34 : 20}px">
        <div style="display:flex;direction:ltr">${brand.cast.filter(k => COACH[k]).map((k, j) => `<img src="${COACH[k].av}" style="width:${S ? 64 : 54}px;height:${S ? 64 : 54}px;border-radius:50%;border:3px solid ${T.ink};margin-left:${j ? -16 : 0}px;object-fit:cover">`).join("")}</div>
        <div class="fine" style="font-size:${S ? 25 : 24}px;color:#fff"><b style="font-weight:800">${d.coachesNote?.[0] ?? ""}</b> ${d.coachesNote?.[1] ?? ""}</div>
      </div>
      <div class="fine" style="font-size:${S ? 24 : 21}px;margin-top:${S ? 22 : 12}px">${d.fine}</div>
    </div>`;
  },

  // phoneFeature: one feature, proven by a real screen. d: bg, grade?, num, kick, h, sub, shot, callouts: [{anc, title, sub?, col}], note?: {icon, tx}
  phoneFeature(d, { S, H }) {
    const pw = S ? 470 : 400, py = S ? 640 : 420, id = "pf";
    const anchors = Object.fromEntries((d.callouts || []).map((c, k) => ["a" + k, c.anc]));
    return `
    ${photo(d.bg, { w: 1080, h: H, grade: d.grade || "dark", pos: d.pos || "50% 50%" })}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.94) 0%,rgba(${R.ink},.55) 26%,rgba(${R.ink},.45) 55%,${T.ink} ${S ? 92 : 94}%)`)}
    ${leaks([[800, py + 300, 900, P, .45], [160, py + 500, 800, C, .38]])}
    <div class="outline" style="font-size:${S ? 190 : 150}px;left:64px;top:${S ? 260 : 150}px">${d.num}</div>
    ${head({ kick: d.kick, h: d.h, fs: S ? 98 : 84, sub: d.sub, subFs: S ? 34 : 29, y: S ? 300 : 160 })}
    ${phone(d.shot, { x: 1080 - pw - 70, y: py + (S ? 120 : 110), w: pw, id, rot: "perspective(1800px) rotateY(-14deg) rotateZ(3deg)", anchors, cls: S ? "refl" : "" })}
    ${(d.callouts || []).map((c, k) => callout({ to: `${id}.a${k}`, x: 60, y: py + (S ? 230 : 180) + k * (S ? 250 : 210), w: S ? 400 : 380, title: c.title, sub: c.sub || "", fs: S ? 36 : 31, color: c.col || (k % 2 ? "c" : "p") })).join("")}
    ${d.note ? `<div class="abs" style="left:60px;right:60px;top:${S ? 1700 : H - 130}px;z-index:50">${`<span class="note" style="font-size:${S ? 28 : 24}px">${icon(d.note.icon || "info", S ? 30 : 26, C)}${d.note.tx}</span>`}</div>` : ""}`;
  },

  // rows: a value slide (tips, foods, numbers) as a glass list, for educational carousels.
  // d: bg, grade?, pos?, num?, kick, h, sub?, rows: [[icon, text, tag, tone p|c|w]], top?, note?: {icon, tx}
  rows(d, { S, H }) {
    const top = d.top ?? (S ? 820 : 560), ik = S ? 76 : 64;
    const tint = (t) => t === "c" ? [`rgba(${R.accent},.16)`, C, "c"] : t === "w" ? ["rgba(255,255,255,.1)", "#fff", "k"] : [`rgba(${R.primary},.18)`, P, "p"];
    return `
    ${photo(d.bg, { w: 1080, h: H, grade: d.grade || "dark", pos: d.pos || "50% 50%" })}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.94) 0%,rgba(${R.ink},.6) 28%,rgba(${R.ink},.5) 55%,${T.ink} ${S ? 94 : 96}%)`)}
    ${leaks([[900, top + 200, 900, P, .4], [140, top + 400, 800, C, .35]])}
    ${d.num ? `<div class="outline" style="font-size:${S ? 190 : 150}px;left:64px;top:${S ? 260 : 150}px">${d.num}</div>` : ""}
    ${head({ kick: d.kick, h: d.h, fs: S ? 98 : 84, sub: d.sub, subFs: S ? 34 : 29, y: S ? 300 : 160 })}
    <div class="abs glass" style="left:60px;right:60px;top:${top}px;border-radius:34px;padding:${S ? "16px 30px" : "10px 26px"};z-index:45">
      ${d.rows.map(([ic, tx, tag, tone], k) => { const [bg, fg, cls] = tint(tone); return `<div style="display:flex;align-items:center;gap:20px;padding:${S ? 22 : 15}px 0;${k ? "border-top:1.5px solid rgba(255,255,255,.1);" : ""}">
        <span style="flex:none;width:${ik}px;height:${ik}px;border-radius:20px;display:flex;align-items:center;justify-content:center;background:${bg}">${icon(ic, S ? 42 : 36, fg, 2.4)}</span>
        <span style="flex:1;font-weight:800;font-size:${S ? 42 : 36}px;line-height:1.25">${tx}</span>
        ${tag ? `<span class="stk ${cls}" style="position:relative;font-size:${S ? 32 : 28}px;padding:11px 22px 8px;box-shadow:none">${tag}</span>` : ""}</div>`; }).join("")}
    </div>
    ${d.note ? `<div class="abs" style="left:60px;right:60px;top:${S ? 1700 : H - 130}px;z-index:50"><span class="note" style="font-size:${S ? 28 : 24}px">${icon(d.note.icon || "info", S ? 30 : 26, C)}${d.note.tx}</span></div>` : ""}`;
  },

  // poll: background for an Instagram/Snap poll or quiz story. The dashed box is where the in-app sticker goes.
  // d: bg, grade?, kind ("استطلاع" | "اختبار" | "سؤال"), h, sub?, coach?
  poll(d, { S, H }) {
    const bx = S ? 1000 : 640;
    return `
    ${photo(d.bg, { w: 1080, h: H, grade: d.grade || "duo", pos: d.pos || "50% 45%" })}
    ${shade(`linear-gradient(to bottom,rgba(${R.ink},.94) 0%,rgba(${R.ink},.5) 30%,rgba(${R.ink},.35) 55%,rgba(${R.ink},.85) 85%)`)}
    ${leaks([[860, bx, 900, P, .5], [160, bx + 300, 800, C, .4]])}
    ${d.coach ? coach(d.coach, { x: S ? 420 : 520, y: S ? 1180 : 760, w: S ? 760 : 600, style: "filter:brightness(.85)" }) : ""}
    ${head({ kick: d.kind, h: d.h, fs: S ? 112 : 92, sub: d.sub || "", subFs: S ? 36 : 30, y: S ? 330 : 170 })}
    ${d.opts ? pollOpts(d, { S, bx }) : `<div class="abs" style="left:${S ? 110 : 120}px;right:${S ? 110 : 120}px;top:${bx}px;height:${S ? 420 : 300}px;border:3px dashed rgba(255,255,255,.35);border-radius:40px;z-index:40"></div>`}`;
  },
};

// Sticker-free poll for auto-published stories (schedulers can't add in-app stickers):
// the options are printed, and the call to action is a reply prompt. d.opts: [[text, on?]], d.cta: {icon, tx}.
function pollOpts(d, { S, bx }) {
  const fs = S ? 46 : 36;
  const rows = d.opts.map(([t, on]) => `<div style="display:flex;align-items:center;gap:22px;padding:${S ? "26px 34px" : "18px 26px"};border-radius:28px;
    background:${on ? `linear-gradient(135deg,${T.primary},${T.primaryDeep})` : `rgba(${R.ink},.62)`};border:2px solid ${on ? "transparent" : "rgba(255,255,255,.22)"};
    box-shadow:${on ? `0 14px 40px rgba(${R.primary},.45)` : "none"};font-size:${fs}px;font-weight:800;color:#fff">
    <span style="width:${fs}px;height:${fs}px;border-radius:50%;flex:none;border:3px solid ${on ? "#fff" : "rgba(255,255,255,.5)"};background:${on ? "#fff" : "transparent"}"></span>${t}</div>`).join("");
  const cta = d.cta || { icon: "chat", tx: brand.labels.pollReply };
  return `
    <div class="abs" style="left:${S ? 110 : 120}px;right:${S ? 110 : 120}px;top:${bx}px;display:flex;flex-direction:column;gap:${S ? 22 : 16}px;z-index:40">${rows}</div>
    <div class="abs" style="left:0;right:0;bottom:${S ? 230 : 120}px;display:flex;justify-content:center;z-index:45">
      <span class="tchip" style="font-size:${S ? 40 : 32}px;color:#fff">${icon(cta.icon, S ? 44 : 34, C)}${cta.tx}</span>
    </div>`;
}
