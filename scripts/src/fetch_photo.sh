#!/bin/bash
# Usage: scripts/src/fetch_photo.sh <images.pexels.com|images.unsplash.com URL> <name.jpg> "<what it shows / where used>"
# Downloads into the brand pack's photos folder (own empty staging dir first) and appends the source to its credits file.
set -euo pipefail
url="$1"; name="$2"; note="${3:-}"
S="$(cd "$(dirname "$0")" && pwd)"
photos="$(node "$S/brandpath.mjs" photos)"; credits="$(node "$S/brandpath.mjs" credits)"; bdir="$(node "$S/brandpath.mjs" dir)"
case "$url" in https://images.pexels.com/*) lic="Pexels License";; https://images.unsplash.com/*) lic="Unsplash License";; *) echo "only Pexels/Unsplash"; exit 1;; esac
stage=$(mktemp -d); curl -sSfL "$url" -o "$stage/$name"; file "$stage/$name" | grep -q JPEG || { echo "not a JPEG"; exit 1; }
mkdir -p "$photos"; mv "$stage/$name" "$photos/$name"; rmdir "$stage"
printf -- '- %s/%s\n  %s  (%s)\n  %s\n' "$(realpath --relative-to="$bdir" "$photos")" "$name" "$url" "$lic" "$note" >> "$credits"
echo "added $name ($lic)"
