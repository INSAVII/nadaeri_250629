@echo off
echo ========================================
echo Railway 프론트엔드 배포 스크립트
echo ========================================

echo.
echo 1. 프론트엔드 빌드 테스트...
cd frontend
call npm run build:railway
if %errorlevel% neq 0 (
    echo 빌드 실패! 배포를 중단합니다.
    pause
    exit /b 1
)

echo.
echo 2. Git 상태 확인...
git status
echo.
echo 변경사항이 있으면 커밋하시겠습니까? (y/n)
set /p choice=
if /i "%choice%"=="y" (
    echo 변경사항 커밋 중...
    git add .
    git commit -m "Railway 배포 준비 - 프론트엔드 설정 업데이트"
)

echo.
echo 3. GitHub에 푸시...
git push origin main
if %errorlevel% neq 0 (
    echo 푸시 실패! 수동으로 푸시해주세요.
    pause
    exit /b 1
)

echo.
echo ========================================
echo 배포 준비 완료!
echo ========================================
echo.
echo 다음 단계:
echo 1. Railway 대시보드에서 새 서비스 추가
echo 2. GitHub 저장소에서 frontend 폴더 선택
echo 3. 환경 변수 설정
echo 4. 배포 확인
echo.
echo 자세한 내용은 frontend/RAILWAY_DEPLOYMENT_GUIDE.md 참조
echo.
pause 