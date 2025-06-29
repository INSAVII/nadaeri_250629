# QClick 배포 환경 가격 관리 시스템 가이드

## 개요

배포 환경(클라우드)에서도 관리자가 서비스 가격을 안정적으로 관리할 수 있는 시스템입니다.

## 🚀 배포 환경에서의 장점

### 1. **데이터베이스 기반 저장**
- 서버 재시작 시에도 데이터 유지
- 여러 인스턴스 간 데이터 동기화
- 트랜잭션 보장

### 2. **환경변수 지원**
- 배포 시 기본 가격 설정 가능
- 환경별 다른 가격 정책 적용

### 3. **하이브리드 저장 방식**
- **우선순위**: 데이터베이스 > 파일 > 환경변수
- 데이터베이스 실패 시 파일 시스템으로 백업
- 완전한 장애 대응

## 📋 지원하는 서비스

| 서비스 | 기본 가격 | 설명 |
|--------|-----------|------|
| **Q네임** | 50원/건당 | 상품명 생성 서비스 |
| **Q텍스트** | 30원/건당 | 텍스트 추출 서비스 |
| **Q캡쳐** | 100원/건당 | 스크린샷 캡쳐 서비스 |

## 🔧 배포 환경 설정

### 1. 환경변수 설정

```bash
# 기본 가격 설정
DEFAULT_QNAME_PRICE=50
DEFAULT_QTEXT_PRICE=30
DEFAULT_QCAPTURE_PRICE=100

# API 서버 URL
API_BASE_URL=https://your-api-domain.com

# 데이터베이스 설정
DATABASE_URL=postgresql://username:password@host/database
```

### 2. Docker 배포

```bash
# Docker 이미지 빌드
docker build -t qclick-api .

# 환경변수와 함께 실행
docker run -d \
  -p 8001:8001 \
  -e DEFAULT_QNAME_PRICE=50 \
  -e DEFAULT_QTEXT_PRICE=30 \
  -e DEFAULT_QCAPTURE_PRICE=100 \
  -e DATABASE_URL=postgresql://... \
  qclick-api
```

## 🛠️ 관리 방법

### 1. 웹 인터페이스 (가장 쉬운 방법)

**접속 방법:**
```
https://your-api-domain.com/static/simple_pricing.html
```

**특징:**
- 직관적인 UI
- 실시간 가격 변경
- 관리자 인증 필요

### 2. 배포용 명령줄 스크립트

**스크립트 위치:**
```
services/main-api/scripts/deployment_pricing.py
```

**사용법:**
```bash
# 현재 가격 확인
python deployment_pricing.py show

# 대화형 모드 (관리자 인증 필요)
python deployment_pricing.py interactive

# 시스템 상태 확인
python deployment_pricing.py status
```

**대화형 모드 예시:**
```bash
$ python deployment_pricing.py interactive

관리자 이메일: admin@qclick.com
관리자 비밀번호: ****

=== 메뉴 ===
1. 현재 가격 확인
2. Q네임 가격 변경
3. Q텍스트 가격 변경
4. Q캡쳐 가격 변경
5. 모든 가격 초기화
6. 시스템 상태 확인
0. 종료

선택하세요: 2
새 Q네임 가격 (원): 75
✅ qname 서비스 가격이 50원에서 75원으로 업데이트되었습니다
```

### 3. API 직접 호출

**인증이 필요한 엔드포인트:**
```bash
# 관리자 토큰 획득
curl -X POST https://your-api-domain.com/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@qclick.com&password=your-password"

# Q네임 가격 변경 (토큰 필요)
curl -X PUT https://your-api-domain.com/api/simple-pricing/qname \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"unit_price": 75}'
```

**인증이 필요 없는 엔드포인트:**
```bash
# 현재 가격 조회
curl https://your-api-domain.com/api/simple-pricing

# 특정 서비스 가격 조회
curl https://your-api-domain.com/api/simple-pricing/qname

# 시스템 상태 확인
curl https://your-api-domain.com/api/simple-pricing/status
```

## 🔍 시스템 상태 확인

### API 응답 예시

```json
{
  "source": "database",
  "database_available": true,
  "file_available": false,
  "environment_variables": {
    "DEFAULT_QNAME_PRICE": 50,
    "DEFAULT_QTEXT_PRICE": 30,
    "DEFAULT_QCAPTURE_PRICE": 100
  },
  "last_updated": "2024-12-26T10:30:00Z",
  "updated_by": "admin@qclick.com"
}
```

### 데이터 소스 설명

- **database**: 데이터베이스에서 가격 정보 로드
- **file**: 로컬 파일에서 가격 정보 로드
- **env**: 환경변수 기본값 사용

## 🔒 보안 고려사항

### 1. 관리자 인증
- 모든 가격 변경 작업은 관리자 토큰 필요
- JWT 토큰 기반 인증
- 토큰 만료 시간 설정 가능

### 2. 권한 관리
- 일반 사용자는 가격 조회만 가능
- 관리자만 가격 변경 가능
- API 엔드포인트별 권한 분리

### 3. 데이터 검증
- 가격 범위 검증 (0 이상)
- 서비스 타입 검증
- 입력 데이터 sanitization

## 🚨 문제 해결

### 데이터베이스 연결 실패
```bash
# 시스템 상태 확인
curl https://your-api-domain.com/api/simple-pricing/status

# 로그 확인
docker logs your-container-name
```

### 권한 오류
```bash
# 관리자 계정 확인
python deployment_pricing.py interactive
# 올바른 이메일/비밀번호 입력
```

### 가격 변경이 반영되지 않음
```bash
# 캐시 확인
curl https://your-api-domain.com/api/simple-pricing

# 데이터베이스 직접 확인
# (데이터베이스 관리 도구 사용)
```

## 📊 모니터링

### 가격 변경 이력
- 데이터베이스에 모든 변경 이력 저장
- 변경 시간, 변경자, 변경 전후 가격 기록
- 감사 로그 제공

### 시스템 메트릭
- API 응답 시간
- 데이터베이스 연결 상태
- 파일 시스템 접근 상태

## 🔄 백업 및 복구

### 자동 백업
```bash
# 데이터베이스 백업
pg_dump your-database > backup.sql

# 설정 파일 백업
cp config/pricing.json backup/
```

### 복구 방법
```bash
# 데이터베이스 복구
psql your-database < backup.sql

# 기본값으로 초기화
python deployment_pricing.py interactive
# 메뉴에서 "5. 모든 가격 초기화" 선택
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. **시스템 상태**: `/api/simple-pricing/status`
2. **로그 확인**: 서버 로그 파일
3. **네트워크 연결**: API 서버 접근 가능 여부
4. **권한 확인**: 관리자 계정 정보

---

**결론**: 이 시스템은 배포 환경에서도 안정적으로 작동하며, 관리자가 3가지 서비스(Q네임, Q텍스트, Q캡쳐)의 가격을 개별적으로 관리할 수 있습니다. 