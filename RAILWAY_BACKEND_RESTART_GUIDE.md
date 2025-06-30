# Railway 백엔드 재시작 가이드

## 🚨 현재 상황
- Railway 백엔드가 다운됨 ("Application not found" 오류)
- 회원가입/로그인 API 호출 불가
- CMS에서 신규 회원 등록 안됨

## 🔧 해결 방법

### 1. Railway 대시보드 접속
- https://railway.app/dashboard
- 로그인 후 프로젝트 선택

### 2. 백엔드 서비스 확인
- `nadaeri-250629-production` 프로젝트 선택
- `main-api` 서비스 확인

### 3. 서비스 재시작
- **Settings** 탭 → **General** 섹션
- **Restart** 버튼 클릭
- 또는 **Deployments** 탭에서 **Redeploy** 클릭

### 4. 로그 확인
- **Deployments** 탭에서 최신 배포 로그 확인
- 오류 메시지가 있다면 수정 후 재배포

### 5. 도메인 확인
- **Settings** 탭 → **Domains** 섹션
- 현재 도메인이 `https://nadaeri-250629-production.up.railway.app`인지 확인

## 🧪 테스트 방법

### 백엔드 상태 확인
```bash
# Swagger 문서 접속
https://nadaeri-250629-production.up.railway.app/docs

# Health 체크
https://nadaeri-250629-production.up.railway.app/health
```

### API 테스트
```bash
# 회원가입 테스트
curl -X POST "https://nadaeri-250629-production.up.railway.app/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","name":"Test User","email":"test@example.com","password":"test123"}'

# 로그인 테스트
curl -X POST "https://nadaeri-250629-production.up.railway.app/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","password":"test123"}'
```

## 📋 체크리스트
- [ ] Railway 대시보드 접속
- [ ] 백엔드 서비스 재시작
- [ ] 배포 로그 확인 (오류 없음)
- [ ] Swagger 문서 접속 가능
- [ ] 회원가입 API 테스트
- [ ] 로그인 API 테스트
- [ ] Vercel에서 회원가입/로그인 테스트

## 🚀 백엔드 재시작 후
1. Railway에서 백엔드가 정상 실행되는지 확인
2. Vercel에서 회원가입 테스트
3. CMS에서 신규 회원 등록 확인
4. 로그인 테스트

## 📞 문제 지속 시
- Railway 로그에서 구체적인 오류 메시지 확인
- 데이터베이스 연결 상태 확인
- 환경 변수 설정 확인 