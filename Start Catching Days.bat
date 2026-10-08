@echo off
title Catching Days
cd /d "%~dp0"

set "PORT=8765"
set "PAGE=catching-days.html"

if not exist "%PAGE%" (
  echo.
  echo   Could not find %PAGE% in this folder.
  echo   Keep "Start Catching Days.bat" in the same folder as the HTML file.
  echo.
  pause
  exit /b 1
)

REM ---- already running? just open the app and get out of the way. ----
REM Starting a second server on the same port is what made the app crawl:
REM Windows lets two processes both listen on one port, and connections then
REM get routed unpredictably between them. So clicking the launcher twice is
REM now harmless - the second click just opens the browser.
netstat -ano | find "127.0.0.1:%PORT% " | find "LISTENING" >nul 2>&1
if errorlevel 1 goto :findserver

REM An app server started before an update can be missing newer features
REM (like reading calendars). If it is, swap it for a fresh one: your data
REM lives in focus-data.json, so nothing is lost.
powershell -NoProfile -Command "try{ Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:%PORT%/cal-feed' -TimeoutSec 4 | Out-Null; exit 0 }catch{ $r=$_.Exception.Response; if($r -and [int]$r.StatusCode -eq 404){ exit 9 }; exit 0 }"
if not errorlevel 9 (
  start "" "http://127.0.0.1:%PORT%/%PAGE%"
  exit /b 0
)
echo   Updating the app server...
for /f "tokens=5" %%p in ('netstat -ano ^| find "127.0.0.1:%PORT% " ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
timeout /t 1 /nobreak >nul

:findserver

REM ---- find something that can serve the app AND save your data ----
py -3 --version  >nul 2>&1 && goto :usepy
python --version >nul 2>&1 && goto :usepython
node --version   >nul 2>&1 && goto :usenode
goto :noserver

:usepy
if not exist "server.py" goto :noserverfile
set "SERVE=py -3 server.py %PORT%"
goto :launch

:usepython
if not exist "server.py" goto :noserverfile
set "SERVE=python server.py %PORT%"
goto :launch

:usenode
if not exist "server.js" goto :noserverfile
set "SERVE=node server.js %PORT%"
goto :launch

:noserverfile
echo.
echo   Could not find server.py (or server.js) in this folder.
echo   Keep it next to Start Catching Days.bat and %PAGE% - that script is what
echo   actually saves your data to focus-data.json now.
echo.
pause
exit /b 1

:launch
echo.
echo   Catching Days
echo   ------------------------------------------------
echo   Opening  http://127.0.0.1:%PORT%/%PAGE%
echo.
echo   KEEP THIS WINDOW OPEN while you study.
echo   Closing it stops the app. Your data is unaffected.
echo.
echo   If the page does not open, paste that address into Brave.
echo   ------------------------------------------------
echo.

REM open the browser a couple of seconds after the server comes up.
REM PowerShell keeps this to one level of quoting - nesting start inside
REM cmd /c inside a quoted string does not survive batch parsing.
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:%PORT%/%PAGE%'"

%SERVE%

echo.
echo   Server stopped. If it quit immediately, port %PORT% may already
echo   be in use - edit this file and change PORT to 8766.
echo.
pause
exit /b

:noserver
echo.
echo   Neither Python nor Node.js was found on this PC, so this
echo   launcher cannot start a local server.
echo.
echo   Easiest fix: install Python from https://www.python.org/downloads/
echo   Tick "Add python.exe to PATH" during setup, then run this file again.
echo.
echo   (Node.js from https://nodejs.org also works.)
echo.
pause
exit /b 1
