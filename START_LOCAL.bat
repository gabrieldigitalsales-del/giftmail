@echo off
cd /d "%~dp0"
start "" http://localhost:8080
py server_local.py 2>nul || python server_local.py
pause
