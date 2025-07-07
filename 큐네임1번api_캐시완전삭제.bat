@echo off
chcp 65001 >nul
echo ========================================
echo    큐네임1번 API 캐시 완전 삭제
echo ========================================
echo.

cd /d %~dp0
cd services\qname-service

echo [1/5] Python 캐시 파일 삭제 중...
REM __pycache__ 폴더 삭제
if exist __pycache__ (
    rmdir /s /q __pycache__
    echo   - __pycache__ 폴더 삭제 완료
) else (
    echo   - __pycache__ 폴더가 없습니다
)

REM *.pyc 파일 삭제
for /r . %%f in (*.pyc) do (
    if exist "%%f" (
        del /q "%%f"
        echo   - %%f 삭제 완료
    )
)

echo [2/5] 결과 파일 삭제 중...
REM 가공완료_*.xlsx 결과파일 삭제
for %%f in (가공완료_*.xlsx) do (
    if exist "%%f" (
        del /q "%%f"
        echo   - %%f 삭제 완료
    )
)

echo [3/5] 로그 파일 삭제 중...
REM logs 폴더 삭제
if exist logs (
    rmdir /s /q logs
    echo   - logs 폴더 삭제 완료
) else (
    echo   - logs 폴더가 없습니다
)

echo [4/5] 임시 파일 삭제 중...
REM *.tmp 파일 삭제
for %%f in (*.tmp) do (
    if exist "%%f" (
        del /q "%%f"
        echo   - %%f 삭제 완료
    )
)

echo [5/5] 데이터 캐시 파일 삭제 중...
REM category_vector_cache.pkl 삭제
if exist data\category_vector_cache.pkl (
    del /q data\category_vector_cache.pkl
    echo   - category_vector_cache.pkl 삭제 완료
) else (
    echo   - category_vector_cache.pkl 파일이 없습니다
)

echo.
echo ========================================
echo [완료] 큐네임1번 API 캐시/임시파일 삭제 완료
echo ========================================
echo.
pause 