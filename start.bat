@echo off
title CS2 Utility Lineup Guide

:: Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo  Node.js is not installed.
    echo  Please download and install Node.js 20+ from:
    echo  https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check Node version
for /f "tokens=1 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
for /f "tokens=2 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
if %NODE_MAJOR% LSS 20 (
    echo.
    echo  Node.js 20+ is required. You have:
    node -v
    echo  Please update from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo  Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: Build frontend if needed
if not exist "dist\" (
    echo Building frontend...
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo.
        echo  Failed to build frontend.
        pause
        exit /b 1
    )
)

:: Start server and open browser
echo.
echo  Starting CS2 Utility Lineup Guide...
echo  Opening http://localhost:3001 in your browser...
echo  Press Ctrl+C to stop the server.
echo.

start "" http://localhost:3001
node server.js
