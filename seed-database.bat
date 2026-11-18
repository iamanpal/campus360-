@echo off
title Campus 360 - Database Initializer
color 0B
echo ===================================================
echo   CAMPUS 360 - DATABASE INITIALIZER
echo ===================================================
echo.
echo Initializing database with public site content and Admin account...
echo (By default, zero student and faculty accounts are entered)
echo.

node seed.js

echo.
echo ===================================================
echo   ADMIN CREDENTIALS (TO MANAGE USERS):
echo.
echo   Portal:   Admin Control Panel
echo   Email:    admin@campus360.edu
echo   Password: admin123
echo.
echo   * Students and Faculty accounts will ONLY be added
echo     when YOU create them from Admin -> Manage Students / Faculty.
echo ===================================================
echo.

pause
