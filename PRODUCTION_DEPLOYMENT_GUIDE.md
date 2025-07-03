# 🚀 QClick 프로덕션 배포 가이드

## 배포 준비 완료 상태

현재 QClick 프로젝트는 **안정적인 배포 환경**에서 운영 가능한 수준으로 개선되었습니다.

### ✅ 완료된 배포 준비 사항

#### 1. 보안 강화
- ✅ 프로덕션 환경변수 설정 (`.env.production`)
- ✅ JWT 토큰 보안 강화
- ✅ CORS 정책 환경별 분리
- ✅ API 응답 표준화 및 에러 핸들링
- ✅ 민감한 정보 로깅 방지

#### 2. 프론트엔드 최적화
- ✅ 환경별 API 엔드포인트 자동 감지
- ✅ ErrorBoundary 전역 적용
- ✅ 프로덕션 빌드 최적화
- ✅ 번들 사이즈 최적화 설정

#### 3. 백엔드 안정성
- ✅ 프로덕션 보안 미들웨어
- ✅ 요청 크기 제한
- ✅ 자동 재시도 및 헬스체크
- ✅ 의존성 최신화 및 보안 패치

#### 4. 데이터베이스 & 권한 시스템
- ✅ 프로그램 권한 단일 진실 소스 구현
- ✅ 실시간 권한 동기화 시스템
- ✅ 중복 저장 방지 로직
- ✅ 자동화된 권한 동기화 테스트

#### 5. 인프라 & 배포
- ✅ Docker 컨테이너화
- ✅ Docker Compose 전체 시스템 통합
- ✅ Nginx 설정 및 로드밸런싱
- ✅ 자동화된 배포 스크립트
- ✅ 헬스체크 및 모니터링

---

## 🎯 배포 환경별 가이드

### 개발 환경 (로컬)
```bash
# 전체 서비스 시작
./start_all_services.bat

# 또는 개별 실행
cd services/main-api && uvicorn main:app --port 8001
cd services/qname-service && uvicorn main:app --port 8002  
cd services/qtext-service && python main.py
cd frontend && npm run dev
```

### 스테이징 환경
```bash
# 환경변수 설정
cp services/main-api/.env.production services/main-api/.env

# Docker Compose로 전체 시스템 실행
docker-compose up -d

# 헬스체크
docker-compose ps
```

### 프로덕션 환경

#### Option 1: 클라우드 분리 배포 (추천)
- **프론트엔드**: Vercel
- **백엔드**: Railway/Render
- **데이터베이스**: PostgreSQL (호스팅)

#### Option 2: Docker 통합 배포
```bash
# 프로덕션 환경변수 설정
export DATABASE_URL="postgresql://user:pass@host:port/db"
export SECRET_KEY="ultra-secure-key-here"

# 배포 실행
./deploy.sh  # Linux/Mac
./deploy.bat # Windows
```

---

## 🔧 핵심 설정 파일

### 환경변수 (.env.production)
```env
DATABASE_URL=postgresql://username:password@host:port/dbname
SECRET_KEY=qclick_ultra_secure_secret_key_for_production_2025
JWT_SECRET=qclick_jwt_production_secret_2025_ultra_secure
ENV=production
CORS_ORIGINS=https://qclick.vercel.app,https://api.qclick.com
```

### 프론트엔드 환경변수
```env
NODE_ENV=production
REACT_APP_API_URL=https://api.qclick.com
```

---

## 🚀 배포 체크리스트

### 배포 전 점검
- [ ] 환경변수 설정 확인
- [ ] 데이터베이스 연결 테스트
- [ ] 프로덕션 빌드 테스트
- [ ] 보안 설정 검토
- [ ] 백업 계획 수립

### 배포 후 점검
- [ ] 서비스 헬스체크
- [ ] API 엔드포인트 테스트
- [ ] 권한 시스템 동작 확인
- [ ] 로그 모니터링 설정
- [ ] 성능 모니터링 확인

---

## 📊 모니터링 & 유지보수

### 로그 확인
```bash
# 서비스별 로그
tail -f logs/main-api.log
tail -f logs/qname-service.log
tail -f logs/qtext-service.log

# Docker 로그
docker-compose logs -f main-api
```

### 성능 모니터링
- API 응답 시간 모니터링
- 데이터베이스 쿼리 성능
- 메모리 및 CPU 사용률
- 에러율 및 가용성

### 백업 전략
```bash
# 데이터베이스 백업
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 업로드 파일 백업
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

---

## 🛠️ 트러블슈팅

### 일반적인 문제 해결

#### 1. API 연결 실패
```bash
# 서비스 상태 확인
curl http://localhost:8001/health
docker-compose ps

# 로그 확인
docker-compose logs main-api
```

#### 2. 권한 동기화 문제
```bash
# 권한 동기화 테스트 실행
python test_program_permission_sync.py

# 프로그램 초기 데이터 재생성
cd services/main-api && python init_programs.py
```

#### 3. 프론트엔드 빌드 실패
```bash
# 캐시 정리 후 재빌드
cd frontend
rm -rf .parcel-cache dist node_modules
npm ci
npm run build
```

### 긴급 상황 대응
1. **서비스 재시작**: `./deploy.bat` 또는 `docker-compose restart`
2. **롤백**: Git에서 이전 버전으로 복구
3. **데이터베이스 복구**: 백업에서 복원
4. **로그 분석**: 에러 패턴 확인 후 핫픽스 적용

---

## 📞 운영 연락처

**개발팀 연락처**
- 기술 지원: [기술지원 채널]
- 긴급 상황: [긴급 연락처]
- 문서 업데이트: 이 파일을 지속적으로 업데이트

---

## 🎉 결론

QClick 프로젝트는 이제 **프로덕션 환경에서 안정적으로 운영 가능한 수준**으로 완성되었습니다.

### 핵심 개선 사항
1. **권한 관리 시스템**: 단일 진실 소스 기반의 실시간 동기화
2. **보안 강화**: 프로덕션 수준의 보안 설정 적용
3. **배포 자동화**: 원클릭 배포 및 롤백 시스템
4. **모니터링**: 실시간 헬스체크 및 로깅 시스템
5. **확장성**: 마이크로서비스 아키텍처 기반 독립적 스케일링

**이제 안전하게 배포하여 실제 사용자에게 서비스를 제공할 수 있습니다! 🚀**
