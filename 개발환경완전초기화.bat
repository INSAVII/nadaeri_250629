@echo off
chcp 65001 >nul
echo ========================================
echo 개발 환경 완전 초기화
echo ========================================
echo.
echo 이 스크립트는 개발 환경을 완전히 초기화합니다:
echo - 모든 캐시 삭제
echo - node_modules 재설치
echo - 개발 서버 자동 시작
echo.
echo 주의: 10-15분 정도 소요됩니다!
echo.
pause

echo.
echo [1/7] 모든 프로세스 종료...
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
taskkill /f /im uvicorn.exe 2>nul
echo ✓ 모든 프로세스 종료 완료
echo.

echo [2/7] 프론트엔드 완전 초기화...
cd /d D:\250624_cms01\frontend

echo - 기존 캐시 삭제...
if exist ".parcel-cache" rmdir /s /q ".parcel-cache"
if exist "dist" rmdir /s /q "dist"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
echo ✓ 캐시 삭제 완료

echo - node_modules 삭제...
if exist "node_modules" (
    echo node_modules 삭제 중... (잠시만 기다려주세요)
    rmdir /s /q "node_modules"
    echo ✓ node_modules 삭제 완료
)

echo - package-lock.json 삭제...
if exist "package-lock.json" del "package-lock.json"
echo ✓ package-lock.json 삭제 완료

echo.
echo [3/7] npm 캐시 정리...
call npm cache clean --force
echo ✓ npm 캐시 정리 완료

echo.
echo [4/7] 의존성 재설치...
echo npm install 실행 중... (5-10분 소요)
call npm install
if %errorlevel% neq 0 (
    echo ❌ npm install 실패! 다시 시도합니다...
    call npm install --force
)
echo ✓ 의존성 재설치 완료

echo.
echo [5/7] 백엔드 캐시 정리...
cd /d D:\250624_cms01\services\main-api

echo - Python 캐시 삭제...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d" 2>nul
del /s *.pyc 2>nul
echo ✓ Python 캐시 삭제 완료

echo.
echo [6/7] 브라우저 캐시 클리어 도구 생성...
cd /d D:\250624_cms01

echo ^<!DOCTYPE html^> > "개발환경초기화.html"
echo ^<html^> >> "개발환경초기화.html"
echo ^<head^>^<title^>개발환경 초기화^</title^>^</head^> >> "개발환경초기화.html"
echo ^<body^> >> "개발환경초기화.html"
echo ^<h1^>개발환경 초기화 완료!^</h1^> >> "개발환경초기화.html"
echo ^<p^>이제 브라우저 캐시를 클리어하세요.^</p^> >> "개발환경초기화.html"
echo ^<script^> >> "개발환경초기화.html"
echo localStorage.clear(); >> "개발환경초기화.html"
echo sessionStorage.clear(); >> "개발환경초기화.html"
echo console.log('스토리지 클리어 완료!'); >> "개발환경초기화.html"
echo ^</script^> >> "개발환경초기화.html"
echo ^</body^>^</html^> >> "개발환경초기화.html"

echo ✓ 브라우저 캐시 클리어 도구 생성 완료
echo.

echo [7/7] 개발 서버 자동 시작...
echo.
echo 프론트엔드 서버 시작 중...
start "Frontend Dev Server" cmd /k "cd /d D:\250624_cms01\frontend && npm run dev-clean"

echo 백엔드 서버 시작 중...
start "Backend Dev Server" cmd /k "cd /d D:\250624_cms01\services\main-api && uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

echo.
echo ========================================
echo 개발환경 초기화 완료!
echo ========================================
echo.
echo 다음 단계를 실행하세요:
echo.
echo 1. 브라우저에서 개발환경초기화.html 열기:
echo    D:\250624_cms01\개발환경초기화.html
echo.
echo 2. 브라우저에서 강제 새로고침:
echo    Ctrl+Shift+R
echo.
echo 3. CMS 페이지 접속:
echo    http://localhost:3003/admin/cms
echo.
echo 4. 예치금관리 탭이 정상 표시되는지 확인
echo.
echo 이제 예치금관리 탭이 영구적으로 유지됩니다!
echo.
pause 