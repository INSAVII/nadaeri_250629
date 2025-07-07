@echo off
chcp 65001 >nul
echo ========================================
echo QClick Railway 배포 스크립트
echo ========================================

cd /d "%~dp0..\services\main-api"

echo 1. Railway CLI 설치 확인...
railway --version >nul 2>&1
if errorlevel 1 (
    echo Railway CLI가 설치되지 않았습니다. 설치 중...
    npm install -g @railway/cli
)

echo 2. Railway 로그인 확인...
railway whoami >nul 2>&1
if errorlevel 1 (
    echo Railway 로그인이 필요합니다.
    railway login
)

echo 3. 프로젝트 연결 확인...
railway status >nul 2>&1
if errorlevel 1 (
    echo 프로젝트를 연결해야 합니다.
    railway init
)

echo 4. 환경변수 설정...
echo 환경변수를 설정하세요:
echo - DATABASE_URL
echo - JWT_SECRET
echo - GEMINI_API_KEY
echo - OPENAI_API_KEY
echo - NAVER_CLIENT_ID
echo - NAVER_CLIENT_SECRET
echo - CORS_ORIGINS

echo 5. 배포 실행...
railway up

echo 6. 배포 완료!
echo 서비스 URL: https://your-app-name.railway.app
echo 헬스체크: https://your-app-name.railway.app/health

pause 
