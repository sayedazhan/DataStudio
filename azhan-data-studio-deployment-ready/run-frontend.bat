@echo off
cd /d "%~dp0frontend"
if not exist node_modules (
  echo Installing frontend dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)
if not exist .env.local copy .env.local.example .env.local >nul
npm run dev
