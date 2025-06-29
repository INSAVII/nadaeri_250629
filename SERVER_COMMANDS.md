# QClick 서버 실행 명령어 가이드

## 🚀 현재 실행 중인 서버 상태
- ✅ **메인 API 서버**: http://localhost:8001
- ✅ **큐네임 서비스**: http://localhost:8002  
- ✅ **큐문자 서비스**: http://localhost:8003
- ✅ **프론트엔드**: http://localhost:3000

## 📋 수동으로 서버 실행하는 방법

### 1. 메인 API 서버 (포트 8001)
```powershell
# 프로젝트 루트에서
cd services\main-api
python main.py
```

### 2. 큐네임 서비스 (포트 8002)
```powershell
# 프로젝트 루트에서
cd services\qname-service
python main.py
```

### 3. 큐문자 서비스 (포트 8003)
```powershell
# 프로젝트 루트에서
cd services\qtext-service
python main.py
```

### 4. 프론트엔드 (포트 3000)
```powershell
# 프로젝트 루트에서
cd frontend
npm run dev
```

## 🔧 배치 파일로 한 번에 실행하기

### 모든 마이크로서비스 실행
```powershell
# 프로젝트 루트에서
.\start_microservices.bat
```

### 프론트엔드만 실행
```powershell
# 프로젝트 루트에서
.\frontend_start.bat
```

## 🌐 브라우저에서 확인하기

### API 서버들 (백엔드)
- **메인 API**: http://localhost:8001
- **큐네임 API**: http://localhost:8002
- **큐문자 API**: http://localhost:8003

### 웹사이트 (프론트엔드)
- **메인 사이트**: http://localhost:3000

## 📊 서버 상태 확인

### 포트별 실행 상태 확인
```powershell
# 모든 8000번대 포트 확인
netstat -ano | findstr ":800"

# 3000번 포트 확인
netstat -ano | findstr ":3000"

# 모든 포트 확인
netstat -ano | findstr ":800\|:3000"
```

### 프로세스 종료
```powershell
# 특정 포트의 프로세스 종료 (PID는 netstat에서 확인)
taskkill /PID [프로세스ID] /F

# 예시: 8001 포트 프로세스 종료
taskkill /PID 21868 /F
```

## 🛠️ 문제 해결

### 1. 포트 충돌 시
```powershell
# 해당 포트 사용 중인 프로세스 확인
netstat -ano | findstr ":8001"

# 프로세스 종료
taskkill /PID [프로세스ID] /F
```

### 2. 의존성 설치
```powershell
# 메인 API 의존성
cd services\main-api
pip install -r requirements.txt

# 큐네임 서비스 의존성
cd ..\qname-service
pip install -r requirements.txt

# 큐문자 서비스 의존성
cd ..\qtext-service
pip install -r requirements.txt

# 프론트엔드 의존성
cd ..\..\frontend
npm install
```

### 3. 환경변수 설정
각 서비스 디렉토리에 `.env` 파일이 필요합니다:
```env
# .env 파일 예시
GEMINI_API_KEY=your_gemini_api_key
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://qclick-app.vercel.app
```

## 📝 실행 순서 권장사항

### 개발 시 권장 순서
1. **백엔드 서버들 먼저 실행**
   ```powershell
   cd services\main-api; python main.py
   cd services\qname-service; python main.py  
   cd services\qtext-service; python main.py
   ```

2. **프론트엔드 실행**
   ```powershell
   cd frontend; npm run dev
   ```

3. **브라우저에서 확인**
   - http://localhost:3000 (메인 사이트)
   - http://localhost:8001 (API 문서)

### 프로덕션 배포 시
- 각 서비스는 독립적으로 배포됩니다
- Railway, Render, Vercel 등에서 자동으로 실행됩니다

## 🔍 디버깅 팁

### 로그 확인
- 각 서버의 콘솔 출력을 확인하세요
- 에러 메시지가 나타나면 해당 부분을 수정하세요

### API 테스트
- http://localhost:8001/docs (FastAPI 자동 문서)
- http://localhost:8002/docs
- http://localhost:8003/docs

### 프론트엔드 개발
- http://localhost:3000 에서 실시간으로 변경사항 확인
- 개발자 도구(F12)에서 네트워크 탭으로 API 호출 확인 