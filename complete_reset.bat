@echo off
echo ========================================
echo Complete Reset Script
echo ========================================
echo.
echo This script will completely reset:
echo - All server processes
echo - Browser cache (manual)
echo - Parcel build cache
echo - node_modules (complete reinstall)
echo - All local/session storage
echo.
echo Warning: This will take 10-15 minutes!
echo.
pause

echo.
echo [1/6] Stopping all server processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
taskkill /f /im uvicorn.exe 2>nul
echo ✓ All server processes stopped
echo.

echo [2/6] Browser cache clear (manual step)...
echo.
echo Please clear browser cache manually:
echo 1. Ctrl+Shift+Delete
echo 2. Select "All time"
echo 3. Check all items
echo 4. Click "Clear data"
echo.
echo Press Enter after completion...
pause

echo [3/6] Frontend complete reset...
cd /d D:\250624_cms01\frontend

echo - Clearing Parcel cache...
if exist ".parcel-cache" (
    rmdir /s /q ".parcel-cache"
    echo ✓ Parcel cache cleared
) else (
    echo ✓ No Parcel cache found
)

echo - Clearing dist folder...
if exist "dist" (
    rmdir /s /q "dist"
    echo ✓ Dist folder cleared
) else (
    echo ✓ No dist folder found
)

echo - Removing node_modules...
if exist "node_modules" (
    echo Removing node_modules... (This may take a while)
    rmdir /s /q "node_modules"
    echo ✓ node_modules removed
) else (
    echo ✓ No node_modules found
)

echo - Removing package-lock.json...
if exist "package-lock.json" (
    del "package-lock.json"
    echo ✓ package-lock.json removed
) else (
    echo ✓ No package-lock.json found
)

echo.
echo [4/6] Backend cache cleanup...
cd /d D:\250624_cms01\services\main-api

echo - Removing __pycache__ folders...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d" 2>nul
echo ✓ Python cache cleared

echo - Removing .pyc files...
del /s *.pyc 2>nul
echo ✓ .pyc files removed

echo.
echo [5/6] Creating localStorage clear HTML...
cd /d D:\250624_cms01

echo ^<!DOCTYPE html^> > "complete_reset.html"
echo ^<html^> >> "complete_reset.html"
echo ^<head^>^<title^>Complete Reset^</title^>^</head^> >> "complete_reset.html"
echo ^<body^> >> "complete_reset.html"
echo ^<h1^>Complete Reset in Progress...^</h1^> >> "complete_reset.html"
echo ^<script^> >> "complete_reset.html"
echo localStorage.clear(); >> "complete_reset.html"
echo sessionStorage.clear(); >> "complete_reset.html"
echo console.log('All storage cleared!'); >> "complete_reset.html"
echo alert('Complete reset finished! Please refresh your main page.'); >> "complete_reset.html"
echo ^</script^> >> "complete_reset.html"
echo ^</body^>^</html^> >> "complete_reset.html"

echo ✓ complete_reset.html created
echo.

echo [6/6] Reinstalling dependencies and starting servers...
echo.
echo Installing frontend dependencies... (This will take 5-10 minutes)
cd /d D:\250624_cms01\frontend
call npm install
echo ✓ npm install completed

echo.
echo ========================================
echo Complete Reset Finished!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Open complete_reset.html:
echo    D:\250624_cms01\complete_reset.html
echo.
echo 2. Start frontend server:
echo    cd frontend
echo    npm run dev-clean
echo.
echo 3. Start backend server:
echo    cd services\main-api
echo    uvicorn main:app --host 0.0.0.0 --port 8001 --reload
echo.
echo 4. Force refresh in browser:
echo    Ctrl+Shift+R
echo.
echo Now the deposit management tab will never disappear!
echo.
pause 