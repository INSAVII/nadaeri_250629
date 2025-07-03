#!/bin/bash
# QClick 프로덕션 배포 스크립트

set -e

echo "🚀 QClick 프로덕션 배포 시작..."

# 환경 변수 확인
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 오류: DATABASE_URL 환경변수가 설정되지 않았습니다."
    exit 1
fi

if [ -z "$SECRET_KEY" ]; then
    echo "❌ 오류: SECRET_KEY 환경변수가 설정되지 않았습니다."
    exit 1
fi

# 1. Git 최신 코드 Pull
echo "📦 최신 코드 가져오기..."
git pull origin main

# 2. 백엔드 의존성 설치
echo "📦 백엔드 의존성 설치..."
cd services/main-api
pip install -r requirements.txt

# 3. 데이터베이스 마이그레이션
echo "🗄️ 데이터베이스 마이그레이션..."
python -c "
from database import engine
from models import Base
Base.metadata.create_all(bind=engine)
print('데이터베이스 테이블 생성 완료')
"

# 4. 프로그램 초기 데이터 생성
echo "📊 프로그램 초기 데이터 설정..."
python init_programs.py

# 5. 프론트엔드 빌드
echo "🏗️ 프론트엔드 빌드..."
cd ../../frontend
npm ci
npm run build

# 6. 백엔드 서버 재시작
echo "🔄 백엔드 서버 재시작..."
cd ../services/main-api

# 기존 프로세스 종료
pkill -f "uvicorn main:app" || true
pkill -f "gunicorn main:app" || true

# 새 프로세스 시작 (백그라운드)
if [ "$ENV" = "production" ]; then
    echo "🚀 프로덕션 서버 시작..."
    gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001 --daemon
else
    echo "🛠️ 개발 서버 시작..."
    nohup uvicorn main:app --host 0.0.0.0 --port 8001 > ../../logs/main-api.log 2>&1 &
fi

# 7. 마이크로서비스 재시작
echo "🔄 마이크로서비스 재시작..."

# QName 서비스
cd ../qname-service
pkill -f "uvicorn main:app --port 8002" || true
nohup uvicorn main:app --host 0.0.0.0 --port 8002 > ../../logs/qname-service.log 2>&1 &

# QText 서비스  
cd ../qtext-service
pkill -f "python main.py" || true
nohup python main.py > ../../logs/qtext-service.log 2>&1 &

# 8. 헬스체크
echo "🔍 서비스 헬스체크..."
sleep 5

check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f "$url" > /dev/null 2>&1; then
            echo "✅ $service_name 정상 작동"
            return 0
        fi
        echo "⏳ $service_name 시작 대기 중... ($attempt/$max_attempts)"
        sleep 3
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name 시작 실패"
    return 1
}

cd ../../

# 각 서비스 헬스체크
check_service "Main API" "http://localhost:8001/health"
check_service "QName Service" "http://localhost:8002/"
check_service "QText Service" "http://localhost:8003/"

# 9. 로그 확인
echo "📋 최신 로그 확인..."
echo "=== Main API 로그 ==="
tail -n 10 logs/main-api.log || echo "로그 파일이 없습니다."

echo "=== QName Service 로그 ==="
tail -n 10 logs/qname-service.log || echo "로그 파일이 없습니다."

echo "=== QText Service 로그 ==="
tail -n 10 logs/qtext-service.log || echo "로그 파일이 없습니다."

# 10. 배포 완료
echo "🎉 배포 완료!"
echo "📍 Main API: http://localhost:8001"
echo "📍 QName Service: http://localhost:8002" 
echo "📍 QText Service: http://localhost:8003"
echo "📍 Frontend: 정적 파일 빌드 완료 (dist 폴더)"

echo "🔧 유용한 명령어:"
echo "  - 로그 실시간 모니터링: tail -f logs/*.log"
echo "  - 서비스 상태 확인: ps aux | grep -E '(uvicorn|gunicorn|python)'"
echo "  - 프로세스 종료: ./stop_servers.bat"
