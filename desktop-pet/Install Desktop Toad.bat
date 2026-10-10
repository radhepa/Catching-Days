@echo off
title Catching Days toad
cd /d "%~dp0"

where npm >nul 2>&1
if errorlevel 1 (
  echo.
  echo   The desktop toad needs Node.js. Install it from https://nodejs.org
  echo   then run this file again.
  echo.
  pause
  exit /b 1
)

echo.
echo   Getting the toad ready (the first time downloads about 100 MB)...
echo.
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo   That didn't work. Check your internet connection and try again.
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0make-shortcut.ps1"

start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0." --start-at-login
echo.
echo   Your toad is on the desktop. Tap it to talk, drag it to move it,
echo   and push it against the edge of the screen to hide it.
echo.
timeout /t 6 >nul
