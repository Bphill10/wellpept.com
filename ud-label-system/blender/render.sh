#!/usr/bin/env bash
# Compatibility wrapper — the studio lives in tools/blender-vials.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec bash "$ROOT/tools/blender-vials/render.sh" "$@"
