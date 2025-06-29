# 🚀 Railway 배포 즉시 실행 가이드

## 📋 사전 준비사항

### 1. Railway 계정 생성
- [Railway](https://railway.app) 접속
- GitHub 계정으로 로그인
- 새 프로젝트 생성

### 2. API 키 준비
- **Gemini API 키**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **OpenAI API 키**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Naver API 키**: [Naver Developers](https://developers.naver.com/apps/#/list)

### 3. JWT 시크릿 키 생성
```bash
# 32자 이상의 랜덤 문자열 생성
openssl rand -base64 32
```

## 🚀 즉시 배포 실행

### Step 1: Railway CLI 설치
```bash
npm install -g @railway/cli
```

### Step 2: Railway 로그인
```bash
railway login
```

### Step 3: 프로젝트 디렉토리 이동
```bash
cd services/main-api
```

### Step 4: Railway 프로젝트 초기화
```bash
railway init
```

### Step 5: 환경변수 설정
Railway 대시보드에서 다음 환경변수를 설정:

```bash
# 필수 환경변수
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_generated_jwt_secret_key_32_chars_minimum
GEMINI_API_KEY=your_actual_gemini_api_key
OPENAI_API_KEY=your_actual_openai_api_key
NAVER_CLIENT_ID=your_actual_naver_client_id
NAVER_CLIENT_SECRET=your_actual_naver_client_secret
CORS_ORIGINS=https://your-frontend-domain.vercel.app

# 선택적 환경변수
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
```

### Step 6: PostgreSQL 데이터베이스 추가
1. Railway 대시보드에서 "New Service" 클릭
2. "Database" → "PostgreSQL" 선택
3. 생성된 DATABASE_URL을 환경변수에 설정

### Step 7: 배포 실행
```bash
railway up
```

### Step 8: 배포 확인
```bash
# 서비스 URL 확인
railway status

# 헬스체크
curl https://your-app-name.railway.app/health
```

## 🔧 문제 해결

### 일반적인 오류와 해결방법

#### 1. 포트 오류
```
Error: Port already in use
```
**해결**: Railway에서 자동으로 PORT 환경변수를 설정하므로 수동 설정 불필요

#### 2. 데이터베이스 연결 오류
```
Error: connection to database failed
```
**해결**: 
- DATABASE_URL 형식 확인
- PostgreSQL 서비스가 실행 중인지 확인
- 방화벽 설정 확인

#### 3. 환경변수 누락 오류
```
Error: JWT_SECRET not found
```
**해결**: Railway 대시보드에서 모든 필수 환경변수 설정

#### 4. 의존성 설치 오류
```
Error: package installation failed
```
**해결**: requirements.txt 파일 확인 및 수정

### 로그 확인
```bash
# 실시간 로그 확인
railway logs

# 특정 서비스 로그 확인
railway logs --service main-api
```

## 📊 배포 후 검증

### 1. 헬스체크
```bash
curl https://your-app-name.railway.app/health
```
**예상 응답**:
```json
{
  "status": "ok",
  "message": "메인 API 서버가 정상 작동 중입니다.",
  "port": "production"
}
```

### 2. API 엔드포인트 테스트
```bash
# 루트 엔드포인트
curl https://your-app-name.railway.app/

# 사용자 등록 테스트
curl -X POST https://your-app-name.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "테스트 사용자"
  }'
```

### 3. 데이터베이스 연결 확인
```bash
# 디버그 엔드포인트 (관리자만)
curl https://your-app-name.railway.app/debug/users
```

## 🔄 자동 배포 설정

### GitHub 연동
1. Railway 대시보드에서 "Settings" → "GitHub"
2. GitHub 저장소 연결
3. 자동 배포 활성화

### 배포 브랜치 설정
- 기본 브랜치: `main`
- 배포 트리거: Push to main branch

## 💰 비용 관리

### 무료 티어 제한
- 월 500시간 사용
- 512MB RAM
- 1GB 디스크

### 유료 플랜 업그레이드
- $5/월부터 시작
- 더 많은 리소스 및 기능

## 📞 지원

### 문제 발생 시
1. Railway 로그 확인
2. 환경변수 재확인
3. 데이터베이스 연결 상태 확인
4. Railway 지원팀 문의

### 유용한 명령어
```bash
# 프로젝트 상태 확인
railway status

# 환경변수 확인
railway variables

# 서비스 재시작
railway service restart

# 프로젝트 정보
railway whoami
```

---

**🎉 배포가 완료되면 프론트엔드에서 API URL을 업데이트하세요!** 