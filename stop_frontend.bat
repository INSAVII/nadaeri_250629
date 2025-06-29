@echo off
echo ========================================
echo Frontend 서버 중지 스크립트
echo ========================================

echo 포트 3002에서 실행 중인 Node.js 프로세스를 찾아 중지합니다...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do (
    echo 프로세스 ID %%a 중지 중...
    taskkill /f /pid %%a
    if !errorlevel! equ 0 (
        echo 성공적으로 중지되었습니다.
    ) else (
        echo 중지 실패 또는 이미 종료된 프로세스입니다.
    )
)

echo.
echo 모든 Node.js 프로세스 중지:
taskkill /f /im node.exe 2>nul
if %errorlevel% equ 0 (
    echo 모든 Node.js 프로세스가 중지되었습니다.
) else (
    echo 실행 중인 Node.js 프로세스가 없습니다.
)

echo.
echo Frontend 서버 중지 완료.
pause 