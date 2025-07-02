@echo off
echo ========================================
echo   CMS 프로젝트 완전 초기화 스크립트
echo ========================================

echo.
echo 1. 프론트엔드 캐시 삭제 중...
cd frontend
if exist node_modules rmdir /s /q node_modules
if exist .next rmdir /s /q .next
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
npm cache clean --force
echo 프론트엔드 캐시 삭제 완료!

echo.
echo 2. 의존성 재설치 중...
npm install
echo 의존성 재설치 완료!

cd ..

echo.
echo 3. 백엔드 admin 계정 확인 중...
cd services\main-api
python scripts\ensure_admin_user.py
cd ..\..

echo.
echo ========================================
echo   완전 초기화 완료!
echo ========================================
echo.
echo 다음 단계:
echo 1. 브라우저를 완전히 종료하세요
echo 2. 시크릿/프라이빗 모드로 브라우저를 여세요
echo 3. localhost:3003으로 접속하세요
echo 4. admin/admin으로 로그인하세요
echo.
echo 주의: 자동 로그인이 비활성화되었습니다
echo 모든 인증은 DB 기반으로만 처리됩니다
echo.
pause
