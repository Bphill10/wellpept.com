#!/usr/bin/env bash
# Locate Blender 5.2 and run the transparent-PNG environment probe.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CACHE="${BLENDER_CACHE:-$HOME/.local/share/undisclosed-blender}"
VERSION="5.2.0"
TARBALL="blender-${VERSION}-linux-x64.tar.xz"
URLS=(
  "https://download.blender.org/release/Blender5.2/${TARBALL}"
  "https://ftp.nluug.nl/pub/graphics/blender/release/Blender5.2/${TARBALL}"
  "https://ftp.halifax.rwth-aachen.de/blender/release/Blender5.2/${TARBALL}"
)

find_blender() {
  if [[ -x "$CACHE/blender-${VERSION}-linux-x64/blender" ]]; then
    echo "$CACHE/blender-${VERSION}-linux-x64/blender"
    return
  fi
  if [[ -n "${BLENDER_BIN:-}" && -x "${BLENDER_BIN}" ]] && "$BLENDER_BIN" --version 2>/dev/null | grep -q "5.2"; then
    echo "${BLENDER_BIN}"
    return
  fi
  if command -v blender >/dev/null 2>&1 && blender --version 2>/dev/null | grep -q "5.2"; then
    command -v blender
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
"$BLENDER" --version
exec "$BLENDER" --background --python "$SCRIPT_DIR/test_blender_env.py"
