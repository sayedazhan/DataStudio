@echo off
cd /d "%~dp0frontend"
if not exist node_modules (
  echo Frontend is not set up yet. Run setup-windows.bat first.
  pause
  exit /b 1
)
npm run dev
