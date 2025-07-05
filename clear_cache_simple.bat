@echo off
chcp 65001 >nul
echo ========================================
echo React Cache Clear Tool
echo ========================================

echo.
echo 1. Stopping Node.js processes...
taskkill /f /im node.exe 2>nul
echo    Node.js processes stopped

echo.
echo 2. Stopping Python processes...
taskkill /f /im python.exe 2>nul
echo    Python processes stopped

echo.
echo 3. Cleaning frontend cache...
cd frontend
if exist node_modules (
    echo    Removing node_modules...
    rmdir /s /q node_modules
    echo    node_modules removed
)

if exist .next (
    echo    Removing .next folder...
    rmdir /s /q .next
    echo    .next folder removed
)

if exist .cache (
    echo    Removing .cache folder...
    rmdir /s /q .cache
    echo    .cache folder removed
)

echo.
echo 4. Cleaning backend cache...
cd ..\services\main-api
if exist __pycache__ (
    echo    Removing main-api __pycache__...
    rmdir /s /q __pycache__
    echo    main-api __pycache__ removed
)

cd ..\qname-service
if exist __pycache__ (
    echo    Removing qname-service __pycache__...
    rmdir /s /q __pycache__
    echo    qname-service __pycache__ removed
)

cd ..\..

echo.
echo 5. Cleaning temporary files...
del /q temp_*.xlsx 2>nul
del /q output_*.xlsx 2>nul
echo    Temporary files cleaned

echo.
echo ========================================
echo Cache cleaning completed!
echo ========================================
echo.
echo Next steps:
echo 1. Clear browser cache: Ctrl+Shift+Delete
echo 2. Hard refresh browser: Ctrl+F5
echo 3. Restart servers:
echo    - Main API: cd services\main-api ^&^& python main.py
echo    - QName: cd services\qname-service ^&^& python main.py
echo    - Frontend: cd frontend ^&^& npm start
echo.
pause 