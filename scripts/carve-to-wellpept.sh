#!/usr/bin/env bash
# Push this WellPept/Undisclosed branch into Bphill10/wellpept.com and leave
# Ben_Phillips_Resume alone. Run from your machine (has write access).
set -euo pipefail

REMOTE_URL="${WELLPEPT_REMOTE:-git@github.com:Bphill10/wellpept.com.git}"
TARGET_BRANCH="${1:-main}"
SOURCE_REF="${2:-HEAD}"

echo "Source:  $(git rev-parse --short "$SOURCE_REF") ($(git rev-parse --abbrev-ref HEAD))"
echo "Target:  $REMOTE_URL  →  $TARGET_BRANCH"
echo

git remote remove wellpept-carve 2>/dev/null || true
git remote add wellpept-carve "$REMOTE_URL"

if [[ "$TARGET_BRANCH" == "main" ]]; then
  read -r -p "Push to wellpept.com main (production)? [y/N] " ok
  [[ "$ok" == "y" || "$ok" == "Y" ]] || { echo "Aborted."; exit 1; }
fi

git push -u wellpept-carve "$SOURCE_REF:refs/heads/$TARGET_BRANCH"
echo
echo "Done. Next:"
echo "  1. Confirm https://github.com/Bphill10/wellpept.com"
echo "  2. Point Cursor Cloud Agents at wellpept.com (not Ben_Phillips_Resume)"
echo "  3. Do NOT merge the resume PR for this branch"
echo "  4. Vercel should already track wellpept.com — redeploy if needed"
