@echo off
chcp 65001 >nul
echo 🚀 QName 서비스 URL 업데이트 중...

REM 1. 실제 QName 서비스 URL로 업데이트 (예시 URL)
set QNAME_SERVICE_URL=https://qname-service-production.up.railway.app

echo URL: %QNAME_SERVICE_URL%

REM 2. PowerShell을 사용해 constants.ts 업데이트
powershell -Command "(Get-Content frontend\src\config\constants.ts) -replace 'https://qname-service-production.up.railway.app', '%QNAME_SERVICE_URL%' | Set-Content frontend\src\config\constants.ts -Encoding UTF8"

REM 3. Vercel 환경변수 설정 안내
echo.
echo 📋 Vercel 환경변수 설정 필요:
echo REACT_APP_QNAME_API_URL=%QNAME_SERVICE_URL%
echo.

REM 4. 변경사항 Git 커밋
git add frontend\src\config\constants.ts
git commit -m "🔧 QName 서비스 URL 업데이트: %QNAME_SERVICE_URL%"
git push origin main

echo ✅ QName 서비스 URL 업데이트 완료!
echo.
echo 🔄 다음 단계:
echo 1. Vercel에서 REACT_APP_QNAME_API_URL 환경변수 설정
echo 2. Vercel 재배포 (자동으로 시작됨)
echo 3. 큐네임 기능 테스트

pause
