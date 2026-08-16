#!/usr/bin/env bash
# Build 3/5/10 mL vial masters in Blender 5.2 and render preview plates.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BLENDER="$("$SCRIPT_DIR/find_blender52.sh")"
echo "Using $BLENDER" >&2
"$BLENDER" --version | head -n 2 >&2
exec "$BLENDER" --background --python "$SCRIPT_DIR/build_vial_masters.py" -- "$@"
