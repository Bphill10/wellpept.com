# One-shot: commit + push everything under public\vendor-lists\
# Usage (from repo root, or double-click / right-click → Run with PowerShell):
#   .\scripts\push-vendor-lists.ps1
#
# After it finishes, tell the Cursor agent:  import JEC US

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$folder = "public\vendor-lists"
if (-not (Test-Path $folder)) {
  Write-Host "Missing $folder — create it and drop supplier folders (e.g. JEC US) inside."
  exit 1
}

# Show what will go up
Write-Host "Contents of $folder :"
Get-ChildItem -Path $folder -Force |
  Where-Object { $_.Name -notin @(".DS_Store") } |
  ForEach-Object {
    if ($_.PSIsContainer) { Write-Host "  [folder] $($_.Name)" }
    else { Write-Host "  $($_.Name)" }
  }

git checkout cursor/undisclosed-peptide-site-bfad 2>$null
git pull origin cursor/undisclosed-peptide-site-bfad

git add -- "public/vendor-lists"
$status = git status --porcelain -- "public/vendor-lists"
if (-not $status) {
  Write-Host ""
  Write-Host "Nothing new to push — git already has the current vendor-lists files."
  Write-Host "If you still added folders in File Explorer, make sure they are inside:"
  Write-Host "  $((Resolve-Path $folder).Path)"
  Write-Host "Then re-run this script."
  exit 0
}

Write-Host ""
Write-Host "Changes to commit:"
Write-Host $status

git commit -m "vendor-lists: sync supplier folders (JEC US and others)"
git push -u origin HEAD

Write-Host ""
Write-Host "Done. In Cursor chat say:  import JEC US"
