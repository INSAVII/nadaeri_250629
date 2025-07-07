@echo off
chcp 65001 >nul
echo ========================================
echo UTF-8 인코딩 적용 후 GitHub 푸시 가이드
echo ========================================
echo.

echo 🔍 현재 Git 상태 확인...
git status

echo.
echo 📋 UTF-8 인코딩 적용된 파일들:
echo    - services/main-api/main.py (UTF-8 헤더 추가)
echo    - services/qname-service/main.py (UTF-8 헤더 추가)
echo    - services/qtext-service/main.py (UTF-8 헤더 추가)
echo    - vercel.json (UTF-8 환경변수 추가)
echo    - services/main-api/railway.json (UTF-8 최적화)
echo    - 모든 requirements.txt (UTF-8 재저장)
echo    - DEPLOYMENT_UTF8_COMPLETE.md (신규)
echo    - UTF8_RAILWAY_ENV.txt (신규)
echo.

echo ⚠️ 주의사항:
echo    1. 한글 파일명 파일들은 .gitignore에 추가 권장
echo    2. UTF-8 인코딩이 적용된 파일들만 푸시 권장
echo    3. 민감한 환경변수는 제외하고 푸시
echo.

echo 🚀 Git 푸시 명령어 실행...
echo.

echo 1. UTF-8 인코딩 적용된 중요 파일들만 추가...
git add services/main-api/main.py
git add services/qname-service/main.py
git add services/qtext-service/main.py
git add vercel.json
git add services/main-api/railway.json
git add services/main-api/requirements.txt
git add services/qname-service/requirements.txt
git add services/qtext-service/requirements.txt
git add DEPLOYMENT_UTF8_COMPLETE.md
git add UTF8_RAILWAY_ENV.txt
git add deployment/deploy_railway_utf8_fixed.bat
git add frontend/package.json

echo.
echo 2. UTF-8 인코딩 적용 커밋...
git commit -m "🔧 UTF-8 인코딩 문제 해결

- Python 파일들에 UTF-8 헤더 추가
- Railway/Vercel 설정 파일 UTF-8 최적화  
- requirements.txt UTF-8 재저장
- 배포 스크립트 UTF-8 버전 생성
- 환경변수 설정 가이드 추가

Railway/Vercel 배포 시 인코딩 문제 해결됨"

echo.
echo 3. GitHub에 푸시...
git push origin main

echo.
echo ========================================
echo ✅ UTF-8 인코딩 적용 완료 후 푸시 완료!
echo ========================================
echo.
echo 📋 다음 단계:
echo    1. GitHub 저장소에서 변경사항 확인
echo    2. Railway에서 GitHub 연동하여 자동 배포 설정
echo    3. Vercel에서 GitHub 연동하여 자동 배포 설정
echo.
echo 🔗 자동 배포 설정:
echo    - Railway: GitHub 저장소 연결 후 자동 배포
echo    - Vercel: GitHub 저장소 연결 후 자동 배포
echo.

pause
