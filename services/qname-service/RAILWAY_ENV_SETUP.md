# QName 서비스 Railway 환경변수 설정

## Railway 웹사이트에서 설정해야 할 환경변수

### 필수 환경변수

```bash
# 기본 설정
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# CORS 설정 (모든 도메인 허용)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,https://qclick-app.vercel.app,https://qclick-app-git-main-nadaeri.vercel.app,https://qclick-app-nadaeri.vercel.app,https://www.나대리.kr,https://나대리.kr,https://www.xn--h32b11jwwbvvm.kr,https://xn--h32b11jwwbvvm.kr

# AI API 키들 (실제 값으로 변경 필요)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# 네이버 API 키들 (실제 값으로 변경 필요)
NAVER_CLIENT_ID=your_naver_client_id_here
NAVER_CLIENT_SECRET=your_naver_client_secret_here
```

## Railway 배포 설정

### Root Directory 설정
- **Root Directory**: `services/qname-service`

### 배포 명령어 (railway.json에서 자동 설정됨)
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`

## 배포 후 확인사항

1. **서비스 URL 확인**
   - Railway에서 생성된 URL을 복사
   - 예시: `https://qname-service-production.up.railway.app`

2. **Health Check 테스트**
   ```bash
   curl https://your-qname-service-url.railway.app/health
   ```

3. **API 테스트**
   ```bash
   curl https://your-qname-service-url.railway.app/
   ```

## 프론트엔드 환경변수 업데이트

QName 서비스가 배포되면 Vercel에 다음 환경변수 추가:

```bash
REACT_APP_QNAME_API_URL=https://your-qname-service-url.railway.app
```

## 주의사항

1. **API 키 보안**: GEMINI_API_KEY, OPENAI_API_KEY 등은 실제 값으로 설정
2. **도메인 설정**: CORS_ORIGINS에 모든 필요한 도메인이 포함되어 있는지 확인
3. **Health Check**: 배포 후 반드시 /health 엔드포인트 확인
