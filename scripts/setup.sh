#!/bin/bash
# One-time setup for the content engine: playwright-core (npm) + a Python venv with Pillow, plus checks for ffmpeg and Chromium.
# Usage: bash <plugin>/scripts/setup.sh [deps folder]
#   deps folder: where node_modules and .venv go. An installed plugin passes ${CLAUDE_PLUGIN_DATA} (kept across updates);
#   without it they go next to the scripts (fine for a checkout you run directly).
set -euo pipefail
S="$(cd "$(dirname "$0")" && pwd)"
D="${1:-${CONTENT_STUDIO_DEPS:-$S}}"; mkdir -p "$D"
if ! cmp -s "$S/package.json" "$D/package.json" || [ ! -d "$D/node_modules/playwright-core" ]; then
  [ "$D" = "$S" ] || cp "$S/package.json" "$S/package-lock.json" "$D/"
  (cd "$D" && npm install --silent --no-audit --no-fund)
fi
[ -x "$D/.venv/bin/python" ] || python3 -m venv "$D/.venv"
"$D/.venv/bin/pip" -q install pillow
command -v ffmpeg >/dev/null || { echo "!! ffmpeg missing: apt-get install -y ffmpeg (or brew install ffmpeg)"; exit 1; }
ls /opt/pw-browsers/chromium-*/chrome-linux/chrome >/dev/null 2>&1 || [ -n "${CHROME_PATH:-}" ] || echo "!! no Chromium found: set CHROME_PATH to a Chrome/Chromium binary (in the Claude cloud box never run 'playwright install')"
echo "content studio ready (deps: $D)"
echo "export CONTENT_STUDIO_DEPS=\"$D\""
