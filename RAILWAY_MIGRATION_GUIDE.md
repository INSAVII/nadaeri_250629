# QName 서비스 Railway 마이그레이션 가이드

## 개요
QName 서비스를 Render에서 Railway로 마이그레이션하여 모든 백엔드 서비스를 통합 관리합니다.

## 마이그레이션 이유
1. **통합 관리**: 모든 백엔드 서비스를 Railway에서 관리
2. **비용 효율성**: 이미 Railway 유료 계정 사용 중
3. **일관성**: 동일한 배포 환경과 설정
4. **모니터링**: 통합된 로그와 성능 모니터링

## 1. Railway 프로젝트 설정

### 1.1 새 서비스 생성
1. Railway 대시보드 접속
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. QName 서비스 저장소 선택

### 1.2 서비스 이름 설정
- **서비스 이름**: `qname-service`
- **프로젝트 이름**: `qclick-backend-services`

## 2. 환경 변수 설정

### 2.1 Railway 환경 변수
Railway 대시보드에서 다음 환경 변수 설정:

```bash
# 기본 설정
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# CORS 설정
CORS_ORIGINS=https://www.나대리.kr,https://나대리.kr,http://localhost:3000

# API 키들
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

### 2.2 기존 Render 환경 변수 백업
Render 대시보드에서 현재 환경 변수를 복사하여 Railway에 설정

## 3. 배포 설정

### 3.1 생성된 파일들
- `railway.json` - Railway 배포 설정
- `Procfile` - 프로세스 시작 명령
- `requirements.txt` - Python 의존성 (기존 파일)

### 3.2 배포 확인
1. GitHub 저장소에 변경사항 푸시
2. Railway에서 자동 배포 시작
3. 배포 로그 확인
4. 헬스체크 엔드포인트 테스트: `/health`

## 4. 도메인 설정

### 4.1 DNS 레코드 업데이트
기존 Render 도메인을 Railway로 변경:

```
# 기존 (Render)
qname.나대리.kr → qclick-qname-service.onrender.com

# 변경 후 (Railway)
qname.나대리.kr → [Railway QName 서비스 URL]
```

### 4.2 Railway 커스텀 도메인 설정
1. Railway 대시보드 → QName 서비스 → Settings
2. "Custom Domains" 섹션
3. `qname.나대리.kr` 추가
4. DNS 검증 완료 대기

## 5. 프론트엔드 설정 업데이트

### 5.1 환경 변수 업데이트
Vercel 환경 변수에서 QName API URL 업데이트:

```bash
REACT_APP_QNAME_API_URL=https://qname.나대리.kr
```

### 5.2 constants.ts 업데이트
`frontend/src/config/constants.ts`에서 기본 URL 변경:

```typescript
export const getQNameApiUrl = (): string => {
  // 프로덕션 환경
  if (IS_PRODUCTION && !window.location.hostname.includes('localhost')) {
    return envUrl || 'https://qname.나대리.kr';
  }
  // 개발 환경
  return 'http://localhost:8004';
};
```

## 6. 테스트 및 검증

### 6.1 기능 테스트
1. **헬스체크**: `https://qname.나대리.kr/health`
2. **단일 상품명 생성**: `/api/qname/generate-single`
3. **엑셀 파일 처리**: `/api/qname/process-file`
4. **프론트엔드 연동**: QName 페이지에서 전체 플로우 테스트

### 6.2 성능 테스트
1. **응답 시간**: API 응답 시간 측정
2. **동시 요청**: 여러 사용자 동시 접속 테스트
3. **파일 업로드**: 대용량 엑셀 파일 처리 테스트

## 7. 모니터링 설정

### 7.1 Railway 모니터링
- 실시간 로그 확인
- 성능 메트릭 모니터링
- 에러 알림 설정

### 7.2 외부 모니터링
- UptimeRobot: `https://qname.나대리.kr/health`
- 응답 시간 모니터링

## 8. Rollback 계획

### 8.1 문제 발생시 대응
1. **Render 서비스 유지**: 마이그레이션 완료 전까지 Render 서비스 유지
2. **DNS 롤백**: 문제 발생시 DNS를 다시 Render로 변경
3. **환경 변수 백업**: 모든 설정 백업 유지

### 8.2 성공 확인 후
1. **Render 서비스 삭제**: 모든 테스트 완료 후 Render 서비스 삭제
2. **비용 절약**: Render 무료 계정 해지

## 9. 완료 체크리스트

- [ ] Railway 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] 배포 성공 확인
- [ ] 헬스체크 엔드포인트 테스트
- [ ] 기능 테스트 완료
- [ ] 도메인 설정 완료
- [ ] 프론트엔드 연동 테스트
- [ ] 성능 테스트 완료
- [ ] 모니터링 설정
- [ ] Render 서비스 삭제

## 10. 예상 이점

### 10.1 관리 효율성
- **통합 대시보드**: 모든 서비스 한 곳에서 관리
- **일관된 설정**: 동일한 배포 환경
- **통합 로그**: 모든 서비스 로그 통합 확인

### 10.2 비용 효율성
- **단일 플랫폼**: Railway 하나로 모든 백엔드 관리
- **리소스 최적화**: 통합된 리소스 관리
- **불필요한 비용 제거**: Render 계정 해지

### 10.3 기술적 이점
- **동일한 인프라**: 일관된 성능과 안정성
- **통합 보안**: 동일한 보안 정책 적용
- **확장성**: Railway의 고급 기능 활용

## 11. 주의사항

### 11.1 마이그레이션 순서
1. Railway 배포 완료 후 테스트
2. 도메인 설정 완료 후 검증
3. 모든 테스트 통과 후 Render 삭제

### 11.2 데이터 백업
- 환경 변수 백업
- 설정 파일 백업
- 로그 데이터 백업

### 11.3 사용자 알림
- 마이그레이션 중 서비스 중단 최소화
- 문제 발생시 빠른 롤백 준비 