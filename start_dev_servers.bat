@echo off
echo ========================================
echo QClick 개발 서버 시작
echo ========================================

echo 현재 디렉토리: %CD%
echo.

echo 🚀 개발 서버 시작
echo.
echo 이 스크립트는 다음을 수행합니다:
echo 1. 백엔드 서버 시작 (포트 8001)
echo 2. 프론트엔드 서버 시작 (포트 3003)
echo.
echo 각 서버는 별도의 창에서 실행됩니다.
echo.

echo 백엔드 서버를 시작합니다...
start "QClick Backend" cmd /k "cd /d %CD%\services\main-api && python main.py"

echo.
echo 3초 후 프론트엔드 서버를 시작합니다...
timeout /t 3 /nobreak >nul

echo 프론트엔드 서버를 시작합니다...
start "QClick Frontend" cmd /k "cd /d %CD%\frontend && npm start"

echo.
echo ✅ 모든 서비스가 시작되었습니다!
echo.
echo 🌐 접속 URL:
echo    - 프론트엔드: http://localhost:3003
echo    - 백엔드 API: http://localhost:8001
echo    - API 문서: http://localhost:8001/docs
echo.
echo 📋 다음 단계:
echo    1. 브라우저에서 http://localhost:3003 접속
echo    2. 관리자로 로그인
echo    3. 관리자 대시보드에서 "🔐 프로그램 권한 관리" 클릭
echo    4. 새로운 리팩터링된 컴포넌트 테스트
echo.
echo 🔧 개발 도구:
echo    - API 테스트: http://localhost:8001/docs
echo    - 상태 확인: http://localhost:8001/health
echo.

pause 