#!/bin/bash
# Usage: scripts/src/batch.sh <plan.txt> [parallel_jobs]   (env: CONTENT_OUT, SPEC_DIR (default: the brand pack's specs/), CONTENT_BRAND, GEMINI_API_KEY)
# plan.txt: one item id per line (e.g. "tailoring"). For each id it renders whatever specs exist:
#   $SPEC_DIR/<id>.carousel.{mjs,json} -> $CONTENT_OUT/<id>/carousel/{feed,story}/01..NN.png
#   $SPEC_DIR/<id>.video.{mjs,json}    -> voiceover (if spec.vo) + $CONTENT_OUT/<id>/video/main.mp4
# then writes out/<id>/review/{carousel_sheet,video_frames}.png for human sign-off.
set -euo pipefail
PLAN="$(realpath "$1")"; JOBS="${2:-2}"
export OUTB="$(realpath -m "${CONTENT_OUT:-marketing-out}")"
export SPECS="$(realpath -m "${SPEC_DIR:-$(node "$(dirname "$0")/brandpath.mjs" specs)}")"
cd "$(dirname "$0")/../.."   # plugin root (holds scripts/)
export PY="$(node scripts/src/python.mjs)"
one() {
  id="$1"; o="$OUTB/$id"; mkdir -p "$o"
  # a spec may be .mjs or .json
  car=""; vid=""
  for e in mjs json; do [ -f "$SPECS/$id.carousel.$e" ] && car="$SPECS/$id.carousel.$e"; [ -f "$SPECS/$id.video.$e" ] && vid="$SPECS/$id.video.$e"; done
  [ -n "$car" ] && node scripts/src/carousel.mjs "$car" "$o/carousel" > "$o/carousel.log" 2>&1
  [ -n "$vid" ] && { node scripts/src/voiceover.mjs "$vid" "$o" > "$o/vo.log" 2>&1 || true; }
  [ -n "$vid" ] && WORKERS="${WORKERS:-2}" node scripts/src/video.mjs "$vid" "$o" > "$o/video.log" 2>&1
  mode=all; [ -n "$vid" ] || mode=carousel; [ -n "$car" ] || mode=video
  "$PY" -I scripts/src/review.py "$o" "$mode" > /dev/null
  echo "done $id"
}
export -f one
grep -v '^\s*#' "$PLAN" | grep -v '^\s*$' | xargs -P "$JOBS" -I{} bash -c 'one {}'
