# content-studio (Claude Code plugin) v1.0.0

Brand-free content engine. The project supplies a `content-brand/` pack; the plugin supplies the renderer.

- `skills/content-studio`: the workflow (carousels, stories, videos, voice, review). `/content-studio:content-studio`
- `skills/new-brand`: sets up a brand pack for a new project. `/content-studio:new-brand [site URL]`
- `scripts/`: the engine (Node + Chromium + ffmpeg + Python/Pillow). `setup.sh` installs dependencies into the plugin's data folder.
- `templates/brand-pack/`: the empty brand pack.

Requirements on the machine: Node 18+, ffmpeg, Python 3, Chromium (or `CHROME_PATH`), `GEMINI_API_KEY` for voiceovers.

Install (in Claude Code):
```
/plugin install content-studio --marketplace kooobra/content-studio
```
