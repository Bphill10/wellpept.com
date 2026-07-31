# One-shot: drop files in inbox\, commit, push (agent can grab after).
# Usage:  .\scripts\push-inbox.ps1
#    or:  .\scripts\push-inbox.ps1 -AlsoWellpept
#
# Vendor price lists: put them in public\vendor-lists\ instead, then:
#   git add public/vendor-lists; git commit; git push
#   and tell the agent: check vendor-lists

param(
  [switch]$AlsoWellpept
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path "inbox")) {
  New-Item -ItemType Directory -Path "inbox" | Out-Null
}

$pending = Get-ChildItem -Path "inbox" -File |
  Where-Object { $_.Name -notin @("README.md", ".gitkeep", ".DS_Store") }

if (-not $pending) {
  Write-Host "inbox\ is empty. Copy files into inbox\ first, then re-run."
  Write-Host "Vendor lists belong in public\vendor-lists\ (not inbox)."
  exit 1
}

Write-Host "Files in inbox:"
$pending | ForEach-Object { Write-Host "  $($_.Name)" }

bash scripts/ingest-inbox.sh 2>$null
if ($LASTEXITCODE -ne 0) {
  # Windows may not have bash — copy with PowerShell
  New-Item -ItemType Directory -Force -Path "public" | Out-Null
  New-Item -ItemType Directory -Force -Path "public\vendor-lists" | Out-Null
  foreach ($f in $pending) {
    $lower = $f.Name.ToLowerInvariant()
    $ext = $f.Extension.TrimStart('.').ToLowerInvariant()
    $isVendor = $ext -in @('xlsx','xls','csv') -or
      $lower -match 'jec|jce|changsha|erp|stg|price.?list|pricelist|vendor'
    if ($isVendor) {
      Copy-Item -Force $f.FullName (Join-Path "public\vendor-lists" $f.Name)
      Write-Host "public\vendor-lists\$($f.Name)"
    } else {
      Copy-Item -Force $f.FullName (Join-Path "public" $f.Name)
      Write-Host "public\$($f.Name)"
    }
  }
}

git add inbox public
git status

$names = ($pending | ForEach-Object { $_.Name }) -join ", "
git commit -m "inbox: add $names"
git push origin HEAD

if ($AlsoWellpept) {
  git push wellpept HEAD:main
  Write-Host "Pushed to wellpept.com main."
}

Write-Host "Done. Tell the agent: check inbox (or check vendor-lists for catalogs)"
