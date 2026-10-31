# Usage: "$(node scripts/src/python.mjs)" -I scripts/src/review.py <itemDir>   (itemDir holds carousel/ and video/)
# Writes review/carousel_sheet.png (feed 3x2 + story row) and review/video_frames.png (12 frames + t labels).
import subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont
R = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__)) + '/..')
os.makedirs(f'{R}/review', exist_ok=True)
BG = (24, 24, 30); g = 24
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22)
except Exception: F = None
mode = sys.argv[2] if len(sys.argv) > 2 else 'all'
if mode in ('all', 'carousel'):
    feed = [Image.open(f'{R}/carousel/feed/{i:02d}.png').convert('RGB') for i in range(1, 7)]
    story = [Image.open(f'{R}/carousel/story/{i:02d}.png').convert('RGB') for i in range(1, 7)]
    w, h = 540, 675; sw, shh = 270, 480
    W = 3 * w + 4 * g; H = 2 * h + 3 * g + shh * 2 + g * 2
    sh = Image.new('RGB', (W, H), BG)
    for k, im in enumerate(feed): sh.paste(im.resize((w, h), Image.LANCZOS), (g + (k % 3) * (w + g), g + (k // 3) * (h + g)))
    y0 = 2 * h + 3 * g; sw2 = (W - 7 * g) // 6; sh2 = int(sw2 * 1920 / 1080)
    sh = sh.crop((0, 0, W, y0 + sh2 + g))
    for k, im in enumerate(story): sh.paste(im.resize((sw2, sh2), Image.LANCZOS), (g + k * (sw2 + g), y0))
    sh.save(f'{R}/review/carousel_sheet.png')
if mode in ('all', 'video'):
    mp4 = f'{R}/video/main.mp4'
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).decode())
    ts = [0.0] + [dur * (i + 0.5) / 11 for i in range(11)]
    fw, fh = 300, 533; cols = 6
    sh = Image.new('RGB', (cols * fw + (cols + 1) * g, 2 * (fh + 40) + 3 * g), BG); d = ImageDraw.Draw(sh)
    for i, t in enumerate(ts):
        p = f'{R}/build/rv_{i}.png'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', mp4, '-frames:v', '1', p], check=True)
        x = g + (i % cols) * (fw + g); y = g + (i // cols) * (fh + 40 + g)
        sh.paste(Image.open(p).convert('RGB').resize((fw, fh), Image.LANCZOS), (x, y))
        d.text((x + 4, y + fh + 8), f't={t:.1f}s' + ('  (frame 0)' if i == 0 else ''), fill=(220, 220, 230), font=F)
    sh.save(f'{R}/review/video_frames.png')
print('review ok', R)
