@echo off
echo 실행 중인 프로세스 정리 중...

:: 백엔드(Python) 및 프론트엔드(Node) 프로세스 종료
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul

echo 모든 프로세스가 종료되었습니다.
echo 서버를 다시 시작하려면 run_servers.bat을 실행하세요.
pause
