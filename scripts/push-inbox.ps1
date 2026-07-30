# One-shot: drop files in inbox\, commit, push (agent can grab after).
# Usage:  .\scripts\push-inbox.ps1
#    or:  .\scripts\push-inbox.ps1 -AlsoWellpept

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
  exit 1
}

Write-Host "Files in inbox:"
$pending | ForEach-Object { Write-Host "  $($_.Name)" }

bash scripts/ingest-inbox.sh 2>$null
if ($LASTEXITCODE -ne 0) {
  # Windows may not have bash — copy with PowerShell
  New-Item -ItemType Directory -Force -Path "public" | Out-Null
  foreach ($f in $pending) {
    Copy-Item -Force $f.FullName (Join-Path "public" $f.Name)
    Write-Host "public\$($f.Name)"
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

Write-Host "Done. Tell the agent: check inbox"
