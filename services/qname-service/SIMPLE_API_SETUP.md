# 🚀 간단한 API 키 설정 가이드

## 📋 설정 방법 (2가지)

### 방법 1: 코드 내 직접 설정 (추천) ⭐

1. **processor.py 파일 열기**
   ```bash
   # services/qname-service/processor.py
   ```

2. **API 키 변수 찾기** (약 50번째 줄 근처)
   ```python
   # ========================================
   # 🔑 API 키 직접 설정 (환경변수가 없을 때 사용)
   # ========================================
   # Google Gemini API 키를 여기에 직접 입력하세요
   # https://makersuite.google.com/app/apikey 에서 발급
   DIRECT_GEMINI_API_KEY = "your_gemini_api_key_here"  # ← 여기에 실제 API 키 입력
   
   # 네이버 쇼핑 API 키를 여기에 직접 입력하세요 (선택사항)
   # https://developers.naver.com/apps/#/list 에서 발급
   DIRECT_NAVER_CLIENT_ID = "your_naver_client_id_here"  # ← 여기에 실제 Client ID 입력
   DIRECT_NAVER_CLIENT_SECRET = "your_naver_client_secret_here"  # ← 여기에 실제 Client Secret 입력
   ```

3. **실제 API 키로 교체**
   ```python
   DIRECT_GEMINI_API_KEY = "AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz"  # 실제 키
   DIRECT_NAVER_CLIENT_ID = "abc123def456"  # 실제 Client ID
   DIRECT_NAVER_CLIENT_SECRET = "xyz789uvw012"  # 실제 Client Secret
   ```

### 방법 2: 환경변수 설정 (고급 사용자)

1. **env_example.txt를 .env로 복사**
   ```bash
   cp env_example.txt .env
   ```

2. **.env 파일 편집**
   ```bash
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   NAVER_CLIENT_ID=your_actual_naver_client_id_here
   NAVER_CLIENT_SECRET=your_actual_naver_client_secret_here
   ```

---

## 🔑 API 키 발급 방법

### Google Gemini API 키 (필수)

1. **https://makersuite.google.com/app/apikey** 접속
2. Google 계정으로 로그인
3. **"Create API Key"** 버튼 클릭
4. API 키 이름 입력 (예: "QName Service")
5. **"Create API Key"** 클릭
6. 생성된 API 키 복사

### 네이버 쇼핑 API 키 (선택사항)

1. **https://developers.naver.com/apps/#/list** 접속
2. 네이버 계정으로 로그인
3. **"애플리케이션 등록"** 클릭
4. 애플리케이션 정보 입력:
   - 애플리케이션 이름: "QName Service"
   - 사용 API: **"검색"** 선택
   - 서비스 URL: `http://localhost:8004`
5. 등록 후 **Client ID**와 **Client Secret** 복사

---

## ✅ 설정 확인

### 1. 서버 시작
```bash
cd services/qname-service
python main.py
```

### 2. 확인 메시지
```
✅ Gemini API 키 확인됨: AIzaSyC...
✅ 네이버 API 키 확인됨: Client ID: abc123...
🎉 모든 API 키가 정상적으로 설정되었습니다!
   → AI 기반 고품질 상품명 생성 모드로 동작합니다.
```

### 3. 테스트
```bash
curl http://localhost:8004/api/qname/health
```

예상 응답:
```json
{
  "status": "ok",
  "api_keys": "configured",
  "version": "2.0.0",
  "message": "QName 서비스 상태 확인 완료"
}
```

---

## 🎯 우선순위

| 설정 | 우선순위 | 설명 |
|------|----------|------|
| Gemini API | **최우선** | AI 기반 상품명 생성 |
| 네이버 API | 선택사항 | 카테고리 정보 수집 |

### 설정 없을 때 동작
- ✅ 빠른 처리 (API 호출 없음)
- ✅ 기본 템플릿 상품명
- ✅ 기본 카테고리 정보

### 설정 후 동작
- ✅ AI 기반 고품질 상품명
- ✅ 실제 카테고리 정보
- ✅ 고품질 연관검색어

---

## 🔧 문제 해결

### API 키 오류
- [ ] API 키가 올바르게 복사되었는가?
- [ ] 따옴표 안에 정확히 입력되었는가?
- [ ] 서버를 재시작했는가?

### 서버 시작 오류
```bash
# PowerShell에서 올바른 명령어
cd services\qname-service
python main.py
```

### 네트워크 오류
- [ ] 인터넷 연결 확인
- [ ] 방화벽 설정 확인
- [ ] 프록시 설정 확인

---

## 🎉 완료!

API 키 설정이 완료되면:
1. **서버 재시작**
2. **웹 브라우저에서 테스트**
3. **파일 업로드 및 처리 확인**

**이제 완전한 AI 기반 QName 서비스를 사용할 수 있습니다! 🚀** 