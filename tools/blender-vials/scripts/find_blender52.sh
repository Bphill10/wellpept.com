#!/usr/bin/env bash
# Resolve Blender 5.2. Echo the executable path only.
set -euo pipefail
CACHE="${BLENDER_CACHE:-$HOME/.local/share/undisclosed-blender}"
VERSION="5.2.0"
TARBALL="blender-${VERSION}-linux-x64.tar.xz"
URLS=(
  "https://download.blender.org/release/Blender5.2/${TARBALL}"
  "https://ftp.nluug.nl/pub/graphics/blender/release/Blender5.2/${TARBALL}"
  "https://ftp.halifax.rwth-aachen.de/blender/release/Blender5.2/${TARBALL}"
)

if [[ -x "$CACHE/blender-${VERSION}-linux-x64/blender" ]]; then
  echo "$CACHE/blender-${VERSION}-linux-x64/blender"
  exit 0
fi
if [[ -n "${BLENDER_BIN:-}" && -x "${BLENDER_BIN}" ]] && "$BLENDER_BIN" --version 2>/dev/null | grep -q "5.2"; then
  echo "${BLENDER_BIN}"
  exit 0
fi
if command -v blender >/dev/null 2>&1 && blender --version 2>/dev/null | grep -q "5.2"; then
  command -v blender
  exit 0
fi

mkdir -p "$CACHE"
echo "Downloading Blender ${VERSION}…" >&2
downloaded=0
for url in "${URLS[@]}"; do
  echo "Trying $url" >&2
  if curl -L --fail --retry 3 --retry-delay 4 -o "$CACHE/$TARBALL" "$url"; then
    downloaded=1
    break
  fi
done
if [[ "$downloaded" -ne 1 ]]; then
  echo "Could not download Blender ${VERSION}" >&2
  exit 1
fi
tar -xJf "$CACHE/$TARBALL" -C "$CACHE"
echo "$CACHE/blender-${VERSION}-linux-x64/blender"
