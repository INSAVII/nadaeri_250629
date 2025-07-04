@echo off
echo ========================================
echo Complete Cache Clear Script
echo ========================================
echo.

echo [1/5] Stopping all servers...
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
echo ✓ Servers stopped
echo.

echo [2/5] Clearing browser cache (manual step)...
echo Please manually clear browser cache:
echo - Chrome: Ctrl+Shift+Delete
echo - Firefox: Ctrl+Shift+Delete
echo - Edge: Ctrl+Shift+Delete
echo.
pause

echo [3/5] Clearing Parcel build cache...
cd /d D:\250624_cms01\frontend
if exist ".parcel-cache" (
    rmdir /s /q ".parcel-cache"
    echo ✓ Parcel cache cleared
) else (
    echo ✓ No Parcel cache found
)

if exist "dist" (
    rmdir /s /q "dist"
    echo ✓ Dist folder cleared
) else (
    echo ✓ No dist folder found
)

if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo ✓ Node modules cache cleared
) else (
    echo ✓ No node modules cache found
)
echo.

echo [4/5] Clearing localStorage and sessionStorage...
echo Creating cache clear HTML file...
echo ^<!DOCTYPE html^> > "D:\250624_cms01\clear_cache.html"
echo ^<html^> >> "D:\250624_cms01\clear_cache.html"
echo ^<head^>^<title^>Cache Clear^</title^>^</head^> >> "D:\250624_cms01\clear_cache.html"
echo ^<body^> >> "D:\250624_cms01\clear_cache.html"
echo ^<h1^>Clearing all cache...^</h1^> >> "D:\250624_cms01\clear_cache.html"
echo ^<script^> >> "D:\250624_cms01\clear_cache.html"
echo localStorage.clear(); >> "D:\250624_cms01\clear_cache.html"
echo sessionStorage.clear(); >> "D:\250624_cms01\clear_cache.html"
echo console.log('All cache cleared!'); >> "D:\250624_cms01\clear_cache.html"
echo alert('All cache cleared! Please close this tab and refresh your main page.'); >> "D:\250624_cms01\clear_cache.html"
echo ^</script^> >> "D:\250624_cms01\clear_cache.html"
echo ^</body^>^</html^> >> "D:\250624_cms01\clear_cache.html"

echo ✓ Cache clear HTML file created
echo Please open: D:\250624_cms01\clear_cache.html
echo.

echo [5/5] Restarting development servers...
echo Starting frontend...
start "Frontend Server" cmd /k "cd /d D:\250624_cms01\frontend && npm run dev-clean"

echo Starting backend...
start "Backend Server" cmd /k "cd /d D:\250624_cms01\services\main-api && uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

echo.
echo ========================================
echo Cache Clear Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open clear_cache.html in your browser
echo 2. Wait for the alert message
echo 3. Close the tab and refresh your main page
echo 4. All cache should be completely cleared
echo.
pause 