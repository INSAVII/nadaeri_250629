# API 키 설정 가이드

## 🚀 QName 서비스 완전 활성화를 위한 API 키 설정

### 1. Google Gemini API 키 발급 (필수)

#### 1-1. Google AI Studio 접속
- https://makersuite.google.com/app/apikey 접속
- Google 계정으로 로그인

#### 1-2. API 키 생성
1. "Create API Key" 버튼 클릭
2. API 키 이름 입력 (예: "QName Service")
3. "Create API Key" 클릭
4. 생성된 API 키 복사

#### 1-3. 환경 변수 설정
```bash
# services/qname-service/.env 파일 생성
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. 네이버 쇼핑 API 키 발급 (선택사항)

#### 2-1. 네이버 개발자 센터 접속
- https://developers.naver.com/apps/#/list 접속
- 네이버 계정으로 로그인

#### 2-2. 애플리케이션 등록
1. "애플리케이션 등록" 클릭
2. 애플리케이션 정보 입력:
   - 애플리케이션 이름: "QName Service"
   - 사용 API: "검색" 선택
   - 비로그인 오픈 API 서비스 환경: "웹 서비스 URL" 입력
   - 서비스 URL: `http://localhost:8004`

#### 2-3. API 키 확인
1. 등록된 애플리케이션 클릭
2. "Client ID"와 "Client Secret" 복사

#### 2-4. 환경 변수 설정
```bash
# services/qname-service/.env 파일에 추가
NAVER_CLIENT_ID=your_actual_naver_client_id_here
NAVER_CLIENT_SECRET=your_actual_naver_client_secret_here
```

### 3. 환경 변수 파일 생성

#### 3-1. .env 파일 생성
```bash
# services/qname-service 디렉토리에서
cp env_example.txt .env
```

#### 3-2. .env 파일 편집
```bash
# 실제 API 키로 교체
GEMINI_API_KEY=AIzaSyC...  # 실제 Gemini API 키
NAVER_CLIENT_ID=abc123...  # 실제 네이버 Client ID
NAVER_CLIENT_SECRET=xyz789...  # 실제 네이버 Client Secret
```

### 4. 서버 재시작

#### 4-1. 백엔드 서버 재시작
```bash
# services/qname-service 디렉토리에서
python main.py
```

#### 4-2. 확인 메시지
서버 시작 시 다음과 같은 메시지가 나타나야 합니다:
```
✅ Gemini API 키 확인됨: AIzaSyC...
✅ 네이버 API 키 확인됨: Client ID: abc123...
🎉 모든 API 키가 정상적으로 설정되었습니다!
```

### 5. 테스트

#### 5-1. API 키 확인
```bash
curl http://localhost:8004/api/qname/health
```

#### 5-2. 예상 응답
```json
{
  "status": "ok",
  "api_keys": "configured",
  "version": "2.0.0",
  "message": "QName 서비스 상태 확인 완료"
}
```

## 🔧 문제 해결

### API 키 오류 시
1. API 키가 올바르게 복사되었는지 확인
2. .env 파일이 올바른 위치에 있는지 확인
3. 서버를 재시작했는지 확인
4. API 키의 사용량 한도를 확인

### 네트워크 오류 시
1. 방화벽 설정 확인
2. 프록시 설정 확인
3. 인터넷 연결 상태 확인

## 📊 API 키별 기능

| API 키 | 기능 | 필수 여부 |
|--------|------|-----------|
| Gemini API | 상품명 생성, 연관검색어 생성 | 필수 |
| 네이버 API | 카테고리 정보 수집 | 선택 |

### 기본 모드 (API 키 없음)
- 빠른 처리 (API 호출 없음)
- 기본 템플릿 상품명
- 기본 카테고리 정보

### 완전 모드 (API 키 있음)
- AI 기반 상품명 생성
- 실제 카테고리 정보 수집
- 고품질 연관검색어 생성 