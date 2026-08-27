@echo off
cd /d "%~dp0backend"
if not exist .venv\Scripts\python.exe (
  echo Backend is not set up yet. Run setup-windows.bat first.
  pause
  exit /b 1
)
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
