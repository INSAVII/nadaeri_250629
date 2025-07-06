# QName 서비스 테스트 가이드

## 현재 상태
- ✅ 프론트엔드: `http://localhost:3003` (정상 실행)
- ✅ 프록시 설정: `/api` → `http://localhost:8001` (정상)

## 1. 백엔드 서비스 실행

### 1.1 메인 API 서버 실행
```bash
cd services/main-api
python main.py
```
**예상 출력:**
```
INFO:     Started server process [xxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### 1.2 QName 서비스 실행
```bash
cd services/qname-service
python main.py
```
**예상 출력:**
```
INFO:     Started server process [xxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8004
```

### 1.3 QText 서비스 실행 (선택사항)
```bash
cd services/qtext-service
python main.py
```
**예상 출력:**
```
INFO:     Started server process [xxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8003
```

## 2. 서비스 상태 확인

### 2.1 헬스체크 엔드포인트
브라우저에서 다음 URL들을 확인:

```
http://localhost:8001/health  (메인 API)
http://localhost:8004/health  (QName 서비스)
http://localhost:8003/health  (QText 서비스)
```

**예상 응답:**
```json
{
  "status": "ok",
  "message": "서비스가 정상 작동 중입니다.",
  "version": "2.0.0"
}
```

### 2.2 프론트엔드 접속
```
http://localhost:3003
```

## 3. QName 서비스 테스트

### 3.1 로그인
1. 프론트엔드 접속: `http://localhost:3003`
2. 로그인 또는 회원가입
3. 대시보드에서 QName 서비스 선택

### 3.2 엑셀 파일 업로드 테스트
1. **테스트 파일 준비**: 
   - `services/qname-service/data/naver.xlsx` 사용
   - 또는 간단한 엑셀 파일 생성

2. **파일 업로드**:
   - QName 페이지에서 "파일 선택" 클릭
   - 엑셀 파일 업로드
   - "상품명 생성" 버튼 클릭

3. **결과 확인**:
   - 처리 진행률 확인
   - 완료 후 결과 파일 다운로드

### 3.3 단일 키워드 테스트
1. QName 페이지에서 "단일 키워드" 탭 선택
2. 키워드 입력 (예: "스마트폰")
3. "상품명 생성" 버튼 클릭
4. 생성된 상품명 확인

## 4. 문제 해결

### 4.1 포트 충돌 문제
```bash
# 포트 사용 확인
netstat -ano | findstr :8001
netstat -ano | findstr :8004
netstat -ano | findstr :8003

# 프로세스 종료
taskkill /f /pid [프로세스ID]
```

### 4.2 의존성 문제
```bash
# Python 패키지 설치
cd services/main-api
pip install -r requirements.txt

cd ../qname-service
pip install -r requirements.txt

cd ../qtext-service
pip install -r requirements.txt
```

### 4.3 환경 변수 문제
각 서비스 디렉토리에 `.env` 파일 확인:
```bash
# services/qname-service/.env
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
CORS_ORIGINS=http://localhost:3003,http://localhost:3000
```

### 4.4 CORS 오류
브라우저 개발자 도구에서 CORS 오류 확인:
- Network 탭에서 요청/응답 확인
- Console 탭에서 오류 메시지 확인

## 5. 로그 확인

### 5.1 서버 로그
각 서비스의 콘솔 출력에서 로그 확인:
- 요청/응답 로그
- 에러 메시지
- 처리 진행 상황

### 5.2 브라우저 로그
F12 → Console 탭에서:
- JavaScript 오류
- API 호출 실패
- 네트워크 오류

## 6. 성공적인 테스트 완료 조건

- [ ] 모든 서비스 정상 시작
- [ ] 헬스체크 엔드포인트 응답 확인
- [ ] 프론트엔드 접속 성공
- [ ] 로그인/회원가입 성공
- [ ] QName 페이지 접속 성공
- [ ] 엑셀 파일 업로드 성공
- [ ] 상품명 생성 성공
- [ ] 결과 파일 다운로드 성공

## 7. 다음 단계

테스트 완료 후:
1. **Railway 배포**: QName 서비스를 Railway로 배포
2. **도메인 설정**: `qname.나대리.kr` 도메인 연결
3. **프로덕션 테스트**: 실제 도메인에서 기능 테스트
4. **Render 서비스 삭제**: 마이그레이션 완료 후 Render 계정 해지 