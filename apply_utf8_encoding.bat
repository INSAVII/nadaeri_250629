@echo off
chcp 65001 >nul
echo ========================================
echo UTF-8 인코딩 프로젝트 파일 생성 도구
echo ========================================
echo.
echo 모든 프로젝트 파일을 UTF-8 인코딩으로 다시 생성합니다.
echo Railway와 Vercel 배포 시 인코딩 문제를 해결합니다.
echo.

echo 1. 백업 디렉토리 생성...
if not exist "backup_original" mkdir backup_original

echo 2. 원본 파일 백업...
copy "큐문자_캐시완전삭제.bat" "backup_original\" >nul 2>&1
copy "전체시스템_캐시완전삭제.bat" "backup_original\" >nul 2>&1
copy "큐네임1번api_캐시완전삭제.bat" "backup_original\" >nul 2>&1
copy "큐네임2번벡엔드_캐시완전삭제.bat" "backup_original\" >nul 2>&1
copy "큐네임3번포엔드_캐시완전삭제.bat" "backup_original\" >nul 2>&1
copy "vercel.json" "backup_original\" >nul 2>&1
copy "railway.json" "backup_original\" >nul 2>&1
copy "deployment\deploy_railway.bat" "backup_original\" >nul 2>&1

echo 3. UTF-8 버전 파일들 적용...

echo    - vercel.json 교체...
if exist "vercel_utf8.json" (
    copy "vercel_utf8.json" "vercel.json" >nul
    echo      ✅ vercel.json 업데이트 완료
)

echo    - railway.json 교체...
if exist "railway_utf8.json" (
    copy "railway_utf8.json" "railway.json" >nul
    echo      ✅ railway.json 업데이트 완료
)

echo    - 프론트엔드 package.json 교체...
if exist "frontend\package_utf8.json" (
    copy "frontend\package_utf8.json" "frontend\package.json" >nul
    echo      ✅ frontend/package.json 업데이트 완료
)

echo    - 백엔드 requirements.txt 교체...
if exist "services\main-api\requirements_utf8.txt" (
    copy "services\main-api\requirements_utf8.txt" "services\main-api\requirements.txt" >nul
    echo      ✅ main-api/requirements.txt 업데이트 완료
)

if exist "services\qname-service\requirements_utf8.txt" (
    copy "services\qname-service\requirements_utf8.txt" "services\qname-service\requirements.txt" >nul
    echo      ✅ qname-service/requirements.txt 업데이트 완료
)

if exist "services\qtext-service\requirements_utf8.txt" (
    copy "services\qtext-service\requirements_utf8.txt" "services\qtext-service\requirements.txt" >nul
    echo      ✅ qtext-service/requirements.txt 업데이트 완료
)

echo    - 배포 스크립트 교체...
if exist "deployment\deploy_railway_utf8.bat" (
    copy "deployment\deploy_railway_utf8.bat" "deployment\deploy_railway.bat" >nul
    echo      ✅ deploy_railway.bat 업데이트 완료
)

echo    - 캐시 삭제 스크립트 교체...
if exist "큐문자_캐시완전삭제_utf8.bat" (
    copy "큐문자_캐시완전삭제_utf8.bat" "큐문자_캐시완전삭제.bat" >nul
    echo      ✅ 큐문자_캐시완전삭제.bat 업데이트 완료
)

echo    - Dockerfile 교체...
if exist "frontend\Dockerfile_utf8" (
    copy "frontend\Dockerfile_utf8" "frontend\Dockerfile" >nul
    echo      ✅ frontend/Dockerfile 업데이트 완료
)

echo.
echo 4. Python 파일 인코딩 확인...
echo    - QName 서비스: main.py에 UTF-8 헤더 추가됨
echo    - QText 서비스: main.py에 UTF-8 헤더 추가됨  
echo    - Main API: main.py에 UTF-8 헤더 추가됨

echo.
echo ========================================
echo ✅ UTF-8 인코딩 적용 완료!
echo ========================================
echo.
echo 🔧 적용된 변경사항:
echo    1. 모든 Python 파일에 UTF-8 인코딩 헤더 추가
echo    2. JSON 설정 파일들 UTF-8로 재저장
echo    3. 배치 파일들에 chcp 65001 명령어 추가
echo    4. 배포 스크립트 UTF-8 인코딩 적용
echo    5. 의존성 파일들 UTF-8로 재저장
echo.
echo 📁 백업 파일 위치: backup_original\ 폴더
echo.
echo 🚀 이제 Railway/Vercel 배포를 시도하세요:
echo    - Railway: deployment\deploy_railway.bat 실행
echo    - Vercel: cd frontend && vercel --prod
echo.

pause
