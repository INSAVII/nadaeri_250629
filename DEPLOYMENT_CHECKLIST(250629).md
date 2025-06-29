# QClick 배포 준비 체크리스트

## 🚀 배포 전 필수 준비사항

### Phase 1: 환경 설정 및 보안 (1-2일)

#### 1.1 환경변수 설정
- [ ] **프로덕션 환경변수 파일 생성**
  ```bash
  # .env.production
  DATABASE_URL=postgresql://username:password@host:port/database
  JWT_SECRET=강력한_시크릿_키_최소_32자
  GEMINI_API_KEY=실제_GEMINI_API_키
  OPENAI_API_KEY=실제_OPENAI_API_키
  NAVER_CLIENT_ID=실제_NAVER_CLIENT_ID
  NAVER_CLIENT_SECRET=실제_NAVER_CLIENT_SECRET
  CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
  ```

- [ ] **API 키 보안 검토**
  - [ ] 모든 API 키가 환경변수로 관리되는지 확인
  - [ ] 하드코딩된 API 키가 없는지 검색
  - [ ] API 키 권한 설정 확인

#### 1.2 보안 강화
- [ ] **Rate Limiting 적용**
  ```python
  # main-api/api/utils/rate_limiting.py
  from fastapi import HTTPException
  from slowapi import Limiter, _rate_limit_exceeded_handler
  from slowapi.util import get_remote_address
  from slowapi.errors import RateLimitExceeded
  
  limiter = Limiter(key_func=get_remote_address)
  
  @limiter.limit("100/minute")
  async def rate_limited_endpoint(request):
      # 엔드포인트 구현
      pass
  ```

- [ ] **CORS 설정 검토**
  ```python
  # 허용된 도메인만 설정
  CORS_ORIGINS = [
      "https://your-domain.com",
      "https://www.your-domain.com"
  ]
  ```

- [ ] **입력 검증 강화**
  - [ ] 모든 API 엔드포인트에 Pydantic 모델 적용
  - [ ] SQL Injection 방지 확인
  - [ ] XSS 방지 확인

#### 1.3 데이터베이스 준비
- [ ] **PostgreSQL 스키마 생성**
  ```sql
  -- 데이터베이스 생성
  CREATE DATABASE qclick_production;
  
  -- 사용자 생성
  CREATE USER qclick_user WITH PASSWORD 'strong_password';
  GRANT ALL PRIVILEGES ON DATABASE qclick_production TO qclick_user;
  ```

- [ ] **마이그레이션 스크립트 준비**
  ```python
  # scripts/migrate.py
  from sqlalchemy import create_engine
  from models import Base
  
  engine = create_engine(DATABASE_URL)
  Base.metadata.create_all(engine)
  ```

### Phase 2: 클라우드 서비스 설정 (1일)

#### 2.1 Vercel (프론트엔드)
- [ ] **Vercel 계정 생성**
- [ ] **프로젝트 연결**
  ```bash
  npm install -g vercel
  vercel login
  vercel --prod
  ```

- [ ] **환경변수 설정**
  ```bash
  vercel env add REACT_APP_API_URL
  vercel env add REACT_APP_ENVIRONMENT
  ```

- [ ] **도메인 설정**
  - [ ] 커스텀 도메인 연결
  - [ ] SSL 인증서 확인

#### 2.2 Railway (백엔드)
- [ ] **Railway 계정 생성**
- [ ] **프로젝트 배포**
  ```bash
  npm install -g @railway/cli
  railway login
  railway init
  railway up
  ```

- [ ] **환경변수 설정**
  ```bash
  railway variables set DATABASE_URL=postgresql://...
  railway variables set JWT_SECRET=...
  railway variables set GEMINI_API_KEY=...
  ```

- [ ] **PostgreSQL 데이터베이스 연결**
  - [ ] Railway PostgreSQL 서비스 생성
  - [ ] 연결 문자열 확인

#### 2.3 Render (마이크로서비스)
- [ ] **Render 계정 생성**
- [ ] **QName 서비스 배포**
  - [ ] GitHub 저장소 연결
  - [ ] 빌드 명령어 설정
  - [ ] 환경변수 설정

- [ ] **QText 서비스 배포**
  - [ ] 동일한 과정 반복

### Phase 3: CI/CD 파이프라인 (1일)

#### 3.1 GitHub Actions 설정
- [ ] **워크플로우 파일 생성**
  ```yaml
  # .github/workflows/deploy.yml
  name: Deploy to Production
  
  on:
    push:
      branches: [main]
  
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Test Backend
          run: |
            cd services/main-api
            pip install -r requirements.txt
            pytest
        - name: Test Frontend
          run: |
            cd frontend
            npm install
            npm run build
  
    deploy:
      needs: test
      runs-on: ubuntu-latest
      steps:
        - name: Deploy to Vercel
          uses: amondnet/vercel-action@v20
          with:
            vercel-token: ${{ secrets.VERCEL_TOKEN }}
            vercel-org-id: ${{ secrets.ORG_ID }}
            vercel-project-id: ${{ secrets.PROJECT_ID }}
            vercel-args: '--prod'
  ```

#### 3.2 자동 배포 설정
- [ ] **Vercel 자동 배포**
- [ ] **Railway 자동 배포**
- [ ] **Render 자동 배포**

### Phase 4: 성능 최적화 (1일)

#### 4.1 프론트엔드 최적화
- [ ] **번들 크기 분석**
  ```bash
  npm install -g webpack-bundle-analyzer
  npm run build
  webpack-bundle-analyzer dist/stats.json
  ```

- [ ] **이미지 최적화**
  - [ ] WebP 형식 사용
  - [ ] 이미지 압축
  - [ ] Lazy loading 적용

- [ ] **캐싱 전략**
  ```javascript
  // service-worker.js
  const CACHE_NAME = 'qclick-v1';
  const urlsToCache = [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css'
  ];
  ```

#### 4.2 백엔드 최적화
- [ ] **API 응답 캐싱**
  ```python
  from fastapi_cache import FastAPICache
  from fastapi_cache.backends.redis import RedisBackend
  
  @app.get("/api/cached-data")
  @cache(expire=300)  # 5분 캐시
  async def get_cached_data():
      return {"data": "cached"}
  ```

- [ ] **데이터베이스 쿼리 최적화**
  - [ ] 인덱스 추가
  - [ ] N+1 쿼리 문제 해결
  - [ ] 쿼리 성능 분석

### Phase 5: 모니터링 및 로깅 (1일)

#### 5.1 로깅 시스템
- [ ] **구조화된 로깅**
  ```python
  import structlog
  
  logger = structlog.get_logger()
  
  @app.middleware("http")
  async def log_requests(request: Request, call_next):
      start_time = time.time()
      response = await call_next(request)
      process_time = time.time() - start_time
      
      logger.info(
          "request_processed",
          path=request.url.path,
          method=request.method,
          status_code=response.status_code,
          process_time=process_time
      )
      return response
  ```

#### 5.2 모니터링 도구
- [ ] **Sentry 에러 트래킹**
  ```python
  import sentry_sdk
  from sentry_sdk.integrations.fastapi import FastApiIntegration
  
  sentry_sdk.init(
      dsn="your-sentry-dsn",
      integrations=[FastApiIntegration()],
      traces_sample_rate=1.0,
  )
  ```

- [ ] **성능 모니터링**
  - [ ] Vercel Analytics 설정
  - [ ] Railway 메트릭스 확인
  - [ ] Google Analytics 설정

### Phase 6: 테스트 및 검증 (1일)

#### 6.1 기능 테스트
- [ ] **API 엔드포인트 테스트**
  ```bash
  # Postman 컬렉션 실행
  newman run qclick-api-tests.postman_collection.json
  ```

- [ ] **사용자 플로우 테스트**
  - [ ] 회원가입 → 로그인 → 서비스 사용 → 결제
  - [ ] 관리자 기능 테스트
  - [ ] 에러 시나리오 테스트

#### 6.2 성능 테스트
- [ ] **부하 테스트**
  ```bash
  # Apache Bench 테스트
  ab -n 1000 -c 10 https://your-api-domain.com/api/health
  ```

- [ ] **응답 시간 측정**
  - [ ] API 응답 시간 < 2초
  - [ ] 페이지 로딩 시간 < 3초

#### 6.3 보안 테스트
- [ ] **OWASP Top 10 검사**
- [ ] **API 보안 스캔**
- [ ] **SSL/TLS 설정 확인**

## 🔍 배포 후 검증 체크리스트

### 즉시 확인 (배포 직후)
- [ ] **헬스체크 엔드포인트**
  ```bash
  curl https://your-api-domain.com/health
  ```

- [ ] **기본 기능 동작 확인**
  - [ ] 홈페이지 로딩
  - [ ] 로그인/회원가입
  - [ ] API 응답

- [ ] **SSL 인증서 확인**
  ```bash
  openssl s_client -connect your-domain.com:443
  ```

### 24시간 모니터링
- [ ] **에러율 모니터링** (< 1%)
- [ ] **응답 시간 모니터링** (< 2초)
- [ ] **서버 리소스 모니터링**
- [ ] **사용자 행동 분석**

### 1주일 후 검토
- [ ] **성능 지표 분석**
- [ ] **사용자 피드백 수집**
- [ ] **개선점 도출**
- [ ] **다음 단계 계획 수립**

## 🚨 롤백 계획

### 롤백 트리거 조건
- [ ] 에러율 > 5%
- [ ] 응답 시간 > 5초
- [ ] 치명적 보안 취약점 발견
- [ ] 데이터 손실 발생

### 롤백 절차
1. **즉시 롤백 실행**
   ```bash
   # Vercel 롤백
   vercel rollback
   
   # Railway 롤백
   railway rollback
   ```

2. **문제 분석 및 수정**
3. **수정된 버전 재배포**
4. **검증 후 정상 운영**

## 📊 성공 지표

### 기술적 지표
- [ ] **업타임**: > 99.5%
- [ ] **응답 시간**: < 2초
- [ ] **에러율**: < 1%
- [ ] **페이지 로딩**: < 3초

### 비즈니스 지표
- [ ] **사용자 등록**: 목표 달성
- [ ] **서비스 사용률**: 목표 달성
- [ ] **결제 전환율**: 목표 달성

## 🎯 다음 단계

### 배포 완료 후 1주일
1. **사용자 피드백 수집**
2. **성능 최적화**
3. **추가 기능 개발 계획**

### 배포 완료 후 1개월
1. **사용자 행동 분석**
2. **수익화 모델 검토**
3. **확장 계획 수립**

---

**체크리스트 완료 후 배포를 진행하세요!** ✅ 