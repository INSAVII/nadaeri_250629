@echo off
echo 🚀 개발 환경 서버 시작
echo ================================

echo 📁 현재 디렉토리: %CD%
echo 🔄 Git 브랜치 확인 중...
git branch --show-current

echo.
echo 🎯 개발 환경 설정:
echo - 프론트엔드: http://localhost:3003
echo - 메인 API: http://localhost:8001
echo - 큐네임 서비스: http://localhost:8004
echo - 큐텍스트 서비스: http://localhost:8003

echo.
echo ⚠️  주의사항:
echo - 개발 환경에서는 로컬 서버를 사용합니다
echo - 배포 환경과 다른 설정을 사용합니다
echo - 문제 발생 시 캐시 클리어를 시도하세요

echo.
echo 🚀 서버들을 시작합니다...
echo.

REM 프론트엔드 개발 서버 시작
echo 📱 프론트엔드 개발 서버 시작...
start "Frontend Dev Server" cmd /k "cd frontend && npm run dev"

REM 잠시 대기
timeout /t 3 /nobreak > nul

REM 백엔드 개발 서버 시작
echo 🔧 백엔드 개발 서버 시작...
start "Backend Dev Server" cmd /k "cd services/main-api && python main.py"

REM 잠시 대기
timeout /t 3 /nobreak > nul

REM 큐네임 서비스 시작
echo 🏷️  큐네임 서비스 시작...
start "QName Service" cmd /k "cd services/qname-service && python main.py"

REM 잠시 대기
timeout /t 3 /nobreak > nul

REM 큐텍스트 서비스 시작
echo 📝 큐텍스트 서비스 시작...
start "QText Service" cmd /k "cd services/qtext-service && python main.py"

echo.
echo ✅ 모든 개발 서버가 시작되었습니다!
echo.
echo 🌐 접속 URL:
echo - 프론트엔드: http://localhost:3003
echo - 메인 API: http://localhost:8001
echo - 큐네임 API: http://localhost:8004
echo - 큐텍스트 API: http://localhost:8003
echo.
echo 🔧 문제 해결:
echo - 캐시 클리어: http://localhost:3003/clear-cache
echo - 강제 캐시 클리어: http://localhost:3003/force-clear-cache
echo.
pause 