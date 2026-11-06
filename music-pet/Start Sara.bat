@echo off
title Sara
cd /d "%~dp0"

where npm >nul 2>&1
if errorlevel 1 (
  echo.
  echo   Sara needs Node.js. Install it from https://nodejs.org
  echo   then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "%~dp0node_modules\electron\dist\electron.exe" (
  echo.
  echo   Getting Sara ready ^(the first time downloads about 100 MB^)...
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo   That didn't work. Check your internet connection and try again.
    echo.
    pause
    exit /b 1
  )
)

start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
