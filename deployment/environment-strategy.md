# 🌍 환경별 배포 전략 가이드

## 📋 환경 분류

### 1. 개발 환경 (Development)
- **브랜치**: `develop`
- **목적**: 기능 개발 및 테스트
- **서버**: 로컬 개발 서버
- **데이터베이스**: 로컬 SQLite

### 2. 스테이징 환경 (Staging)
- **브랜치**: `staging`
- **목적**: 배포 전 최종 테스트
- **서버**: 테스트 서버 (Railway/Vercel)
- **데이터베이스**: 테스트 DB

### 3. 프로덕션 환경 (Production)
- **브랜치**: `main`
- **목적**: 실제 서비스 운영
- **서버**: 프로덕션 서버
- **데이터베이스**: 프로덕션 DB

## 🚀 서버 실행 방법

### 개발 환경 실행
```bash
# 1. 개발 브랜치로 전환
git checkout develop

# 2. 프론트엔드 개발 서버
cd frontend
npm run dev

# 3. 백엔드 개발 서버
cd services/main-api
python main.py

# 4. 큐네임 서비스 개발 서버
cd services/qname-service
python main.py

# 5. 큐텍스트 서비스 개발 서버
cd services/qtext-service
python main.py
```

### 배포 환경 실행
```bash
# 1. 프로덕션 브랜치로 전환
git checkout main

# 2. 프론트엔드 빌드
cd frontend
npm run build

# 3. 백엔드 프로덕션 서버
cd services/main-api
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker

# 4. 마이크로서비스는 Railway에서 자동 배포
```

## 🔧 환경별 설정 파일

### 개발 환경 설정
- `frontend/src/config/constants.ts` - 로컬 서버 URL
- `services/main-api/main.py` - 개발 서버 설정
- `.env.development` - 개발 환경 변수

### 배포 환경 설정
- `frontend/src/config/constants.ts` - 프로덕션 URL
- `services/main-api/Procfile` - 프로덕션 서버 설정
- `.env.production` - 프로덕션 환경 변수

## 📦 배포 전 체크리스트

### 개발 → 스테이징
- [ ] 모든 기능 테스트 완료
- [ ] 환경 변수 설정 확인
- [ ] API 엔드포인트 테스트
- [ ] 데이터베이스 마이그레이션

### 스테이징 → 프로덕션
- [ ] 스테이징 환경 테스트 완료
- [ ] 성능 테스트 완료
- [ ] 보안 검사 완료
- [ ] 백업 준비 완료

## 🔄 롤백 전략

### 긴급 롤백
```bash
# 1. 이전 안정 버전으로 복구
git checkout main
git reset --hard HEAD~1

# 2. 강제 배포
git push origin main --force

# 3. 서버 재시작
# Railway/Vercel에서 자동 재배포
```

### 점진적 롤백
```bash
# 1. 문제가 있는 기능만 비활성화
git checkout -b hotfix/disable-problematic-feature

# 2. 문제 기능 주석 처리
# 3. 테스트 후 배포
git checkout main
git merge hotfix/disable-problematic-feature
```

## 📊 모니터링

### 개발 환경 모니터링
- 로컬 로그 확인
- 개발자 도구 콘솔
- 네트워크 탭 모니터링

### 배포 환경 모니터링
- Railway/Vercel 로그
- Sentry 오류 추적
- 성능 모니터링
- 사용자 피드백 수집 