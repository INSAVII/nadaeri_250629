@echo off
echo Starting frontend development server...

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in PATH
    echo Please install npm or check your Node.js installation
    pause
    exit /b 1
)

:: Navigate to frontend directory
cd /d "D:\250624_cms01\frontend"

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

:: Start development server
echo Starting development server...
npm run dev

pause
