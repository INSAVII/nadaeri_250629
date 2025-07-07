@echo off
chcp 65001 >nul
echo ========================================
echo    큐네임3번 프론트엔드 캐시 완전 삭제
echo ========================================
echo.

cd /d %~dp0
cd frontend

echo [1/8] Node.js 모듈 삭제 중...
REM node_modules 폴더 삭제
if exist node_modules (
    echo   - node_modules 폴더 삭제 중... (시간이 오래 걸릴 수 있습니다)
    rmdir /s /q node_modules
    echo   - node_modules 폴더 삭제 완료
) else (
    echo   - node_modules 폴더가 없습니다
)

echo [2/8] Parcel 캐시 삭제 중...
REM .parcel-cache 폴더 삭제
if exist .parcel-cache (
    rmdir /s /q .parcel-cache
    echo   - .parcel-cache 폴더 삭제 완료
) else (
    echo   - .parcel-cache 폴더가 없습니다
)

echo [3/8] 빌드 결과물 삭제 중...
REM dist 폴더 삭제
if exist dist (
    rmdir /s /q dist
    echo   - dist 폴더 삭제 완료
) else (
    echo   - dist 폴더가 없습니다
)

echo [4/8] npm 락 파일 삭제 중...
REM package-lock.json 삭제
if exist package-lock.json (
    del /q package-lock.json
    echo   - package-lock.json 삭제 완료
) else (
    echo   - package-lock.json 파일이 없습니다
)

echo [5/8] npm 캐시 정리 중...
REM npm 캐시 정리
call npm cache clean --force
echo   - npm 캐시 정리 완료

echo [6/8] TypeScript 캐시 삭제 중...
REM TypeScript 관련 캐시 파일 삭제
if exist .tsbuildinfo (
    del /q .tsbuildinfo
    echo   - .tsbuildinfo 삭제 완료
) else (
    echo   - .tsbuildinfo 파일이 없습니다
)

echo [7/8] 환경 설정 파일 정리 중...
REM .env 파일 확인
if exist .env (
    echo   - .env 파일이 존재합니다 (삭제하지 않음)
) else (
    echo   - .env 파일이 없습니다
)

echo [8/8] 임시 파일 삭제 중...
REM 임시 파일들 삭제
for %%f in (*.tmp *.log) do (
    if exist "%%f" (
        del /q "%%f"
        echo   - %%f 삭제 완료
    )
)

echo.
echo ========================================
echo [완료] 큐네임3번 프론트엔드 캐시/임시파일 삭제 완료
echo ========================================
echo.
echo 다음 단계:
echo 1. npm install --legacy-peer-deps 실행
echo 2. 또는 npm install --force 실행
echo 3. npm start로 서버 시작
echo.
pause 