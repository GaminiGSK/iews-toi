@echo off
title IEWS TOI - Local Dev Launcher
color 0A

echo.
echo  ============================================
echo   IEWS TOI - Starting Local Dev Environment
echo  ============================================
echo.
echo  Backend  --^>  http://localhost:5000
echo  Frontend --^>  http://localhost:3000
echo.
echo  Starting Backend Server (Port 5000)...
start "BACKEND :5000" cmd /k "cd /d e:\Antigravity\TOI\server && npm run dev"

timeout /t 3 /nobreak >nul

echo  Starting Frontend Server (Port 3000)...
start "FRONTEND :3000" cmd /k "cd /d e:\Antigravity\TOI\client && npm run dev"

timeout /t 5 /nobreak >nul

echo  Opening browser...
start chrome http://localhost:3000

echo.
echo  Both servers launched! Check the two terminal windows.
echo  Press any key to close this launcher...
pause >nul
