@echo off
echo ========================================
echo QClick 마이크로서비스 시작
echo ========================================
echo.

echo 메인 API 서버 시작 (포트 8001)...
start "Main API Server" cmd /k "cd services\main-api && python main.py"

echo.
echo 3초 대기...
timeout /t 3 /nobreak > nul

echo 큐네임 서비스 시작 (포트 8002)...
start "QName Service" cmd /k "cd services\qname-service && python main.py"

echo.
echo 3초 대기...
timeout /t 3 /nobreak > nul

echo 큐문자 서비스 시작 (포트 8003)...
start "QText Service" cmd /k "cd services\qtext-service && python main.py"

echo.
echo ========================================
echo 모든 마이크로서비스가 시작되었습니다!
echo ========================================
echo.
echo 서비스 포트:
echo - 메인 API: http://localhost:8001
echo - 큐네임 서비스: http://localhost:8002
echo - 큐문자 서비스: http://localhost:8003
echo.
echo 프론트엔드: http://localhost:3000
echo.
pause 