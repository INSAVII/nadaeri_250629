@echo off
chcp 65001 >nul
echo ========================================
echo    큐네임2번 백엔드 캐시 완전 삭제
echo ========================================
echo.

cd /d %~dp0
cd services\main-api

echo [1/6] Python 캐시 파일 삭제 중...
REM __pycache__ 폴더 삭제
if exist __pycache__ (
    rmdir /s /q __pycache__
    echo   - __pycache__ 폴더 삭제 완료
) else (
    echo   - __pycache__ 폴더가 없습니다
)

REM 모든 하위 폴더의 __pycache__ 삭제
for /d /r . %%d in (__pycache__) do (
    if exist "%%d" (
        rmdir /s /q "%%d"
        echo   - %%d 삭제 완료
    )
)

echo [2/6] Python 컴파일 파일 삭제 중...
REM *.pyc 파일 삭제
for /r . %%f in (*.pyc) do (
    if exist "%%f" (
        del /q "%%f"
        echo   - %%f 삭제 완료
    )
)

echo [3/6] 로그 파일 삭제 중...
REM logs 폴더 삭제
if exist logs (
    rmdir /s /q logs
    echo   - logs 폴더 삭제 완료
) else (
    echo   - logs 폴더가 없습니다
)

echo [4/6] 데이터베이스 파일 정리 중...
REM SQLite 데이터베이스 파일 백업 (선택사항)
if exist qclick.db (
    echo   - qclick.db 파일이 존재합니다 (삭제하지 않음)
) else (
    echo   - qclick.db 파일이 없습니다
)

echo [5/6] 업로드 파일 정리 중...
REM uploads 폴더의 임시 파일 삭제
if exist uploads (
    for %%f in (uploads\*.tmp) do (
        if exist "%%f" (
            del /q "%%f"
            echo   - %%f 삭제 완료
        )
    )
    echo   - uploads 폴더 임시 파일 정리 완료
) else (
    echo   - uploads 폴더가 없습니다
)

echo [6/6] 환경 설정 파일 정리 중...
REM .env 파일 백업 (선택사항)
if exist .env (
    echo   - .env 파일이 존재합니다 (삭제하지 않음)
) else (
    echo   - .env 파일이 없습니다
)

echo.
echo ========================================
echo [완료] 큐네임2번 백엔드 캐시/임시파일 삭제 완료
echo ========================================
echo.
pause 