#!/usr/bin/env bash
# Download Blender 4.2 LTS if needed, then render unlabeled vial stocks.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
CACHE="${BLENDER_CACHE:-$HOME/.local/share/undisclosed-blender}"
VERSION="4.2.23"
TARBALL="blender-${VERSION}-linux-x64.tar.xz"
URL="https://download.blender.org/release/Blender4.2/${TARBALL}"
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
    curl -L --fail --retry 4 --retry-delay 4 -o "$CACHE/$TARBALL" "$URL"
    tar -xJf "$CACHE/$TARBALL" -C "$CACHE"
  fi
  echo "$CACHE/blender-${VERSION}-linux-x64/blender"
}

BLENDER="$(find_blender || install_blender)"
echo "Using $BLENDER"
"$BLENDER" --version | head -n 2
exec "$BLENDER" --background --python "$ROOT/render_vial_studio.py" -- "$@"
