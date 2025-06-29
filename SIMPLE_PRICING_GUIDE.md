# QClick 간단한 가격 관리 시스템 가이드

## 개요

페이지 제작 없이 관리자가 서비스 가격을 쉽게 관리할 수 있는 간단한 시스템을 구축했습니다.

## 관리 방법

### 1. 웹 인터페이스 (가장 쉬운 방법)

**접속 방법:**
```
http://localhost:8001/static/simple_pricing.html
```

**사용법:**
- 브라우저에서 위 URL에 접속
- 각 서비스의 현재 가격 확인
- 입력창에 새 가격 입력 후 "업데이트" 버튼 클릭
- "초기화" 버튼으로 모든 가격을 기본값으로 복원

### 2. 명령줄 스크립트

**스크립트 위치:**
```
services/main-api/scripts/manage_pricing.py
```

**사용법:**
```bash
# 현재 가격 확인
cd services/main-api
python scripts/manage_pricing.py show

# 특정 서비스 가격 업데이트
python scripts/manage_pricing.py update qname 75
python scripts/manage_pricing.py update qtext 40

# 모든 가격을 기본값으로 초기화
python scripts/manage_pricing.py reset

# 도움말 보기
python scripts/manage_pricing.py help
```

### 3. API 직접 호출

**API 엔드포인트:**
```
GET  /api/simple-pricing          # 모든 서비스 가격 조회
GET  /api/simple-pricing/qname    # Q네임 가격만 조회
PUT  /api/simple-pricing/qname    # Q네임 가격 업데이트
POST /api/simple-pricing/reset    # 모든 가격 초기화
```

**예시 (curl 사용):**
```bash
# 현재 가격 확인
curl http://localhost:8001/api/simple-pricing

# Q네임 가격을 75원으로 변경
curl -X PUT http://localhost:8001/api/simple-pricing/qname \
  -H "Content-Type: application/json" \
  -d '{"unit_price": 75}'

# 모든 가격 초기화
curl -X POST http://localhost:8001/api/simple-pricing/reset
```

## 설정 파일

**파일 위치:**
```
services/main-api/config/pricing.json
```

**파일 구조:**
```json
{
  "services": {
    "qname": {
      "name": "Q네임",
      "unit_price": 50,
      "description": "상품명 생성 서비스",
      "unit": "건당",
      "is_active": true
    },
    "qtext": {
      "name": "Q텍스트",
      "unit_price": 30,
      "description": "텍스트 추출 서비스",
      "unit": "건당",
      "is_active": true
    },
    "qcapture": {
      "name": "Q캡쳐",
      "unit_price": 100,
      "description": "스크린샷 캡쳐 서비스",
      "unit": "건당",
      "is_active": true
    }
  },
  "last_updated": "2024-12-26T00:00:00Z",
  "updated_by": "admin"
}
```

## 기본 가격

- **Q네임**: 50원/건당
- **Q텍스트**: 30원/건당  
- **Q캡쳐**: 100원/건당

## 프론트엔드 연동

기존 프론트엔드에서 새로운 간단한 가격 API를 사용하려면:

```typescript
// 기존 pricingService.ts 대신 사용
export const getSimplePricing = async () => {
  const response = await fetch('/api/simple-pricing');
  return response.json();
};

export const getServicePrice = async (serviceType: string) => {
  const response = await fetch(`/api/simple-pricing/${serviceType}`);
  return response.json();
};
```

## 장점

1. **간단함**: 복잡한 데이터베이스 구조 없이 JSON 파일로 관리
2. **빠른 반영**: 설정 변경이 즉시 적용됨
3. **다양한 접근 방법**: 웹, 명령줄, API 모두 지원
4. **백업 용이**: JSON 파일을 직접 백업/복원 가능
5. **개발자 친화적**: 코드 수정 없이 가격 변경 가능

## 주의사항

1. **권한 관리**: 현재는 관리자 인증이 없으므로, 실제 운영 시에는 보안 강화 필요
2. **동시성**: 여러 사용자가 동시에 수정할 경우 마지막 수정이 우선됨
3. **백업**: 중요한 가격 변경 전에 설정 파일 백업 권장

## 문제 해결

### 서버가 실행되지 않는 경우
```bash
cd services/main-api
python main.py
```

### 권한 오류가 발생하는 경우
```bash
# Windows
icacls config /grant Everyone:F

# Linux/Mac
chmod 755 config
chmod 644 config/pricing.json
```

### 설정 파일이 손상된 경우
```bash
# 기본값으로 초기화
python scripts/manage_pricing.py reset
``` 