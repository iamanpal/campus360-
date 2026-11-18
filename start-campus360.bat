@echo off
title Campus 360 - Server Launcher
color 0A
echo ===================================================
echo   CAMPUS 360 - SMART COLLEGE MANAGEMENT PORTAL
echo ===================================================
echo.
echo Starting MongoDB & Express Server...
echo.

:: Open browser automatically after 3 seconds
start "" "http://localhost:3000"

:: Start Node.js Express Server
node server.js

pause
