# 🚀 QName 서비스 빠른 시작 가이드

## ⚡ 1분 만에 시작하기

### 1단계: 서비스 시작
```bash
# 루트 디렉토리에서
start_all_services.bat
```

### 2단계: 브라우저 접속
```
http://localhost:3002
```

### 3단계: 테스트
- 로그인 → QName 페이지 → 파일 업로드

---

## 🔑 API 키 설정 (선택사항)

### 기본 모드 (API 키 없음)
- ✅ 즉시 사용 가능
- ✅ 빠른 처리
- ⚠️ 기본 템플릿 상품명

### AI 모드 (API 키 설정)
- ✅ AI 기반 고품질 상품명
- ✅ 실제 카테고리 정보
- ⚠️ API 키 발급 필요

### API 키 설정 방법
1. **processor.py 파일 열기**
2. **다음 변수 찾기**:
   ```python
   DIRECT_GEMINI_API_KEY = "your_gemini_api_key_here"
   ```
3. **실제 API 키로 교체**:
   ```python
   DIRECT_GEMINI_API_KEY = "AIzaSyC1234567890..."
   ```
4. **서버 재시작**

---

## 📁 파일 구조

```
250624_cms01/
├── start_all_services.bat      # 전체 서비스 시작
├── start_qname_service.bat     # 백엔드만 시작
├── start_frontend.bat          # 프론트엔드만 시작
├── services/qname-service/
│   ├── processor.py            # API 키 설정 파일
│   ├── main.py                 # 백엔드 서버
│   └── SIMPLE_API_SETUP.md     # API 키 설정 가이드
└── frontend/
    └── src/pages/QName.tsx     # 프론트엔드 페이지
```

---

## 🎯 사용 시나리오

### 시나리오 1: 빠른 테스트
1. `start_all_services.bat` 실행
2. 브라우저에서 `http://localhost:3002` 접속
3. 파일 업로드 및 처리 테스트

### 시나리오 2: AI 기능 사용
1. API 키 발급 (https://makersuite.google.com/app/apikey)
2. `processor.py`에서 API 키 설정
3. 서버 재시작
4. 고품질 AI 상품명 생성 테스트

### 시나리오 3: 개발/디버깅
1. `start_qname_service.bat` (백엔드만)
2. `start_frontend.bat` (프론트엔드만)
3. 각각 별도 창에서 로그 확인

---

## 🔧 문제 해결

### 서버 시작 실패
```bash
# PowerShell에서 수동 실행
cd services\qname-service
python main.py
```

### 프론트엔드 빌드 실패
```bash
cd frontend
npm install
npx parcel src/index.html --port 3002
```

### API 호출 실패
- API 키 설정 확인
- 서버 재시작
- 네트워크 연결 확인

---

## 📊 기능 비교

| 기능 | 기본 모드 | AI 모드 |
|------|-----------|---------|
| 처리 속도 | 빠름 | 보통 |
| 상품명 품질 | 기본 | 고품질 |
| 카테고리 정보 | 기본 | 실제 |
| 설정 복잡도 | 없음 | 간단 |
| 비용 | 무료 | API 사용량 |

---

## 🎉 완료!

이제 QName 서비스를 완전히 사용할 수 있습니다!

**추가 도움이 필요하면:**
- `SIMPLE_API_SETUP.md` - API 키 설정
- `QNAME_SERVICE_IMPROVEMENT_GUIDE.md` - 상세 개선 가이드 