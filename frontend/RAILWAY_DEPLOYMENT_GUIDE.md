# Railway 프론트엔드 배포 가이드

## 사전 준비사항

1. **Railway 계정 및 프로젝트 생성**
   - [Railway.app](https://railway.app)에서 계정 생성
   - 새 프로젝트 생성

2. **GitHub 연동**
   - GitHub 저장소와 Railway 프로젝트 연결

## 배포 절차

### 1단계: Railway 프로젝트에 서비스 추가

1. Railway 대시보드에서 프로젝트 선택
2. "New Service" → "GitHub Repo" 선택
3. 저장소에서 `frontend` 폴더 선택
4. 서비스 이름: `qclick-frontend` (또는 원하는 이름)

### 2단계: 환경 변수 설정

Railway 대시보드에서 다음 환경 변수들을 설정:

```bash
NODE_ENV=production
PORT=3000
REACT_APP_API_URL=https://nadaeri250629-production.up.railway.app
REACT_APP_QNAME_API_URL=https://qname-production.up.railway.app
REACT_APP_QTEXT_API_URL=https://qtext-production.up.railway.app
REACT_APP_ENVIRONMENT=production
```

### 3단계: 빌드 설정 확인

- **Builder**: Nixpacks (자동 감지)
- **Start Command**: `npm run start:railway`
- **Health Check Path**: `/health`
- **Health Check Timeout**: 300

### 4단계: 배포 실행

1. Railway에서 배포 시작
2. 빌드 로그 모니터링
3. 배포 완료 대기

### 5단계: 배포 후 확인

1. **헬스체크**: `https://your-domain.railway.app/health`
2. **테스트 페이지**: `https://your-domain.railway.app/test_railway_deployment.html`
3. **프론트엔드 접속**: `https://your-domain.railway.app/`
4. **API 연결 테스트**
5. **기능 테스트**

## 🛡️ SVG 에러 해결 시스템

### 문제 설명
Railway 배포 시 다음과 같은 SVG 에러가 발생할 수 있습니다:
```
Error: <svg> attribute viewBox: Expected number, "0 0 100% 129px"
Error: <svg> attribute viewBox: Expected number, "0 0 100% 64"
```

### 해결 방법
프로젝트에 다음 보호 시스템이 포함되어 있습니다:

1. **자동 SVG viewBox 검증 및 수정**
2. **외부 분석 스크립트 차단** (rrweb, osano 등)
3. **동적 에러 감지 및 복구**
4. **ErrorBoundary를 통한 에러 처리**

### 테스트 방법
배포 후 다음 URL에서 테스트:
```
https://your-domain.railway.app/test_railway_deployment.html
```

## 문제 해결

### 빌드 실패
- `npm ci` 대신 `npm install` 사용 시도
- Node.js 버전 확인 (18.x 권장)

### 런타임 에러
- 환경 변수 설정 확인
- API URL 설정 확인
- 포트 설정 확인

### SVG 에러
- 테스트 페이지에서 SVG 에러 확인
- 브라우저 개발자 도구에서 콘솔 에러 확인
- 자동 수정 시스템이 작동하는지 확인

### 정적 파일 로딩 실패
- `public-url` 설정 확인
- 빌드 출력 디렉토리 확인

## 모니터링

- Railway 대시보드에서 실시간 로그 확인
- 성능 메트릭 모니터링
- 에러 알림 설정

## 업데이트 배포

1. GitHub에 코드 푸시
2. Railway 자동 배포 트리거
3. 배포 상태 확인
4. 새 버전 테스트

## 🔧 추가 디버깅 도구

### 콘솔에서 SVG 상태 확인
```javascript
// 모든 SVG 요소의 viewBox 확인
document.querySelectorAll('svg').forEach(svg => {
  console.log('SVG viewBox:', svg.getAttribute('viewBox'));
});

// 외부 스크립트 확인
document.querySelectorAll('script[src]').forEach(script => {
  console.log('Script src:', script.src);
});
```

### 수동 SVG 수정
```javascript
// 잘못된 viewBox 수정
document.querySelectorAll('svg').forEach(svg => {
  const viewBox = svg.getAttribute('viewBox');
  if (viewBox && (viewBox.includes('%') || viewBox.includes('px'))) {
    svg.setAttribute('viewBox', '0 0 24 24');
    console.log('SVG viewBox 수정됨:', viewBox);
  }
});
```

## 📊 성능 최적화

- **빌드 최적화**: `--no-source-maps` 사용
- **정적 파일 캐싱**: Express 정적 파일 서빙
- **압축**: Gzip 압축 활성화
- **CDN**: Railway의 글로벌 CDN 활용

---

**배포 완료 후**: 모든 체크리스트 항목이 완료되고 SVG 에러가 해결되면 배포가 성공적으로 완료된 것입니다. 