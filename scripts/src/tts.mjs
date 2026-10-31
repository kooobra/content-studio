// Gemini TTS helpers (Interactions API): request body, audio extraction, WAV decode/encode, silence trim.
// Self-contained so the engine works in any project. Same behaviour as the Smart AI Fitness app's
// supabase/functions/_shared/coachVoice.js, which these were copied from (Oct 2026).

export function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const ascii = (bytes, start, end) => String.fromCharCode(...bytes.subarray(start, end));
// Int16 little-endian over an even byte count (an odd data chunk loses its last byte, not the file)
const int16 = (bytes, start, end) => {
  const even = end - ((end - start) % 2);
  return new Int16Array(bytes.buffer.slice(bytes.byteOffset + start, bytes.byteOffset + even));
};

// RIFF/WAVE with fmt + data (other chunks such as LIST are skipped)
export function parseWav(bytes) {
  if (ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 12) !== "WAVE") throw new Error("response is not WAV");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let fmt = null;
  for (let offset = 12; offset + 8 <= bytes.length; ) {
    const id = ascii(bytes, offset, offset + 4);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === "fmt ") {
      fmt = { format: view.getUint16(body, true), channels: view.getUint16(body + 2, true), sampleRate: view.getUint32(body + 4, true), bits: view.getUint16(body + 14, true) };
    } else if (id === "data") {
      if (!fmt) throw new Error("WAV data chunk before fmt");
      if (fmt.format !== 1 || fmt.bits !== 16) throw new Error(`unsupported WAV: format=${fmt.format} bits=${fmt.bits}`);
      // size 0 or 0xFFFFFFFF in a streamed WAV means "to the end of the file"
      const end = size && size !== 0xffffffff ? Math.min(body + size, bytes.length) : bytes.length;
      return { sampleRate: fmt.sampleRate, channels: fmt.channels, samples: int16(bytes, body, end) };
    }
    offset = body + size + (size % 2);
  }
  throw new Error("no data chunk in WAV");
}

// audio part of a response -> PCM (WAV by default, audio/l16 = raw 16-bit little-endian)
export function decodeAudio({ data, mime_type, sample_rate: rate, channels }) {
  const mime = mime_type ?? "";
  const bytes = base64ToBytes(data);
  if (mime.includes("wav") || ascii(bytes, 0, 4) === "RIFF") return parseWav(bytes);
  if (/^audio\/(l16|pcm)/i.test(mime)) {
    const fromMime = Number(/rate=(\d+)/i.exec(mime)?.[1]);
    return { sampleRate: fromMime || rate || 24000, channels: channels || 1, samples: int16(bytes, 0, bytes.length) };
  }
  throw new Error(`unexpected audio format: ${mime}`);
}

// the audio in an Interactions reply: last model_output step (output_audio and outputs are older wrappers)
export function extractAudio(interaction) {
  if (interaction?.output_audio?.data) return interaction.output_audio;
  const isAudio = (c) => c?.type === "audio" && typeof c.data === "string";
  const steps = Array.isArray(interaction?.steps) ? interaction.steps : [];
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i]?.type !== "model_output" || !Array.isArray(steps[i].content)) continue;
    const audio = steps[i].content.findLast(isAudio);
    if (audio) return audio;
  }
  return (Array.isArray(interaction?.outputs) ? interaction.outputs : []).findLast(isAudio) ?? null;
}

// trims silence at both ends, keeping a short pad; an all-silent clip is returned unchanged
export function trimSilence(pcm, { threshold = 500, padMs = 120 } = {}) {
  const { samples, sampleRate, channels } = pcm;
  const frame = channels || 1;
  const loud = (i) => Math.abs(samples[i]) > threshold;
  let first = 0;
  while (first < samples.length && !loud(first)) first++;
  if (first === samples.length) return pcm;
  let last = samples.length - 1;
  while (last > first && !loud(last)) last--;
  const pad = Math.round((sampleRate * padMs) / 1000) * frame;
  const start = Math.max(0, first - pad);
  const end = Math.min(samples.length, last + 1 + pad);
  const alignedStart = start - (start % frame); // whole frames, or stereo channels swap
  const alignedEnd = end - ((end - alignedStart) % frame);
  return { sampleRate, channels, samples: samples.slice(alignedStart, alignedEnd) };
}

export function encodeWav({ sampleRate, channels, samples }) {
  const dataBytes = samples.length * 2;
  const out = new Uint8Array(44 + dataBytes);
  const view = new DataView(out.buffer);
  const write = (offset, text) => { for (let i = 0; i < text.length; i++) out[offset + i] = text.charCodeAt(i); };
  write(0, "RIFF"); view.setUint32(4, 36 + dataBytes, true); write(8, "WAVE"); write(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true);
  write(36, "data"); view.setUint32(40, dataBytes, true);
  for (let i = 0; i < samples.length; i++) view.setInt16(44 + i * 2, samples[i], true);
  return out;
}

export function pcmSeconds({ samples, channels, sampleRate }) {
  return Math.round((samples.length / (channels || 1) / sampleRate) * 100) / 100;
}

// one spoken line: `text` is only what is said, `style` is the delivery direction
export function speechRequest({ model, voiceId, text, style }) {
  return {
    model,
    input: [{ type: "user_input", content: [{ type: "text", text, annotations: [{ type: "speech_metadata", style }] }] }],
    response_format: { type: "audio" },
    generation_config: { speech_config: [{ voice: voiceId }] },
  };
}
