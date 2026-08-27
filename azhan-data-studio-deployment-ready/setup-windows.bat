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
  echo Install it with: py install 3.13
  echo Then run this setup again.
  goto :error
)

echo [1/2] Setting up Python 3.13 backend...
if not exist backend\.venv\Scripts\python.exe (
  py -3.13 -m venv backend\.venv
  if errorlevel 1 goto :error
)
backend\.venv\Scripts\python.exe -m pip install --upgrade pip
if errorlevel 1 goto :error
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
if errorlevel 1 goto :error

echo.
echo [2/2] Setting up Next.js frontend...
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
echo Next: open TWO terminals.
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
