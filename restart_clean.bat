@echo off
echo ========================================
echo 강력한 캐시 클리어 및 서버 재시작
echo ========================================

echo 1. 모든 서버 중지...
call stop_servers.bat

echo 2. 프론트엔드 캐시 클리어...
cd frontend
rmdir /s /q .parcel-cache 2>nul
rmdir /s /q dist 2>nul
rmdir /s /q node_modules\.cache 2>nul

echo 3. 백엔드 캐시 클리어...
cd ..\services\main-api
rmdir /s /q __pycache__ 2>nul
del /q *.pyc 2>nul

echo 4. 3초 대기...
timeout /t 3 /nobreak >nul

echo 5. 서버 재시작...
cd ..\..
call run_servers.bat

echo ========================================
echo 캐시 클리어 및 재시작 완료!
echo 브라우저에서 Ctrl+Shift+R로 강제 새로고침하세요.
echo ========================================
pause
