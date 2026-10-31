// Usage: node scripts/src/voiceover.mjs <spec.video.mjs> [outDir] [--only=5,6] [--redesign] [--voice=<prebuilt name, e.g. Puck>] [--dry]
// Generates the ad voiceover with Gemini TTS, the same way the app's coach voices are made
// (scripts/generate-coach-voices.mjs in the Smart AI Fitness app): a designed voice + per-line `style`, sent through the
// Interactions API. The transcript (`text`) and the performance direction (`style`) stay separate:
// the text field carries only what is spoken (plus optional [laugh]/[sigh] tags), never directions.
// Each spec.vo line becomes <outDir>/vo/<id>-<n>.wav, sped up (atempo <= 1.2) only when it would
// overrun its scene window. Results go to <outDir>/vo/<id>.json, which video.mjs reads.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { OUT_BASE, brand, truthGate } from "./lib.mjs";
import { loadSpec } from "./spec.mjs";
import { speechRequest, extractAudio, decodeAudio, trimSilence, encodeWav, pcmSeconds } from "./tts.mjs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=");
const spec = await loadSpec(args.find((a) => !a.startsWith("--")));
const vo = spec.vo;
if (!vo?.lines?.length) throw new Error("spec.vo.lines is empty");
const MODEL = vo.model || brand.voice.model || "gemini-3.8-flash-tts";
const API = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";
// the designed voice is shared by every item (brand pack → voice.file); the clips go to <outDir>/vo
const pos = args.filter((a) => !a.startsWith("--"));
const DIR = `${path.resolve(pos[1] || `${OUT_BASE}/${spec.id}`)}/vo`; fs.mkdirSync(DIR, { recursive: true });
const VOICE_FILE = brand.voice.file;
truthGate(vo.lines.map((l) => l.text).join(" "), `${spec.id} voiceover`);

// window of each line = from its `at` to the start of the next line (or the end), minus a breath
const windows = vo.lines.map((l, k) => +(((vo.lines[k + 1]?.at ?? spec.total) - l.at - 0.15).toFixed(2)));

if (flag("dry")) {
  vo.lines.forEach((l, k) => console.log(`${l.at.toFixed(2)}s  [${windows[k]}s]  ${l.text}`));
  console.log("style:", vo.style);
  process.exit(0);
}

const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (!key && !process.env.GEMINI_API_BASE) { console.error("GEMINI_API_KEY is not set"); process.exit(1); }
const auth = process.env.GEMINI_API_BASE ? { Authorization: `Bearer ${process.env.GEMINI_PROXY_TOKEN}` } : { "x-goog-api-key": key };

async function call(p, body) {
  for (let i = 0; ; i++) {
    const res = await fetch(`${API}/${p}`, { method: "POST", headers: { "Content-Type": "application/json", ...auth }, body: JSON.stringify(body), signal: AbortSignal.timeout(120_000) });
    if (res.ok) return res.json();
    const t = await res.text();
    if ((res.status !== 429 && res.status < 500) || i >= 4) throw new Error(`Gemini ${p} -> HTTP ${res.status}: ${t.slice(0, 400)}`);
    await new Promise((r) => setTimeout(r, 2000 * 2 ** i));
  }
}

// voice: a prebuilt studio voice (--voice=Puck) or a designed one, kept so every line sounds the same
let voiceId = opt("voice");
if (!voiceId) {
  const specHash = crypto.createHash("sha256").update(JSON.stringify([vo.voice.gender, vo.voice.prompt])).digest("hex").slice(0, 12);
  const prev = fs.existsSync(VOICE_FILE) ? JSON.parse(fs.readFileSync(VOICE_FILE, "utf8")) : null;
  if (prev?.id && prev.specHash === specHash && !flag("redesign")) voiceId = prev.id;
  else {
    const v = await call("voices", { store: true, voice: { type: "prompted", model: MODEL, gender: vo.voice.gender,
      display_name: `${brand.voice.namePrefix || brand.id + "-ad"}-${new Date().toISOString().slice(0, 19).replace(/\D/g, "")}`, prompted: { input: vo.voice.prompt } } });
    if (!v?.id) throw new Error("no voice id returned");
    voiceId = v.id;
    fs.mkdirSync(path.dirname(VOICE_FILE), { recursive: true });
    fs.writeFileSync(VOICE_FILE, JSON.stringify({ id: v.id, specHash, prompt: vo.voice.prompt, expireTime: v.expireTime ?? null }, null, 1));
    console.log("designed voice", voiceId);
  }
}

// --only=5,6 regenerates just those lines and keeps the others from the last run
const ONLY = opt("only")?.split(",").map(Number);
// unchanged lines (same text + style, file present) are reused, so re-runs cost nothing; --force redoes all
const prevOut = fs.existsSync(`${DIR}/${spec.id}.json`) ? JSON.parse(fs.readFileSync(`${DIR}/${spec.id}.json`, "utf8")).lines : null;
const out = [];
for (const [k, l] of vo.lines.entries()) {
  const p = prevOut?.[k], same = p && p.text === l.text && p.style === (l.style || vo.style) && p.at === l.at && fs.existsSync(p.file);
  if (!flag("force") && (ONLY ? !ONLY.includes(k) : true) && same) { out.push(p); continue; }
  const style = l.style || vo.style;
  const inter = await call("interactions", speechRequest({ model: MODEL, voiceId, text: l.text, style }));
  const audio = extractAudio(inter);
  if (!audio) throw new Error(`no audio for line ${k}: ${JSON.stringify(inter).slice(0, 300)}`);
  const pcm = trimSilence(decodeAudio(audio), { padMs: 60 });
  const raw = `${DIR}/${spec.id}-${k}.raw.wav`, file = `${DIR}/${spec.id}-${k}.wav`;
  fs.writeFileSync(raw, encodeWav(pcm));
  const len = pcmSeconds(pcm);
  const tempo = Math.min(1.2, Math.max(1, len / windows[k]));
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", raw, "-af", `atempo=${tempo.toFixed(3)}`, "-ar", "48000", file]);
  const fin = len / tempo;
  console.log(`line ${k}: ${len.toFixed(2)}s -> ${fin.toFixed(2)}s (tempo ${tempo.toFixed(2)}, window ${windows[k]}s)${fin > windows[k] + 0.05 ? "  !! still too long, shorten the text" : ""}  ${l.text}`);
  out.push({ file, at: l.at, text: l.text, seconds: +fin.toFixed(3), tempo: +tempo.toFixed(3), style });
}
fs.writeFileSync(`${DIR}/${spec.id}.json`, JSON.stringify({ model: MODEL, voice: voiceId, lines: out }, null, 1));
console.log("voiceover ->", `${DIR}/${spec.id}.json`);
