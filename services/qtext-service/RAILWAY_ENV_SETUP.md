# Railway 환경변수 설정 가이드

## 필수 환경변수

### 1. 기본 환경변수 (Railway 자동 제공)
```
PORT=8000                    # Railway가 자동으로 제공
```

### 2. 애플리케이션 환경변수
```
ENVIRONMENT=production       # 운영 환경 설정
```

### 3. 선택적 환경변수 (향후 확장용)
```
# Google Cloud Vision API (나중에 추가)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# 메인 API 연동 (나중에 추가)
MAIN_API_URL=https://your-main-api.railway.app
MAIN_API_TOKEN=your-api-token

# 로깅 레벨
LOG_LEVEL=INFO
```

## Railway 대시보드에서 설정 방법

### 1. Railway 프로젝트 접속
- Railway 대시보드 → 프로젝트 선택 → qtext-service1

### 2. 환경변수 설정
- **Variables** 탭 클릭
- **New Variable** 버튼 클릭

### 3. 필수 변수 추가
```
변수명: ENVIRONMENT
값: production
```

### 4. 확인사항
- ✅ PORT는 Railway가 자동으로 제공 (수동 설정 불필요)
- ✅ ENVIRONMENT=production 설정
- ✅ 기타 변수는 나중에 필요시 추가

## 환경변수 확인 방법

### 1. 로컬 테스트
```bash
cd services/qtext-service
python main.py
```

### 2. Railway 배포 후 확인
```bash
# 헬스 체크
curl https://your-qtext-service.railway.app/health

# 응답 예시
{
  "status": "healthy",
  "service": "qtext-service",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 주의사항

1. **PORT 환경변수**: Railway가 자동으로 제공하므로 수동 설정 불필요
2. **민감한 정보**: API 키 등은 Railway 대시보드에서만 설정
3. **환경별 설정**: production, development 등 환경 구분
4. **변경 후 재배포**: 환경변수 변경 후 자동 재배포됨

## 현재 설정 상태

- ✅ PORT: Railway 자동 제공 (8000)
- ✅ ENVIRONMENT: production (수동 설정 필요)
- ⏳ 기타 변수: 필요시 추가
