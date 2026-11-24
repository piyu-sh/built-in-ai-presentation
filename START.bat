@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on PATH.
  echo Install Node.js 18+ or run this on a machine that already has it.
  pause
  exit /b 1
)
echo Starting portable deck...
node "%~dp0tools\serve.mjs"
set CODE=%ERRORLEVEL%
if not "%CODE%"=="0" pause
exit /b %CODE%
