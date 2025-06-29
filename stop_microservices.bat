@echo off
echo ========================================
echo QClick 마이크로서비스 중지
echo ========================================
echo.

echo 포트 8001, 8002, 8003에서 실행 중인 Python 프로세스를 종료합니다...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001') do (
    echo 포트 8001 프로세스 종료: %%a
    taskkill /f /pid %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8002') do (
    echo 포트 8002 프로세스 종료: %%a
    taskkill /f /pid %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8003') do (
    echo 포트 8003 프로세스 종료: %%a
    taskkill /f /pid %%a 2>nul
)

echo.
echo 모든 마이크로서비스가 중지되었습니다.
echo.
pause 