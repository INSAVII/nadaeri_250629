@echo off
echo 🚀 배포 환경 미리보기 시작
echo ================================

echo 📁 현재 디렉토리: %CD%
echo 🔄 Git 브랜치 확인 중...
git branch --show-current

echo.
echo 🎯 배포 환경 설정:
echo - 프론트엔드: http://localhost:3003 (빌드된 버전)
echo - 메인 API: http://localhost:8001 (프로덕션 모드)
echo - 큐네임 서비스: https://qname.나대리.kr
echo - 큐텍스트 서비스: https://qtext.나대리.kr

echo.
echo ⚠️  주의사항:
echo - 이는 실제 배포 환경과 동일한 설정입니다
echo - 프로덕션 데이터베이스에 연결됩니다
echo - 실제 사용자 데이터가 영향을 받을 수 있습니다

echo.
echo 🚀 배포 환경 서버들을 시작합니다...
echo.

REM 프론트엔드 빌드
echo 📱 프론트엔드 빌드 중...
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 프론트엔드 빌드 실패
    pause
    exit /b 1
)

REM 프론트엔드 프로덕션 서버 시작
echo 📱 프론트엔드 프로덕션 서버 시작...
start "Frontend Production Server" cmd /k "cd frontend && npm run preview"

REM 잠시 대기
timeout /t 3 /nobreak > nul

REM 백엔드 프로덕션 서버 시작
echo 🔧 백엔드 프로덕션 서버 시작...
start "Backend Production Server" cmd /k "cd services/main-api && gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001"

echo.
echo ✅ 배포 환경 서버가 시작되었습니다!
echo.
echo 🌐 접속 URL:
echo - 프론트엔드: http://localhost:3003
echo - 메인 API: http://localhost:8001
echo - 큐네임 API: https://qname.나대리.kr
echo - 큐텍스트 API: https://qtext.나대리.kr
echo.
echo 🔧 주의사항:
echo - 실제 프로덕션 환경과 동일한 설정입니다
echo - 데이터 변경 시 실제 서비스에 영향을 줍니다
echo - 테스트 완료 후 서버를 종료하세요
echo.
pause 