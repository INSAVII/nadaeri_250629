@echo off
echo ========================================
echo QName Service 전체 시작 스크립트
echo ========================================

echo 현재 디렉토리: %CD%
echo.

echo 🚀 QName 서비스 전체 시작
echo.
echo 이 스크립트는 다음을 수행합니다:
echo 1. 백엔드 서버 시작 (포트 8004)
echo 2. 프론트엔드 서버 시작 (포트 3002)
echo.
echo 각 서버는 별도의 창에서 실행됩니다.
echo.

echo 백엔드 서버를 시작합니다...
start "QName Backend" cmd /k "start_qname_service.bat"

echo.
echo 3초 후 프론트엔드 서버를 시작합니다...
timeout /t 3 /nobreak >nul

echo 프론트엔드 서버를 시작합니다...
start "QName Frontend" cmd /k "start_frontend.bat"

echo.
echo ✅ 모든 서비스가 시작되었습니다!
echo.
echo 🌐 접속 URL:
echo    - 프론트엔드: http://localhost:3002
echo    - 백엔드 API: http://localhost:8004
echo.
echo 📋 다음 단계:
echo    1. 브라우저에서 http://localhost:3002 접속
echo    2. 로그인 후 QName 페이지로 이동
echo    3. 파일 업로드 및 처리 테스트
echo.
echo 🔑 API 키 설정이 필요하다면:
echo    - processor.py 파일에서 DIRECT_GEMINI_API_KEY 설정
echo    - 자세한 방법은 SIMPLE_API_SETUP.md 참고
echo.

pause 