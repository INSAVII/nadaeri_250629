@echo off
chcp 65001 >nul
echo ========================================
echo QClick Railway 배포 스크립트 (UTF-8)
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

echo 4. UTF-8 환경변수 설정 안내...
echo 다음 환경변수들을 Railway 대시보드에서 설정하세요:
echo.
echo [필수 환경변수]
echo - DATABASE_URL=postgresql://...
echo - JWT_SECRET=your_secret_key
echo - GEMINI_API_KEY=your_gemini_key
echo - OPENAI_API_KEY=your_openai_key
echo - NAVER_CLIENT_ID=your_naver_id
echo - NAVER_CLIENT_SECRET=your_naver_secret
echo - CORS_ORIGINS=https://your-frontend-domain.vercel.app
echo.
echo [UTF-8 인코딩 환경변수]
echo - LANG=C.UTF-8
echo - LC_ALL=C.UTF-8
echo - PYTHONIOENCODING=utf-8
echo - PYTHONUNBUFFERED=1
echo.

echo 5. 배포 실행...
railway up

echo 6. 배포 완료!
echo 서비스 URL을 확인하세요: railway status
echo 헬스체크: https://your-app-name.railway.app/health

pause
