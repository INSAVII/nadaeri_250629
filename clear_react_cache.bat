@echo off
echo ========================================
echo React 캐시 정리 도구
echo ========================================

echo.
echo 1. Node.js 프로세스 종료...
taskkill /f /im node.exe 2>nul
echo    Node.js 프로세스 종료 완료

echo.
echo 2. Python 프로세스 종료...
taskkill /f /im python.exe 2>nul
echo    Python 프로세스 종료 완료

echo.
echo 3. 프론트엔드 캐시 정리...
cd frontend
if exist node_modules (
    echo    node_modules 삭제 중...
    rmdir /s /q node_modules
    echo    node_modules 삭제 완료
)

if exist .next (
    echo    .next 폴더 삭제 중...
    rmdir /s /q .next
    echo    .next 폴더 삭제 완료
)

if exist .cache (
    echo    .cache 폴더 삭제 중...
    rmdir /s /q .cache
    echo    .cache 폴더 삭제 완료
)

echo.
echo 4. 백엔드 캐시 정리...
cd ..\services\main-api
if exist __pycache__ (
    echo    main-api __pycache__ 삭제 중...
    rmdir /s /q __pycache__
    echo    main-api __pycache__ 삭제 완료
)

cd ..\qname-service
if exist __pycache__ (
    echo    qname-service __pycache__ 삭제 중...
    rmdir /s /q __pycache__
    echo    qname-service __pycache__ 삭제 완료
)

cd ..\..

echo.
echo 5. 임시 파일 정리...
del /q temp_*.xlsx 2>nul
del /q output_*.xlsx 2>nul
echo    임시 파일 정리 완료

echo.
echo ========================================
echo 캐시 정리 완료!
echo ========================================
echo.
echo 다음 단계:
echo 1. 브라우저에서 Ctrl+Shift+Delete로 캐시 삭제
echo 2. 브라우저에서 Ctrl+F5로 강제 새로고침
echo 3. 서버 재시작:
echo    - 메인 API: cd services\main-api ^&^& python main.py
echo    - QName: cd services\qname-service ^&^& python main.py
echo    - 프론트엔드: cd frontend ^&^& npm start
echo.
pause 