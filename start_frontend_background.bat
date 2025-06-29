@echo off
echo ========================================
echo Frontend 서버 백그라운드 시작 스크립트
echo ========================================

echo 현재 디렉토리: %CD%
echo.

echo 1. Node.js 환경 확인...
node --version
if %errorlevel% neq 0 (
    echo 오류: Node.js가 설치되지 않았습니다.
    echo https://nodejs.org 에서 Node.js를 설치해주세요.
    pause
    exit /b 1
)

echo.
echo 2. Frontend 디렉토리로 이동...
cd frontend
if %errorlevel% neq 0 (
    echo 오류: frontend 디렉토리를 찾을 수 없습니다.
    pause
    exit /b 1
)

echo 현재 디렉토리: %CD%
echo.

echo 3. 필요한 패키지 확인...
if not exist node_modules (
    echo node_modules가 없습니다. 패키지를 설치합니다...
    npm install
    if %errorlevel% neq 0 (
        echo 패키지 설치 실패. 수동으로 설치해주세요:
        echo npm install
        pause
    )
)

echo.
echo 4. Frontend 서버 백그라운드 시작...
echo 포트: 3002
echo URL: http://localhost:3002
echo.
echo 서버가 백그라운드에서 실행됩니다.
echo 서비스를 중지하려면 stop_frontend.bat를 실행하세요.
echo.

start /B npx parcel src/index.html --port 3002

echo 서버가 백그라운드에서 시작되었습니다.
echo 브라우저에서 http://localhost:3002 로 접속하세요.
pause 