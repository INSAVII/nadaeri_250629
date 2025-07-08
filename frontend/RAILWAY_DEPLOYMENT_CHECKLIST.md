# Railway 프론트엔드 배포 체크리스트

## ✅ 사전 준비 확인

### 1. 코드 준비 상태
- [ ] `railway.json` 설정 완료
- [ ] `nixpacks.toml` 설정 완료
- [ ] `server.js` 헬스체크 엔드포인트 추가
- [ ] `package.json` Railway 스크립트 추가
- [ ] `Procfile` 생성 완료

### 2. 빌드 테스트
- [ ] `npm run build:railway` 성공
- [ ] `npm run start:railway` 로컬 테스트 성공
- [ ] `/health` 엔드포인트 응답 확인

### 3. Git 상태
- [ ] 모든 변경사항 커밋 완료
- [ ] GitHub에 푸시 완료
- [ ] 브랜치 확인 (main/production)

## 🚀 Railway 배포 단계

### 1단계: 서비스 생성
- [ ] Railway 프로젝트 선택
- [ ] "New Service" → "GitHub Repo" 선택
- [ ] 저장소에서 `frontend` 폴더 선택
- [ ] 서비스 이름 설정: `qclick-frontend`

### 2단계: 환경 변수 설정
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `REACT_APP_API_URL=https://nadaeri250629-production.up.railway.app`
- [ ] `REACT_APP_QNAME_API_URL=https://qname-production.up.railway.app`
- [ ] `REACT_APP_QTEXT_API_URL=https://qtext-production.up.railway.app`
- [ ] `REACT_APP_ENVIRONMENT=production`

### 3단계: 빌드 설정 확인
- [ ] Builder: Nixpacks (자동 감지)
- [ ] Start Command: `npm run start:railway`
- [ ] Health Check Path: `/health`
- [ ] Health Check Timeout: 300

### 4단계: 배포 실행
- [ ] 배포 시작
- [ ] 빌드 로그 확인
- [ ] 배포 완료 대기

## 🔍 배포 후 확인

### 1. 헬스체크
- [ ] `https://your-domain.railway.app/health` 접속
- [ ] "OK" 응답 확인

### 2. 프론트엔드 접속
- [ ] 메인 페이지 로딩 확인
- [ ] 네비게이션 작동 확인
- [ ] 로그인/회원가입 기능 확인

### 3. API 연결
- [ ] 백엔드 API 연결 확인
- [ ] QName 서비스 연결 확인
- [ ] QText 서비스 연결 확인

### 4. 기능 테스트
- [ ] 사용자 인증 기능
- [ ] 서비스 사용 기능
- [ ] 결제/충전 기능
- [ ] 관리자 기능

## 🐛 문제 해결

### 빌드 실패 시
- [ ] Node.js 버전 확인 (18.x)
- [ ] 의존성 설치 확인
- [ ] 빌드 로그 상세 확인

### 런타임 에러 시
- [ ] 환경 변수 설정 확인
- [ ] API URL 설정 확인
- [ ] 포트 충돌 확인

### 정적 파일 로딩 실패 시
- [ ] `public-url` 설정 확인
- [ ] 빌드 출력 디렉토리 확인
- [ ] Express 정적 파일 서빙 확인

## 📊 모니터링 설정

- [ ] Railway 대시보드 로그 확인
- [ ] 성능 메트릭 모니터링
- [ ] 에러 알림 설정
- [ ] 사용량 모니터링

## 🔄 업데이트 배포

- [ ] 코드 변경사항 커밋
- [ ] GitHub 푸시
- [ ] Railway 자동 배포 확인
- [ ] 새 버전 테스트

---

**배포 완료 후**: 모든 체크리스트 항목이 완료되면 배포가 성공적으로 완료된 것입니다. 