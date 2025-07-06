# 도메인 설정 가이드 - www.나대리.kr

## 1. 도메인 구매 및 DNS 설정

### 1.1 도메인 구매
- `나대리.kr` 도메인을 도메인 등록업체에서 구매
- 추천 업체: 가비아, 후이즈, 네임칩 등

### 1.2 DNS 레코드 설정
도메인 관리 페이지에서 다음 DNS 레코드를 설정:

```
# 프론트엔드 (Vercel)
Type: CNAME
Name: www
Value: cname.vercel-dns.com

# 루트 도메인 리다이렉트 (선택사항)
Type: A
Name: @
Value: 76.76.19.36

# 백엔드 API (Railway)
Type: CNAME
Name: api
Value: nadaeri-250629-production.up.railway.app

# QName 서비스 (Railway)
Type: CNAME
Name: qname
Value: [Railway QName 서비스 URL]

# QText 서비스 (Railway)
Type: CNAME
Name: qtext
Value: [Railway QText 서비스 URL]
```

## 2. Vercel 도메인 설정

### 2.1 Vercel 대시보드에서 설정
1. Vercel 대시보드 접속
2. 프로젝트 선택
3. Settings → Domains
4. "Add Domain" 클릭
5. `www.나대리.kr` 입력
6. DNS 검증 완료 대기

### 2.2 SSL 인증서 자동 발급
- Vercel에서 자동으로 SSL 인증서 발급
- HTTPS 리다이렉트 자동 설정

## 3. Railway 도메인 설정

### 3.1 Main API (Railway)
현재 URL: `https://nadaeri-250629-production.up.railway.app`

**서브도메인 설정:**
```
api.나대리.kr → Railway Main API 서비스
```

### 3.2 QName 서비스 (Railway로 마이그레이션)
기존: `https://qclick-qname-service.onrender.com`
변경: `https://[Railway QName 서비스 URL]`

**서브도메인 설정:**
```
qname.나대리.kr → Railway QName 서비스
```

### 3.3 QText 서비스 (Railway)
현재: Railway URL
**서브도메인 설정:**
```
qtext.나대리.kr → Railway QText 서비스
```

## 4. 환경 변수 업데이트

### 4.1 프론트엔드 환경 변수 (Vercel)
```bash
REACT_APP_API_URL=https://api.나대리.kr
REACT_APP_QNAME_API_URL=https://qname.나대리.kr
REACT_APP_QTEXT_API_URL=https://qtext.나대리.kr
REACT_APP_ENVIRONMENT=production
```

### 4.2 백엔드 CORS 설정 (Railway)
모든 Railway 서비스의 환경 변수에 추가:
```bash
CORS_ORIGINS=https://www.나대리.kr,https://나대리.kr,http://localhost:3000
```

## 5. 설정 파일 업데이트

### 5.1 vercel.json 업데이트
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://api.나대리.kr/api/$1"
    }
  ]
}
```

### 5.2 프론트엔드 API 설정
`frontend/src/config/constants.ts` 업데이트:
```typescript
export const getApiUrl = () => {
  return process.env.REACT_APP_API_URL || 'https://api.나대리.kr';
};

export const getQNameApiUrl = () => {
  return process.env.REACT_APP_QNAME_API_URL || 'https://qname.나대리.kr';
};

export const getQTextApiUrl = () => {
  return process.env.REACT_APP_QTEXT_API_URL || 'https://qtext.나대리.kr';
};
```

## 6. Railway 통합 아키텍처

### 6.1 모든 백엔드 서비스 통합
```
Railway 프로젝트: qclick-backend-services
├── Main API (nadaeri-250629-production)
├── QName Service (qname-service)
└── QText Service (qtext-service)
```

### 6.2 통합 관리 이점
- **단일 플랫폼**: 모든 백엔드 서비스 Railway에서 관리
- **통합 모니터링**: 모든 서비스 로그와 성능 통합 확인
- **일관된 설정**: 동일한 배포 환경과 보안 정책
- **비용 효율성**: Railway 하나로 모든 서비스 관리

## 7. 테스트 및 검증

### 7.1 도메인 연결 테스트
```bash
# DNS 전파 확인
nslookup www.나대리.kr
nslookup api.나대리.kr
nslookup qname.나대리.kr
nslookup qtext.나대리.kr

# HTTPS 연결 테스트
curl -I https://www.나대리.kr
curl -I https://api.나대리.kr/health
curl -I https://qname.나대리.kr/health
curl -I https://qtext.나대리.kr/health
```

### 7.2 기능 테스트
- 로그인/회원가입 (Main API)
- QCapture 서비스 (Main API)
- QText 서비스 (QText API)
- QName 서비스 (QName API)
- 결제 시스템 (Main API)
- 관리자 기능 (Main API)

## 8. 모니터링 설정

### 8.1 Railway 통합 모니터링
- Railway 대시보드에서 모든 서비스 모니터링
- 실시간 로그 확인
- 성능 메트릭 추적
- 에러 알림 설정

### 8.2 Uptime 모니터링
- UptimeRobot 또는 Pingdom 설정
- 주요 엔드포인트 모니터링:
  - `https://www.나대리.kr`
  - `https://api.나대리.kr/health`
  - `https://qname.나대리.kr/health`
  - `https://qtext.나대리.kr/health`

## 9. SEO 및 메타데이터

### 9.1 메타 태그 업데이트
```html
<title>나대리 - AI 기반 서비스 플랫폼</title>
<meta name="description" content="AI 기반 이미지 처리, 텍스트 추출, 상품명 생성 서비스">
```

### 9.2 Google Search Console
- 도메인 등록
- 사이트맵 제출
- 검색 성능 모니터링

## 10. 보안 설정

### 10.1 Security Headers
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

### 10.2 CSP (Content Security Policy)
필요시 추가 설정

## 11. 백업 및 롤백 계획

### 11.1 현재 URL 백업
- 현재 Railway URL 유지
- 문제 발생시 빠른 롤백 가능

### 11.2 DNS TTL 설정
- TTL을 낮게 설정 (300초)
- 빠른 DNS 변경 가능

## 12. 완료 체크리스트

- [ ] 도메인 구매 완료
- [ ] DNS 레코드 설정
- [ ] Vercel 도메인 연결
- [ ] Railway 서비스들 도메인 연결
- [ ] SSL 인증서 발급 확인
- [ ] 환경 변수 업데이트
- [ ] CORS 설정 업데이트
- [ ] 기능 테스트 완료
- [ ] 모니터링 설정
- [ ] SEO 메타데이터 업데이트
- [ ] 보안 헤더 설정
- [ ] 백업 URL 유지

## 13. 문제 해결

### 13.1 DNS 전파 지연
- 최대 48시간 소요 가능
- TTL 값 확인

### 13.2 SSL 인증서 문제
- Vercel/Railway에서 자동 처리
- 수동 설정 필요시 Let's Encrypt 사용

### 13.3 CORS 오류
- Railway CORS_ORIGINS 설정 확인
- 프론트엔드 API URL 확인

### 13.4 Railway 서비스 연결 문제
- Railway 대시보드에서 서비스 상태 확인
- 로그 확인 및 문제 해결
- 환경 변수 설정 확인 