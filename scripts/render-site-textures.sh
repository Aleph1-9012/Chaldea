#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
assets="frontend/src/site/assets"
temporary="$(mktemp -d "${TMPDIR:-/tmp}/chaldea-textures.XXXXXX")"
trap 'rm -rf -- "$temporary"' EXIT

# Authoring only: rasterize the original artwork at 2x. Site builds consume
# the checked-in lossless images and do not need librsvg or ImageMagick.
rsvg-convert --zoom=2 "$assets/grain.svg" --output="$temporary/grain.png"
magick "$temporary/grain.png" -strip -define webp:lossless=true "$assets/grain.webp"

# Multiplying gray over any color equals black with alpha a * (1 - gray).
# Bake that coverage so the browser can use ordinary alpha compositing.
magick "$temporary/grain.png" -channel A -fx 'a*(1-r)' +channel \
  -channel RGB -evaluate Set 0 +channel -strip -define webp:lossless=true "$assets/grain-ink.webp"

for name in folder-green folder-paper folder-dark folder-browse hero; do
  source="$name"
  if [[ "$name" == hero ]]; then source="hero-label"; fi

  rsvg-convert --zoom=2 "$assets/home-v2/$source.svg" --output="$temporary/base.png"
  magick "$assets/home-v2/$name-grain.png" -channel A -evaluate Multiply .48 +channel "$temporary/overlay.png"
  magick "$temporary/base.png" "$temporary/overlay.png" -compose Multiply -composite \
    -strip -define webp:lossless=true "$assets/home-v2/$name-textured.webp"
done
