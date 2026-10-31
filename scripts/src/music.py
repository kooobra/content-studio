# Synthesises an original 120 BPM bed (kick/clap/hats/bass) + whooshes/impacts on the scene cuts.
# Pure stdlib so it runs anywhere. Usage: python3 music.py out.wav total_seconds cuts_csv duck_csv
# duck_csv = "start-end,start-end" (seconds where the coach voice plays → music ducks)
import math, random, struct, sys, wave
out, total = sys.argv[1], float(sys.argv[2])
cuts = [float(c) for c in sys.argv[3].split(",") if c]
ducks = [tuple(map(float, d.split("-"))) for d in sys.argv[4].split(",") if d]
SR = 44100; N = int(total * SR); BPM = 120; beat = 60 / BPM
buf = [0.0] * N
random.seed(7)

def add(start, samples, gain=1.0):
    i0 = int(start * SR)
    for k, v in enumerate(samples):
        i = i0 + k
        if 0 <= i < N: buf[i] += v * gain

def kick():
    L = int(.32 * SR); ph = 0; out = []
    for k in range(L):
        t = k / SR; f = 45 + 110 * math.exp(-t * 28); ph += 2 * math.pi * f / SR
        out.append(math.sin(ph) * math.exp(-t * 9) * (1 + .6 * math.exp(-t * 200)))
    return out

def noise_hit(dur, decay, hp=0.0, lp=1.0):
    L = int(dur * SR); out = []; y = 0; x1 = 0; z = 0
    for k in range(L):
        t = k / SR; x = random.uniform(-1, 1)
        y = lp * x + (1 - lp) * y          # one-pole low-pass
        z = y - x1 * hp; x1 = y            # crude high-pass
        out.append(z * math.exp(-t * decay))
    return out

def bass_note(f, dur):
    L = int(dur * SR); out = []
    for k in range(L):
        t = k / SR; env = min(1, t * 200) * math.exp(-t * 5)
        v = sum(math.sin(2 * math.pi * f * h * t) / h for h in (1, 2, 3, 4))
        out.append(math.tanh(v * 1.3) * env)
    return out

def whoosh(dur):
    L = int(dur * SR); out = []; y = 0
    for k in range(L):
        p = k / L; x = random.uniform(-1, 1)
        a = .02 + .5 * p ** 2           # filter opens up
        y = a * x + (1 - a) * y
        out.append(y * (p ** 1.6) * (1 - p) ** .3 * 3)
    return out

def impact():
    L = int(.9 * SR); out = []; ph = 0
    for k in range(L):
        t = k / SR; f = 38 + 60 * math.exp(-t * 12); ph += 2 * math.pi * f / SR
        out.append(math.sin(ph) * math.exp(-t * 4.5) + random.uniform(-1, 1) * .25 * math.exp(-t * 30))
    return out

K, CL, HH = kick(), noise_hit(.22, 22, hp=.95, lp=.6), noise_hit(.06, 70, hp=.99, lp=.9)
roots = [55.0, 43.65, 65.41, 49.0]          # A F C G
nb = int(total / beat) + 1
end_music = total - 0.2
for b in range(nb):
    t = b * beat
    if t > end_music: break
    intro = t < 0.5
    add(t, K, .9)
    if b % 2 == 1: add(t, CL, .35)
    add(t + beat / 2, HH, .18); add(t, HH, .08)
    root = roots[(b // 8) % 4]
    for e in range(2):
        add(t + e * beat / 2, bass_note(root, beat / 2 * .95), .22)
# soft pad: chord per 2 bars (root + fifth + octave + third), slow attack, gentle detune
def pad(f0, dur, third=1.2):
    L = int(dur * SR); out = []
    fr = [f0 * 2, f0 * 3, f0 * 4, f0 * 2 * third * 2]
    for k in range(L):
        t = k / SR; env = min(1, t / .6) * min(1, (dur - t) / .8)
        v = sum(math.sin(2 * math.pi * f * t) + .5 * math.sin(2 * math.pi * f * 1.004 * t) for f in fr)
        out.append(v * env / 6)
    return out
thirds = [1.2, 1.25, 1.25, 1.25]           # Am F C G-ish colour
bar = beat * 8
for j in range(int(total / bar) + 1):
    add(j * bar, pad(roots[j % 4], min(bar, total - j * bar)), .16)
for c in cuts:
    add(c - .38, whoosh(.38), .5)
    add(c, impact(), .55)
add(0.0, impact(), .7)

# ducking + master fade out
def gain_at(t):
    g = .55
    for a, b in ducks:
        if a - .15 <= t <= b + .25: g = .26
    if t > total - 1.2: g *= max(0, (total - t) / 1.2)
    return g
peak = max(abs(v) for v in buf) or 1
w = wave.open(out, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
frames = bytearray()
g_s = .55
for i, v in enumerate(buf):
    if i % 441 == 0: target = gain_at(i / SR)
    g_s += (target - g_s) * .02
    s = int(max(-1, min(1, v / peak * g_s)) * 32000)
    frames += struct.pack("<hh", s, s)
w.writeframes(bytes(frames)); w.close()
print("wrote", out)
