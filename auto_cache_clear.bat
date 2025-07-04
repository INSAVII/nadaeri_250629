@echo off
chcp 65001 >nul
echo ========================================
echo Auto Cache Clear (자동 캐시 클리어)
echo ========================================
echo.
echo This script will automatically clear cache:
echo - Stop servers
echo - Clear Parcel cache
echo - Clear localStorage
echo - Restart servers
echo.
echo Running automatically every 5 minutes...
echo.

:loop
echo [%date% %time%] Auto cache clear started...

echo Stopping servers...
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
taskkill /f /im uvicorn.exe 2>nul

echo Clearing frontend cache...
cd /d D:\250624_cms01\frontend
if exist ".parcel-cache" rmdir /s /q ".parcel-cache"
if exist "dist" rmdir /s /q "dist"

echo Creating cache clear HTML...
cd /d D:\250624_cms01
echo ^<!DOCTYPE html^> > "auto_clear.html"
echo ^<html^> >> "auto_clear.html"
echo ^<head^>^<title^>Auto Clear^</title^>^</head^> >> "auto_clear.html"
echo ^<body^> >> "auto_clear.html"
echo ^<h1^>Auto Cache Clear^</h1^> >> "auto_clear.html"
echo ^<script^> >> "auto_clear.html"
echo localStorage.clear(); >> "auto_clear.html"
echo sessionStorage.clear(); >> "auto_clear.html"
echo console.log('Auto cache clear completed'); >> "auto_clear.html"
echo ^</script^> >> "auto_clear.html"
echo ^</body^>^</html^> >> "auto_clear.html"

echo Starting servers...
start "Frontend" cmd /k "cd /d D:\250624_cms01\frontend && npm run dev-clean"
start "Backend" cmd /k "cd /d D:\250624_cms01\services\main-api && uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

echo [%date% %time%] Auto cache clear completed
echo Waiting 5 minutes before next clear...
echo.

timeout /t 300 /nobreak >nul
goto loop 