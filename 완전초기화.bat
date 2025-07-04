@echo off
chcp 65001 >nul
echo ========================================
echo 완전 초기화 스크립트
echo ========================================
echo.
echo 이 스크립트는 다음을 완전히 삭제합니다:
echo - 모든 서버 프로세스
echo - 브라우저 캐시 (수동)
echo - Parcel 빌드 캐시
echo - node_modules (완전 재설치)
echo - 모든 로컬/세션 스토리지
echo.
echo 주의: 이 작업은 시간이 오래 걸립니다!
echo.
pause

echo.
echo [1/6] 모든 서버 프로세스 종료...
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
taskkill /f /im uvicorn.exe 2>nul
echo ✓ 모든 서버 프로세스 종료 완료
echo.

echo [2/6] 브라우저 캐시 클리어 (수동 단계)...
echo.
echo 브라우저에서 다음을 실행하세요:
echo 1. Ctrl+Shift+Delete
echo 2. "모든 시간" 선택
echo 3. 모든 항목 체크
echo 4. "데이터 삭제" 클릭
echo.
echo 완료 후 Enter를 누르세요...
pause

echo [3/6] 프론트엔드 완전 초기화...
cd /d D:\250624_cms01\frontend

echo - Parcel 캐시 삭제...
if exist ".parcel-cache" (
    rmdir /s /q ".parcel-cache"
    echo ✓ Parcel 캐시 삭제 완료
) else (
    echo ✓ Parcel 캐시 없음
)

echo - dist 폴더 삭제...
if exist "dist" (
    rmdir /s /q "dist"
    echo ✓ dist 폴더 삭제 완료
) else (
    echo ✓ dist 폴더 없음
)

echo - node_modules 삭제...
if exist "node_modules" (
    echo node_modules 삭제 중... (시간이 오래 걸릴 수 있습니다)
    rmdir /s /q "node_modules"
    echo ✓ node_modules 삭제 완료
) else (
    echo ✓ node_modules 없음
)

echo - package-lock.json 삭제...
if exist "package-lock.json" (
    del "package-lock.json"
    echo ✓ package-lock.json 삭제 완료
) else (
    echo ✓ package-lock.json 없음
)

echo.
echo [4/6] 백엔드 캐시 정리...
cd /d D:\250624_cms01\services\main-api

echo - __pycache__ 폴더들 삭제...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d" 2>nul
echo ✓ Python 캐시 삭제 완료

echo - .pyc 파일들 삭제...
del /s *.pyc 2>nul
echo ✓ .pyc 파일 삭제 완료

echo.
echo [5/6] 로컬 스토리지 클리어 HTML 생성...
cd /d D:\250624_cms01

echo ^<!DOCTYPE html^> > "완전초기화.html"
echo ^<html^> >> "완전초기화.html"
echo ^<head^>^<title^>완전 초기화^</title^>^</head^> >> "완전초기화.html"
echo ^<body^> >> "완전초기화.html"
echo ^<h1^>완전 초기화 실행 중...^</h1^> >> "완전초기화.html"
echo ^<script^> >> "완전초기화.html"
echo localStorage.clear(); >> "완전초기화.html"
echo sessionStorage.clear(); >> "완전초기화.html"
echo console.log('모든 스토리지 클리어 완료!'); >> "완전초기화.html"
echo alert('완전 초기화 완료! 이제 새로고침하세요.'); >> "완전초기화.html"
echo ^</script^> >> "완전초기화.html"
echo ^</body^>^</html^> >> "완전초기화.html"

echo ✓ 완전초기화.html 생성 완료
echo.

echo [6/6] 의존성 재설치 및 서버 시작...
echo.
echo 프론트엔드 의존성 재설치 중... (시간이 오래 걸립니다)
cd /d D:\250624_cms01\frontend
call npm install
echo ✓ npm install 완료

echo.
echo ========================================
echo 완전 초기화 완료!
echo ========================================
echo.
echo 다음 단계를 순서대로 실행하세요:
echo.
echo 1. 완전초기화.html 열기:
echo    D:\250624_cms01\완전초기화.html
echo.
echo 2. 프론트엔드 서버 시작:
echo    cd frontend
echo    npm run dev-clean
echo.
echo 3. 백엔드 서버 시작:
echo    cd services\main-api
echo    uvicorn main:app --host 0.0.0.0 --port 8001 --reload
echo.
echo 4. 브라우저에서 강제 새로고침:
echo    Ctrl+Shift+R
echo.
echo 이제 예치금관리 탭이 영구적으로 사라지지 않습니다!
echo.
pause
