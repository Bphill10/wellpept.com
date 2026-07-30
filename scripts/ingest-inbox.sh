#!/usr/bin/env bash
# Copy files from inbox/ → public/ so the site (and agent) can use them.
# Run after Benjamin drops files in inbox/ and pushes, or locally before push.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INBOX="$ROOT/inbox"
PUBLIC="$ROOT/public"

mkdir -p "$PUBLIC"
shopt -s nullglob

copied=0
for src in "$INBOX"/*; do
  base="$(basename "$src")"
  # skip docs / keepers
  case "$base" in
    README.md|.gitkeep|.DS_Store) continue ;;
  esac
  [[ -f "$src" ]] || continue

  dest_name="$base"
  lower="$(echo "$base" | tr '[:upper:]' '[:lower:]')"

  # Friendly aliases for payment QRs (keep original too under public/)
  alias=""
  case "$lower" in
    *zelle*|receipt_*) alias="zelle-qr.${base##*.}" ;;
    *venmo*) alias="venmo-qr.${base##*.}" ;;
    *solana*) alias="solana-qr.${base##*.}" ;;
    *eth*|*ethereum*) alias="eth-qr.${base##*.}" ;;
  esac

  cp -f "$src" "$PUBLIC/$dest_name"
  echo "public/$dest_name"
  copied=$((copied + 1))

  if [[ -n "$alias" && "$alias" != "$dest_name" ]]; then
    # Don't overwrite a better PNG with a random jpg alias unless missing
    if [[ ! -f "$PUBLIC/$alias" ]]; then
      cp -f "$src" "$PUBLIC/$alias"
      echo "public/$alias (alias)"
    fi
  fi
done

if [[ "$copied" -eq 0 ]]; then
  echo "inbox/ is empty (nothing to copy)."
  exit 0
fi

echo
echo "Copied $copied file(s) into public/."
echo "Commit when ready:"
echo "  git add public inbox && git commit -m \"inbox: ingest drop files\" && git push"
