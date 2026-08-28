@echo off
setlocal
cd /d "%~dp0"

echo.
echo ========================================
echo   Azhan Data Studio - First Time Setup
echo ========================================
echo.

py -3.13 --version >nul 2>nul
if errorlevel 1 (
  echo Python 3.13 was not found.
  echo Install Python 3.13, then run this setup again.
  goto :error
)

echo [1/2] Installing Python backend packages for the current user...
py -3.13 -m pip install --user -r backend\requirements.txt
if errorlevel 1 goto :error

echo.
echo [2/2] Installing Next.js frontend packages...
cd frontend
if not exist .env.local copy .env.local.example .env.local >nul
call npm install
if errorlevel 1 goto :error
cd ..

echo.
echo ========================================
echo   Setup complete.
echo ========================================
echo.
echo Terminal 1: run-backend.bat
echo Terminal 2: run-frontend.bat
echo.
pause
exit /b 0

:error
echo.
echo Setup stopped because a command failed.
echo Python 3.13 and Node.js are required.
pause
exit /b 1
