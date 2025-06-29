@echo off
echo ========================================
echo 안전한 Frontend 개발 서버 시작
echo ========================================

echo 현재 디렉토리: %CD%
echo.

echo 1. 기존 프로세스 정리...
taskkill /f /im node.exe 2>nul
if %errorlevel% equ 0 (
    echo 기존 Node.js 프로세스 종료 완료
) else (
    echo 실행 중인 Node.js 프로세스 없음
)

echo.
echo 2. 캐시 정리...
if exist .parcel-cache (
    rmdir /s /q .parcel-cache
    echo Parcel 캐시 삭제 완료
) else (
    echo Parcel 캐시 없음
)

if exist dist (
    rmdir /s /q dist
    echo 빌드 폴더 삭제 완료
) else (
    echo 빌드 폴더 없음
)

echo.
echo 3. 의존성 확인...
if not exist node_modules (
    echo node_modules 설치 중...
    npm install
    if %errorlevel% neq 0 (
        echo 패키지 설치 실패!
        pause
        exit /b 1
    )
)

echo.
echo 4. 안전한 개발 서버 시작...
echo 포트: 3002
echo URL: http://localhost:3002
echo 캐시: 비활성화 (--no-cache)
echo.
echo 서버가 안전하게 시작됩니다.
echo 변경사항이 즉시 반영됩니다.
echo.

npm run dev-clean

echo.
echo 서버 시작 완료!
echo 브라우저에서 http://localhost:3002 로 접속하세요.
pause 