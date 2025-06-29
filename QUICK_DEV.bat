@echo off
title QClick 개발용 빠른 시작
color 0B

echo ========================================
echo     QClick 개발용 빠른 시작 (QText)    
echo ========================================
echo.
echo 🚀 QText 서비스 개발에 필요한 최소 구성만 시작합니다...
echo.

REM 기존 프로세스 정리
taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul
timeout /t 1 /nobreak >nul

REM QText 서비스만 시작 (가장 빠른 개발용)
echo 🔤 QText 서비스 시작... (포트 8003)
start "QText Service" cmd /k "cd /d D:\250624_cms01\services\qtext-service && python main.py"
timeout /t 2 /nobreak >nul

REM 프론트엔드 시작
echo 🌐 프론트엔드 시작... (포트 3002)  
start "Frontend" cmd /k "cd /d D:\250624_cms01\frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ✅ 개발용 최소 구성 시작 완료!
echo.
echo 📋 접속 정보:
echo  🔤 QText 테스트: http://localhost:3002/qtext
echo.

REM 브라우저 자동 열기
start http://localhost:3002/qtext

pause
