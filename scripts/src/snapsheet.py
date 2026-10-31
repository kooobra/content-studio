# Usage: "$(node scripts/src/python.mjs)" -I scripts/src/snapsheet.py <buildDir> <out.png> t1,t2,...  -> grid of build/snap_<t>.jpg
import sys
from PIL import Image, ImageDraw
b, out, ts = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
w, h, g, cols = 360, 640, 12, 5
rows = (len(ts) + cols - 1) // cols
sh = Image.new('RGB', (cols * (w + g) + g, rows * (h + g + 24) + g), (30, 30, 36)); d = ImageDraw.Draw(sh)
for i, t in enumerate(ts):
    im = Image.open(f'{b}/snap_{t}.jpg').resize((w, h)); x = g + (i % cols) * (w + g); y = g + (i // cols) * (h + g + 24)
    sh.paste(im, (x, y)); d.text((x + 4, y + h + 4), f't={t}', fill=(255, 255, 0))
sh.save(out)
