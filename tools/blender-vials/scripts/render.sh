#!/usr/bin/env bash
# Download Blender 4.2 LTS if needed, then render unlabeled vial stocks.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE="${BLENDER_CACHE:-$HOME/.local/share/undisclosed-blender}"
VERSION="4.2.23"
TARBALL="blender-${VERSION}-linux-x64.tar.xz"
URLS=(
  "https://download.blender.org/release/Blender4.2/${TARBALL}"
  "https://ftp.nluug.nl/pub/graphics/blender/release/Blender4.2/${TARBALL}"
  "https://ftp.halifax.rwth-aachen.de/blender/release/Blender4.2/${TARBALL}"
)
BIN="${BLENDER_BIN:-}"

find_blender() {
  if [[ -n "$BIN" && -x "$BIN" ]]; then
    echo "$BIN"
    return
  fi
  if command -v blender >/dev/null 2>&1; then
    command -v blender
    return
  fi
  if [[ -x "$CACHE/blender-${VERSION}-linux-x64/blender" ]]; then
    echo "$CACHE/blender-${VERSION}-linux-x64/blender"
    return
  fi
  return 1
}

install_blender() {
  mkdir -p "$CACHE"
  if [[ ! -x "$CACHE/blender-${VERSION}-linux-x64/blender" ]]; then
    echo "Downloading Blender ${VERSION}…"
    downloaded=0
    for url in "${URLS[@]}"; do
      echo "Trying $url"
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
  fi
  echo "$CACHE/blender-${VERSION}-linux-x64/blender"
}

BLENDER="$(find_blender || install_blender)"
echo "Using $BLENDER"
"$BLENDER" --version | head -n 2
exec "$BLENDER" --background --python "$SCRIPT_DIR/render_vial_studio.py" -- "$@"
