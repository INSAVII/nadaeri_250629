@echo off
REM QClick 프로덕션 배포 스크립트 (Windows)

echo 🚀 QClick 프로덕션 배포 시작...

REM 환경 변수 확인
if "%DATABASE_URL%"=="" (
    echo ❌ 오류: DATABASE_URL 환경변수가 설정되지 않았습니다.
    exit /b 1
)

if "%SECRET_KEY%"=="" (
    echo ❌ 오류: SECRET_KEY 환경변수가 설정되지 않았습니다.
    exit /b 1
)

REM 1. Git 최신 코드 Pull
echo 📦 최신 코드 가져오기...
git pull origin main

REM 2. 백엔드 의존성 설치
echo 📦 백엔드 의존성 설치...
cd services\main-api
pip install -r requirements.txt

REM 3. 데이터베이스 초기화
echo 🗄️ 데이터베이스 초기화...
python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine); print('데이터베이스 테이블 생성 완료')"

REM 4. 프로그램 초기 데이터 생성
echo 📊 프로그램 초기 데이터 설정...
python init_programs.py

REM 5. 프론트엔드 빌드
echo 🏗️ 프론트엔드 빌드...
cd ..\..\frontend
call npm ci
call npm run build

REM 6. 서버 재시작
echo 🔄 서버 재시작...
cd ..
call stop_servers.bat
timeout /t 3
call start_all_services.bat

REM 7. 헬스체크
echo 🔍 서비스 헬스체크...
timeout /t 10

echo 🎉 배포 완료!
echo 📍 Main API: http://localhost:8001
echo 📍 QName Service: http://localhost:8002
echo 📍 QText Service: http://localhost:8003
echo 📍 Frontend: http://localhost:3003

pause
