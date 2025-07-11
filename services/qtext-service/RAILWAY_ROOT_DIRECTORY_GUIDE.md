# Railway Root Directory 설정 가이드

## 현재 프로젝트 구조 분석

```
250624_cms01/                    # 프로젝트 루트
├── services/
│   ├── qtext-service/           # QText 서비스 (배포 대상)
│   │   ├── main.py             # ✅ 메인 애플리케이션
│   │   ├── requirements.txt    # ✅ Python 의존성
│   │   ├── railway.json        # ✅ Railway 설정
│   │   ├── imageprocessor.py   # ✅ 핵심 기능
│   │   └── RAILWAY_ENV_SETUP.md
│   ├── qname-service/          # 다른 서비스
│   └── main-api/               # 다른 서비스
├── frontend/                   # 프론트엔드
├── package.json                # ❌ Node.js 파일 (혼동 가능)
├── vercel.json                 # ❌ Vercel 설정 (혼동 가능)
└── ... (기타 파일들)
```

## Root Directory 설정 옵션

### 옵션 1: services/qtext-service (권장)
```
Root Directory: services/qtext-service
```

**장점:**
- ✅ 정확한 서비스 디렉토리 지정
- ✅ 다른 서비스와 명확히 분리
- ✅ 프로젝트 루트의 혼동 파일들 제외
- ✅ 깔끔한 배포 구조

**Railway 대시보드 설정:**
- Settings → Root Directory → `services/qtext-service`

### 옵션 2: 비워두기 (프로젝트 루트 전체)
```
Root Directory: (비워둠)
```

**장점:**
- ✅ 설정이 간단함
- ✅ 전체 프로젝트 접근 가능

**단점:**
- ❌ 불필요한 파일들도 포함
- ❌ package.json, vercel.json 등 혼동 가능
- ❌ 다른 서비스 파일들도 포함

## 권장 설정: services/qtext-service

### 1. Railway 대시보드에서 설정
1. Railway 프로젝트 → qtext-service1
2. **Settings** 탭 클릭
3. **Root Directory** 섹션에서
4. `services/qtext-service` 입력
5. **Save** 클릭

### 2. 설정 확인
- ✅ main.py 위치: `services/qtext-service/main.py`
- ✅ requirements.txt 위치: `services/qtext-service/requirements.txt`
- ✅ railway.json 위치: `services/qtext-service/railway.json`

### 3. 배포 테스트
```bash
# 로컬에서 테스트
cd services/qtext-service
python main.py

# Railway 배포 후 확인
curl https://your-qtext-service.railway.app/health
```

## 주의사항

1. **정확한 경로**: `services/qtext-service` (슬래시 방향 주의)
2. **대소문자**: 정확히 일치해야 함
3. **변경 후 재배포**: Root Directory 변경 시 자동 재배포됨
4. **파일 확인**: main.py, requirements.txt가 지정된 경로에 있는지 확인

## 현재 설정 상태

- ✅ **권장 설정**: `services/qtext-service`
- ✅ **파일 위치**: 모든 필수 파일이 올바른 위치에 있음
- ✅ **Railway 설정**: railway.json이 올바른 위치에 있음

## 최종 권장사항

**Root Directory를 `services/qtext-service`로 설정하세요.**

이렇게 하면:
- 깔끔하고 명확한 배포 구조
- 다른 서비스와의 분리
- 프로젝트 루트의 혼동 파일들 제외
- 안정적인 Railway 배포
