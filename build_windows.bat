@echo off
REM My Lab LIMS - Windows Build Script (Batch)
REM This script builds the Windows executable using Electron Builder

setlocal enabledelayedexpansion

echo ==========================================
echo My Lab LIMS - Windows Build Process
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo Error: Node.js is not installed. Please install Node.js 20.0.0 or higher.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo npm version: %NPM_VERSION%
echo.

REM Install dependencies
echo Installing dependencies...
call npm ci
if errorlevel 1 (
    echo Trying npm install instead...
    call npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)
echo Dependencies installed successfully
echo.

REM Build the Vite project
echo Building Vite project...
call npm run build
if errorlevel 1 (
    echo Error: Vite build failed
    pause
    exit /b 1
)
echo Vite build completed
echo.

REM Build Windows executable
echo Building Windows executable with Electron Builder...
call npm run electron:build
if errorlevel 1 (
    echo Error: Electron build failed
    pause
    exit /b 1
)
echo Windows build completed
echo.

REM Check if build was successful
if exist "dist-electron" (
    echo ==========================================
    echo Build Successful!
    echo ==========================================
    echo.
    echo Output directory: dist-electron\
    echo.
    dir /s /b dist-electron\*.exe dist-electron\*.msi 2>nul
    echo.
    pause
) else (
    echo Error: Build failed. Output directory not found.
    pause
    exit /b 1
)
