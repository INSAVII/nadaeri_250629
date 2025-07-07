# 🚀 UTF-8 인코딩 배포 완료 가이드

## ✅ 완료된 UTF-8 인코딩 수정사항

### 1. Python 파일 UTF-8 헤더 추가 완료
- ✅ `services/main-api/main.py`
- ✅ `services/qname-service/main.py`
- ✅ `services/qtext-service/main.py`

모든 Python 파일 첫 줄에 `# -*- coding: utf-8 -*-` 헤더가 추가되었습니다.

### 2. Railway 설정 파일 UTF-8 최적화
- ✅ `services/main-api/railway.json` - 클린업 완료
- ✅ 환경변수 설정 가이드 생성: `UTF8_RAILWAY_ENV.txt`

### 3. Vercel 설정 파일 UTF-8 최적화
- ✅ `vercel.json` - UTF-8 환경변수 추가
- ✅ NODE_OPTIONS 메모리 설정 추가

### 4. 의존성 파일 UTF-8 재저장 완료
- ✅ `services/main-api/requirements.txt`
- ✅ `services/qname-service/requirements.txt`
- ✅ `services/qtext-service/requirements.txt`

### 5. 배포 스크립트 UTF-8 버전 생성
- ✅ `deployment/deploy_railway_utf8_fixed.bat`

## 🚀 배포 실행 방법

### Railway 배포 (백엔드)
```cmd
cd deployment
deploy_railway_utf8_fixed.bat
```

**또는 수동 배포:**
```cmd
cd services/main-api
railway up
```

### Vercel 배포 (프론트엔드)
```cmd
cd frontend
vercel --prod
```

## 🔧 Railway 환경변수 설정 (필수)

Railway 대시보드에서 다음 환경변수들을 설정하세요:

**기본 환경변수:**
- `DATABASE_URL` - PostgreSQL 연결 문자열
- `JWT_SECRET` - JWT 비밀키
- `GEMINI_API_KEY` - Google Gemini API 키
- `OPENAI_API_KEY` - OpenAI API 키
- `NAVER_CLIENT_ID` - 네이버 API 클라이언트 ID
- `NAVER_CLIENT_SECRET` - 네이버 API 클라이언트 시크릿
- `CORS_ORIGINS` - 허용할 도메인 (예: https://your-app.vercel.app)

**UTF-8 인코딩 환경변수:**
- `LANG=C.UTF-8`
- `LC_ALL=C.UTF-8`
- `PYTHONIOENCODING=utf-8`
- `PYTHONUNBUFFERED=1`

## 🎯 배포 후 확인사항

### 1. Railway 서비스 확인
```
https://your-app-name.railway.app/health
```

### 2. Vercel 프론트엔드 확인
```
https://your-app.vercel.app
```

### 3. 로그에서 UTF-8 오류 없는지 확인
Railway 대시보드에서 로그를 확인하여 인코딩 관련 오류가 없는지 점검하세요.

## ⚠️ 문제 발생 시 해결방법

### 1. UnicodeDecodeError 발생 시
- Railway 환경변수에 UTF-8 설정이 누락되었는지 확인
- Python 파일에 UTF-8 헤더가 있는지 확인

### 2. 한글 데이터 깨짐 현상
- 데이터베이스 charset이 UTF-8로 설정되었는지 확인
- API 응답 Content-Type에 charset=utf-8이 포함되었는지 확인

### 3. 배포 실패 시
- 로그에서 구체적인 오류 메시지 확인
- 환경변수 설정 재확인
- requirements.txt 의존성 버전 확인

## 📞 지원 파일 위치
- `UTF8_RAILWAY_ENV.txt` - Railway 환경변수 설정 가이드
- `UTF8_VERCEL_ENV.txt` - Vercel 환경변수 설정 가이드
- `UTF8_DOCKER_SETTINGS.txt` - Docker 환경에서 UTF-8 설정

## 📦 GitHub 푸시 가이드

### 1. 자동 푸시 스크립트 실행
```cmd
git_push_utf8.bat
```

### 2. 수동 푸시 (단계별)
```cmd
# 1. Git 상태 확인
git status

# 2. UTF-8 적용된 핵심 파일들만 추가
git add services/main-api/main.py
git add services/qname-service/main.py  
git add services/qtext-service/main.py
git add vercel.json
git add services/main-api/railway.json
git add services/*/requirements.txt
git add DEPLOYMENT_UTF8_COMPLETE.md
git add UTF8_RAILWAY_ENV.txt

# 3. UTF-8 인코딩 해결 커밋
git commit -m "🔧 UTF-8 인코딩 문제 해결 - Railway/Vercel 배포 준비"

# 4. GitHub 푸시
git push origin main
```

### 3. .gitignore 설정 (권장)
한글 파일명 파일들과 민감한 정보를 제외하기 위해:
```cmd
copy .gitignore_utf8 .gitignore
git add .gitignore
git commit -m "📝 .gitignore 업데이트 - 한글 파일명 제외"
```

### 4. GitHub 연동 자동 배포 설정

**Railway 자동 배포:**
1. Railway 대시보드 → New Project
2. Deploy from GitHub repo 선택
3. services/main-api 폴더 지정
4. 환경변수 설정 (UTF8_RAILWAY_ENV.txt 참조)

**Vercel 자동 배포:**
1. Vercel 대시보드 → New Project  
2. GitHub 저장소 연결
3. Root Directory를 'frontend'로 설정
4. 환경변수 설정

---

**✅ 이제 UTF-8 인코딩 문제없이 안전하게 배포할 수 있습니다!**
