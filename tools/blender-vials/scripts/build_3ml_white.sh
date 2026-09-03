#!/usr/bin/env bash
# Build and render the single 3 mL white-cake development master.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BLENDER="$("$SCRIPT_DIR/find_blender52.sh")"
echo "Using $BLENDER" >&2
"$BLENDER" --version | head -n 2 >&2
exec "$BLENDER" --background --python "$SCRIPT_DIR/build_3ml_white.py" -- "$@"
