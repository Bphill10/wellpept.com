@echo off
REM Double-click this, or run:  scripts\push-vendor-lists.cmd
REM Pushes public\vendor-lists (JEC US, ERP, etc.) so the Cursor agent can import.

cd /d "%~dp0.."

echo.
echo === Vendor lists in public\vendor-lists ===
dir /b "public\vendor-lists"
echo.

git checkout cursor/undisclosed-peptide-site-bfad
if errorlevel 1 goto fail

git pull origin cursor/undisclosed-peptide-site-bfad
if errorlevel 1 goto fail

git add -- "public/vendor-lists"
git status -- "public/vendor-lists"

git diff --cached --quiet -- "public/vendor-lists"
if %errorlevel%==0 (
  echo.
  echo Nothing new to push. If JEC US is only on your PC, make sure it is inside:
  echo   %CD%\public\vendor-lists\JEC US
  echo Then run this again.
  goto end
)

git commit -m "vendor-lists: sync supplier folders (JEC US and others)"
if errorlevel 1 goto fail

git push -u origin HEAD
if errorlevel 1 goto fail

echo.
echo Done. In Cursor chat say:  import JEC US
goto end

:fail
echo.
echo Failed. Copy the error text above into Cursor chat.
:end
echo.
pause
