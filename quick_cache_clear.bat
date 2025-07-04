@echo off
echo ========================================
echo Quick Cache Clear
echo ========================================
echo.
echo This will clear all cache quickly:
echo - Stop all servers
echo - Clear Parcel cache
echo - Clear localStorage
echo - Restart servers
echo.
pause

echo.
echo [1/4] Stopping servers...
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
taskkill /f /im uvicorn.exe 2>nul
echo ✓ Servers stopped

echo.
echo [2/4] Clearing frontend cache...
cd /d D:\250624_cms01\frontend
if exist ".parcel-cache" rmdir /s /q ".parcel-cache"
if exist "dist" rmdir /s /q "dist"
echo ✓ Frontend cache cleared

echo.
echo [3/4] Creating cache clear HTML...
cd /d D:\250624_cms01
echo ^<!DOCTYPE html^> > "quick_clear.html"
echo ^<html^> >> "quick_clear.html"
echo ^<head^>^<title^>Quick Clear^</title^>^</head^> >> "quick_clear.html"
echo ^<body^> >> "quick_clear.html"
echo ^<h1^>Cache Cleared!^</h1^> >> "quick_clear.html"
echo ^<script^> >> "quick_clear.html"
echo localStorage.clear(); >> "quick_clear.html"
echo sessionStorage.clear(); >> "quick_clear.html"
echo alert('Cache cleared! Please refresh your page.'); >> "quick_clear.html"
echo ^</script^> >> "quick_clear.html"
echo ^</body^>^</html^> >> "quick_clear.html"
echo ✓ Cache clear HTML created

echo.
echo [4/4] Starting servers...
echo Starting frontend...
start "Frontend" cmd /k "cd /d D:\250624_cms01\frontend && npm run dev-clean"
echo Starting backend...
start "Backend" cmd /k "cd /d D:\250624_cms01\services\main-api && uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

echo.
echo ========================================
echo Quick Cache Clear Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open: D:\250624_cms01\quick_clear.html
echo 2. Press Ctrl+Shift+R in your browser
echo 3. Check CMS page
echo.
pause 