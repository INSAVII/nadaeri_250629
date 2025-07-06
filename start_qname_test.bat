@echo off
echo ========================================
echo    QName 서비스 테스트 실행 스크립트
echo ========================================
echo.

echo 1. 메인 API 서버 시작...
cd services\main-api
start "Main API" python main.py
cd ..\..

echo 2. QName 서비스 시작...
cd services\qname-service
start "QName Service" python main.py
cd ..\..

echo 3. QText 서비스 시작...
cd services\qtext-service
start "QText Service" python main.py
cd ..\..

echo.
echo ========================================
echo    모든 서비스가 시작되었습니다!
echo ========================================
echo.
echo 서비스 URL:
echo - 프론트엔드: http://localhost:3003
echo - 메인 API: http://localhost:8001
echo - QName 서비스: http://localhost:8004
echo - QText 서비스: http://localhost:8003
echo.
echo 테스트 순서:
echo 1. 브라우저에서 http://localhost:3003 접속
echo 2. 로그인 후 QName 서비스 페이지로 이동
echo 3. 엑셀 파일 업로드 테스트
echo.
pause 