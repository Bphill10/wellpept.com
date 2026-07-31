#!/usr/bin/env bash
# Copy files from inbox/ → public/ (or public/vendor-lists for catalogs).
# Run after Benjamin drops files in inbox/ and pushes, or locally before push.
# Preferred: put vendor catalogs directly in public/vendor-lists/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INBOX="$ROOT/inbox"
PUBLIC="$ROOT/public"
VENDOR_LISTS="$PUBLIC/vendor-lists"

mkdir -p "$PUBLIC" "$VENDOR_LISTS"
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
  ext="${lower##*.}"

  # Price lists / catalogs → public/vendor-lists (canonical folder)
  is_vendor_list=0
  case "$lower" in
    *jec*|*jce*|*changsha*|*erp*|*stg*|*price*list*|*pricelist*|*vendor*)
      is_vendor_list=1
      ;;
  esac
  case "$ext" in
    xlsx|xls|csv)
      is_vendor_list=1
      ;;
  esac

  if [[ "$is_vendor_list" -eq 1 ]]; then
    cp -f "$src" "$VENDOR_LISTS/$dest_name"
    echo "public/vendor-lists/$dest_name"
    copied=$((copied + 1))
    continue
  fi

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
echo "Copied $copied file(s) into public/ (vendor lists → public/vendor-lists/)."
echo "Commit when ready:"
echo "  git add public inbox && git commit -m \"inbox: ingest drop files\" && git push"
