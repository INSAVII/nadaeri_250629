# QClick 마이크로서비스 아키텍처

## 개요
QClick 프로젝트가 단일 백엔드에서 마이크로서비스 아키텍처로 리팩토링되었습니다.

## 서비스 구성

### 1. 메인 API 서버 (포트 8001)
**위치**: `services/main-api/`

**기능**:
- 사용자 인증 및 관리
- 결제 및 예치금 관리
- 사용설명서 관리
- 가격 정책 관리
- 홍보문구 관리
- 데이터베이스 관리

**API 엔드포인트**:
- `/api/auth/*` - 인증 관련
- `/api/payments/*` - 결제 관련
- `/api/deposits/*` - 예치금 관련
- `/api/manuals/*` - 사용설명서 관련
- `/api/pricing/*` - 가격 관련
- `/api/promotion/*` - 홍보문구 관련

### 2. 큐네임 서비스 (포트 8002)
**위치**: `services/qname-service/`

**기능**:
- 상품명 생성
- 태그 추출
- 카테고리 관리

**API 엔드포인트**:
- `/api/qname/generate` - 상품명 생성
- `/api/qname/extract-tags` - 태그 추출
- `/api/qname/categories` - 카테고리 목록
- `/api/qname/styles` - 스타일 목록

### 3. 큐문자 서비스 (포트 8003)
**위치**: `services/qtext-service/`

**기능**:
- 텍스트 생성
- 텍스트 재작성
- 콘텐츠 타입 관리

**API 엔드포인트**:
- `/api/qtext/generate` - 텍스트 생성
- `/api/qtext/rewrite` - 텍스트 재작성
- `/api/qtext/content-types` - 콘텐츠 타입 목록
- `/api/qtext/tones` - 톤 목록
- `/api/qtext/lengths` - 길이 옵션

## 실행 방법

### 모든 서비스 시작
```bash
start_microservices.bat
```

### 개별 서비스 시작
```bash
# 메인 API 서버
cd services/main-api
python main.py

# 큐네임 서비스
cd services/qname-service
python main.py

# 큐문자 서비스
cd services/qtext-service
python main.py
```

### 서비스 중지
```bash
stop_microservices.bat
```

## 프론트엔드 연동

### Next.js 프록시 설정
`frontend/next.config.js`에서 각 서비스로의 프록시가 설정되어 있습니다.

### API 호출 방법
```typescript
import { fetchMainAPI, fetchQNameAPI, fetchQTextAPI } from '@/config/apiConfig';

// 메인 API 호출
const response = await fetchMainAPI('/api/auth/login', {
  method: 'POST',
  body: formData
});

// 큐네임 API 호출
const response = await fetchQNameAPI('/api/qname/generate', {
  method: 'POST',
  body: formData
});

// 큐문자 API 호출
const response = await fetchQTextAPI('/api/qtext/generate', {
  method: 'POST',
  body: formData
});
```

## 장점

### 1. 독립적 확장
- 각 서비스별로 독립적으로 스케일링 가능
- 트래픽이 많은 서비스만 확장 가능

### 2. 기술 스택 독립성
- 각 서비스마다 다른 기술 스택 사용 가능
- 서비스별 최적화된 라이브러리 선택 가능

### 3. 장애 격리
- 한 서비스의 장애가 다른 서비스에 영향 주지 않음
- 서비스별 독립적인 배포 및 롤백 가능

### 4. 개발 효율성
- 팀별로 독립적인 개발 가능
- 서비스별 독립적인 테스트 및 배포

## 주의사항

### 1. 네트워크 오버헤드
- 서비스 간 통신으로 인한 지연
- 네트워크 장애 시 전체 시스템 영향

### 2. 데이터 일관성
- 분산 트랜잭션 관리 필요
- 데이터 동기화 이슈 가능성

### 3. 운영 복잡성
- 여러 서비스 모니터링 필요
- 로그 수집 및 분석 복잡성 증가

## 모니터링

### 헬스 체크 엔드포인트
- 메인 API: `http://localhost:8001/health`
- 큐네임 서비스: `http://localhost:8002/health`
- 큐문자 서비스: `http://localhost:8003/health`

### 로그 확인
각 서비스의 콘솔에서 실시간 로그를 확인할 수 있습니다.

## 향후 개선 사항

1. **API Gateway 도입**: 서비스 디스커버리 및 라우팅
2. **로드 밸런서**: 트래픽 분산
3. **서비스 메시**: 서비스 간 통신 관리
4. **모니터링 도구**: Prometheus, Grafana 등
5. **로그 집계**: ELK 스택 등 