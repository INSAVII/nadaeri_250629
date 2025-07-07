@echo off
chcp 65001 >nul
echo ========================================
echo      전체 시스템 캐시 완전 삭제
echo ========================================
echo.
echo 이 스크립트는 다음을 삭제합니다:
echo - 모든 Python 캐시 파일
echo - 모든 Node.js 모듈 및 캐시
echo - 모든 빌드 결과물
echo - 모든 로그 파일
echo.
echo 계속하시겠습니까? (Y/N)
set /p choice=
if /i not "%choice%"=="Y" goto :end

echo.
echo ========================================
echo   1단계: QName API 캐시 삭제
echo ========================================
cd /d %~dp0
cd services\qname-service

echo [QName] Python 캐시 파일 삭제 중...
if exist __pycache__ (
    rmdir /s /q __pycache__
    echo   - __pycache__ 폴더 삭제 완료
)

for /r . %%f in (*.pyc) do (
    if exist "%%f" del /q "%%f"
)

if exist logs (
    rmdir /s /q logs
    echo   - logs 폴더 삭제 완료
)

if exist data\category_vector_cache.pkl (
    del /q data\category_vector_cache.pkl
    echo   - category_vector_cache.pkl 삭제 완료
)

echo.
echo ========================================
echo   2단계: 메인 백엔드 캐시 삭제
echo ========================================
cd /d %~dp0
cd services\main-api

echo [Backend] Python 캐시 파일 삭제 중...
if exist __pycache__ (
    rmdir /s /q __pycache__
    echo   - __pycache__ 폴더 삭제 완료
)

for /d /r . %%d in (__pycache__) do (
    if exist "%%d" rmdir /s /q "%%d"
)

for /r . %%f in (*.pyc) do (
    if exist "%%f" del /q "%%f"
)

if exist logs (
    rmdir /s /q logs
    echo   - logs 폴더 삭제 완료
)

echo.
echo ========================================
echo   3단계: 프론트엔드 캐시 삭제
echo ========================================
cd /d %~dp0
cd frontend

echo [Frontend] Node.js 모듈 삭제 중...
if exist node_modules (
    echo   - node_modules 폴더 삭제 중... (시간이 오래 걸릴 수 있습니다)
    rmdir /s /q node_modules
    echo   - node_modules 폴더 삭제 완료
)

if exist .parcel-cache (
    rmdir /s /q .parcel-cache
    echo   - .parcel-cache 폴더 삭제 완료
)

if exist dist (
    rmdir /s /q dist
    echo   - dist 폴더 삭제 완료
)

if exist package-lock.json (
    del /q package-lock.json
    echo   - package-lock.json 삭제 완료
)

echo [Frontend] npm 캐시 정리 중...
call npm cache clean --force
echo   - npm 캐시 정리 완료

if exist .tsbuildinfo (
    del /q .tsbuildinfo
    echo   - .tsbuildinfo 삭제 완료
)

echo.
echo ========================================
echo   4단계: QText 서비스 캐시 삭제
echo ========================================
cd /d %~dp0
cd services\qtext-service

echo [QText] Python 캐시 파일 삭제 중...
if exist __pycache__ (
    rmdir /s /q __pycache__
    echo   - __pycache__ 폴더 삭제 완료
)

for /r . %%f in (*.pyc) do (
    if exist "%%f" del /q "%%f"
)

if exist results (
    rmdir /s /q results
    echo   - results 폴더 삭제 완료
)

echo.
echo ========================================
echo   5단계: 전역 캐시 정리
echo ========================================
cd /d %~dp0

echo [Global] 임시 파일 삭제 중...
for /r . %%f in (*.tmp *.log) do (
    if exist "%%f" del /q "%%f"
)

echo.
echo ========================================
echo [완료] 전체 시스템 캐시 삭제 완료
echo ========================================
echo.
echo 다음 단계:
echo 1. 백엔드 서버들 시작
echo 2. 프론트엔드: npm install --legacy-peer-deps
echo 3. 프론트엔드: npm start
echo.
echo 모든 캐시가 삭제되었습니다!
echo.

:end
pause 