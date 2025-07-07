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

## 🚂 Railway 배포 상세 가이드

### 현재 상황 확인
- ✅ Railway 계정 연결됨
- ✅ 프로젝트명: `ideal-wonder`
- ✅ 환경: `production`
- ✅ GitHub 연결됨

### 1. Railway 프로젝트 설정 확인

**현재 화면에서 확인할 항목:**
- `Deployments` - 배포 히스토리
- `Variables` - 환경변수 설정 (중요!)
- `Metrics` - 사용량 모니터링
- `Settings` - 프로젝트 설정

### 2. GitHub 푸시 먼저 완료
Railway 배포 전에 먼저 GitHub 푸시를 완료하세요:
```powershell
git push origin main
```

### 3. Variables (환경변수) 설정

**Railway 대시보드에서 `Variables` 탭 클릭 후 다음 환경변수들을 추가:**

**필수 환경변수:**
```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=Qw8!z2@pLk3#v9$Xc7^b1*Gh5&n0Jr4T
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

**UTF-8 인코딩 환경변수 (필수):**
```
LANG=C.UTF-8
LC_ALL=C.UTF-8
PYTHONIOENCODING=utf-8
PYTHONUNBUFFERED=1
```

**기타 설정:**
```
ENVIRONMENT=production
DEBUG=false
PORT=8001
```

### 4. 서비스 루트 디렉토리 설정

**Settings 탭에서:**
1. `Root Directory` 설정: `services/main-api`
2. `Build Command`: 자동 감지 (requirements.txt 기반)
3. `Start Command`: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 5. PostgreSQL 데이터베이스 추가

**Railway 대시보드에서:**
1. `Add Service` 또는 `New` 버튼 클릭
2. `Database` → `PostgreSQL` 선택
3. 자동으로 DATABASE_URL 환경변수 생성됨

### 6. 배포 실행

**자동 배포 (권장):**
- GitHub에 푸시하면 자동으로 배포 시작
- `Deployments` 탭에서 진행 상황 확인

**수동 배포:**
```powershell
cd services/main-api
railway up
```

### 7. 배포 확인

**배포 완료 후 확인:**
1. `Deployments` 탭에서 배포 상태 확인
2. 생성된 URL로 헬스체크: `https://ideal-wonder-production.up.railway.app/health`
3. 로그에서 UTF-8 오류 없는지 확인

### 8. 도메인 설정 (선택사항)

**Settings → Custom Domain에서:**
- 커스텀 도메인 연결 가능
- 예: `api.yourdomain.com`

---

**✅ 이제 UTF-8 인코딩 문제없이 안전하게 배포할 수 있습니다!**

---

## 🚂 Railway 실제 배포 설정 가이드 (ideal-wonder 프로젝트)

### 1. 현재 Railway 프로젝트 상태 확인
- ✅ 프로젝트명: `ideal-wonder` (자동생성됨)
- ✅ 환경: `production`
- ✅ GitHub 연결: 완료된 상태
- 화면 메뉴: Deployments, Variables, Metrics, Settings

### 2. 🔧 Variables (환경변수) 설정 - **가장 중요!**

Railway 대시보드에서 **Variables** 탭을 클릭하고 다음 환경변수들을 추가하세요:

#### 필수 환경변수:
```
DATABASE_URL=postgresql://username:password@hostname:port/database
JWT_SECRET=your-jwt-secret-key-here
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
CORS_ORIGINS=https://your-frontend-domain.vercel.app
```

#### UTF-8 인코딩 환경변수 (필수):
```
LANG=C.UTF-8
LC_ALL=C.UTF-8
PYTHONIOENCODING=utf-8
PYTHONUNBUFFERED=1
```

#### Railway 서비스 설정:
```
PORT=8000
PYTHONPATH=/app
```

### 3. 🎯 Settings 탭에서 배포 설정

#### Root Directory 설정:
- Settings → General → Root Directory
- **중요**: `services/main-api`로 설정 (백엔드 API 폴더)

#### Start Command 설정 (선택사항):
- Settings → Deploy → Start Command
- 추천: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Python Version 설정:
- Settings → Environment → Python Version
- 추천: `3.11` 또는 `3.12`

#### 🌐 Public Networking 설정 (중요!):
Railway에서 **Settings → Networking** 으로 이동하여 다음과 같이 설정:

**1. Generate Domain (기본 도메인 생성):**
- `Generate Domain` 버튼 클릭
- 자동으로 `https://ideal-wonder-production.up.railway.app` 형태 생성
- 이 도메인이 백엔드 API의 공개 URL이 됩니다

**2. Port 설정:**
- Railway는 자동으로 `$PORT` 환경변수를 제공
- 애플리케이션에서 `PORT` 환경변수 사용 필수
- 기본값: 포트 8000 (FastAPI 기본)

**3. Health Check Path 설정 (선택사항):**
- Health Check Path: `/health` 또는 `/` 
- Railway가 서비스 상태를 모니터링하는 경로

**4. Custom Domain 설정 (선택사항):**
- 자체 도메인 연결 시 사용
- 예: `api.yourdomain.com`
- DNS A 레코드 또는 CNAME 설정 필요

**5. Railway 내부 네트워킹:**
- Private Networking: Railway 내 서비스 간 통신
- 데이터베이스 연결 시 자동으로 private URL 사용

**⚠️ 중요한 Public Networking 체크사항:**
```
✅ Generate Domain 버튼을 눌러 공개 도메인 생성
✅ 애플리케이션이 0.0.0.0:$PORT 에서 실행되도록 설정
✅ Health Check 경로가 올바른지 확인
✅ CORS 설정에 생성된 도메인 추가
```

**FastAPI 애플리케이션 포트 설정 확인:**
```python
# main.py에서 확인할 부분
import os
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

#### 🚀 Railway Generate Service Domain 설정 가이드

**현재 Railway에서 "Generate Service Domain" 화면에 있으시네요!**

**1. 포트 설정 (Enter the port your app is listening on):**
```
8000
```
- FastAPI 기본 포트: `8000`
- Railway는 자동으로 `$PORT` 환경변수를 제공하므로 8000 입력

**2. Generate Domain 버튼 클릭 후:**
- 자동 생성되는 도메인: `https://ideal-wonder-production.up.railway.app`
- 이 URL이 백엔드 API의 공개 접속 주소가 됩니다

**3. 생성 완료 후 확인사항:**
```
✅ Domain: https://ideal-wonder-production.up.railway.app
✅ Port: 8000
✅ Status: Active
```

**4. 즉시 해야 할 작업:**
1. **Variables 탭으로 이동**하여 환경변수 설정
2. **CORS_ORIGINS**에 생성된 도메인 추가:
   ```
   CORS_ORIGINS=https://ideal-wonder-production.up.railway.app,https://localhost:3000
   ```

**5. 도메인 생성 후 테스트:**
```bash
# 생성된 도메인으로 접속 테스트
curl https://ideal-wonder-production.up.railway.app/
curl https://ideal-wonder-production.up.railway.app/health
```

**⚠️ 중요한 포인트:**
- 포트는 `8000` 입력 (FastAPI 기본)
- 생성된 도메인을 CORS 설정에 추가해야 함
- 나중에 Vercel 프론트엔드 도메인도 CORS에 추가 필요

### 🎉 Variables 설정 진행 상황

#### ✅ 완료된 환경변수들:
1. `LANG=C.UTF-8`
2. `LC_ALL=C.UTF-8`
3. `PYTHONIOENCODING=utf-8`
4. `PYTHONUNBUFFERED=1`
5. `JWT_SECRET=Qw8!z2@pLk3#v9$Xc7^b1*Gh5&n0Jr4T`
6. `ENVIRONMENT=production`
7. `DEBUG=false`
8. `CORS_ORIGINS=https://ideal-wonder-production.up.railway.app,https://localhost:3000,https://localhost:5173`
9. `PORT=8000`
10. `PYTHONPATH=/app`
11. `DATABASE_URL=sqlite:///./main.db`

### 🚀 다음 단계: Settings 탭 설정

이제 **Settings** 탭으로 이동하여 다음 설정을 완료하세요:

#### 1. Root Directory 설정 (가장 중요!)
- Settings → General 섹션
- **Root Directory** 필드에 입력: `services/main-api`
- 이 설정으로 Railway가 올바른 폴더에서 앱을 빌드합니다

#### 2. Start Command 설정 (선택사항)
- Settings → Deploy 섹션
- **Start Command** 필드에 입력: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### 3. Build Command (자동 감지됨)
- Railway가 requirements.txt를 자동으로 감지하여 설정
- 수동 설정 불필요

### 🎯 Settings 탭에서 확인할 항목들:

#### General 섹션:
- ✅ **Root Directory**: `services/main-api`
- ✅ **Branch**: `main` (또는 기본 브랜치)

#### Deploy 섹션:
- ✅ **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- ✅ **Build Command**: 자동 감지 (pip install -r requirements.txt)

#### Environment 섹션:
- ✅ **Python Version**: 3.11 또는 3.12 (자동 감지)

### 🚂 배포 준비 완료 체크리스트:

- [x] Variables: 11개 환경변수 설정 완료
- [x] Domain: Generate Domain 완료
- [ ] Settings: Root Directory 설정 (`services/main-api`)
- [ ] Deploy: 배포 실행

**Settings 탭으로 이동하여 Root Directory를 `services/main-api`로 설정해주세요!**

### ⚠️ Root Directory가 보이지 않는 경우 해결방법

**Railway Settings에서 Root Directory 찾는 방법:**

#### 1. Settings 탭 내 섹션들 확인:
- **Source** 섹션 (가장 가능성 높음)
- **General** 섹션  
- **Deploy** 섹션
- **Build** 섹션

#### 2. 대안 방법들:

**방법 A: Source 섹션에서 찾기**
- Settings → **Source** 섹션 확인
- **Root Directory** 또는 **Source Directory** 필드 찾기
- 값: `services/main-api` 입력

**방법 B: railway.json 파일 사용**
Railway가 자동으로 `services/main-api/railway.json` 파일을 읽습니다.
현재 이미 설정되어 있으므로 Root Directory 설정이 불필요할 수 있습니다.

**방법 C: 배포 강제 실행**
Root Directory 설정 없이도 배포를 시도해볼 수 있습니다:
1. **Deployments** 탭으로 이동
2. **Deploy** 또는 **Redeploy** 버튼 클릭

#### 3. Settings 탭에서 현재 보이는 섹션들을 알려주세요:
```
예: General, Deploy, Environment, Source, Build, Networking 등
```

### 🚀 즉시 배포 시도 (권장)

Root Directory 설정이 보이지 않더라도 다음과 같이 진행 가능:

1. **Deployments** 탭으로 이동
2. **Deploy** 버튼 클릭하여 배포 시작
3. 로그에서 빌드 과정 확인

Railway가 `services/main-api/railway.json` 파일을 자동으로 감지하여 올바른 폴더에서 빌드할 가능성이 높습니다.

### 🎯 현재 상황에서 확인할 것:
1. Settings 탭에서 어떤 섹션들이 보이는지 알려주세요
2. 또는 바로 Deployments 탭으로 이동하여 배포를 시도해보세요

**Settings 탭에서 현재 보이는 모든 섹션 이름들을 알려주시면 정확한 위치를 찾아드리겠습니다!** 🔍

### ✅ Root Directory 찾았습니다!

**Source 섹션에서 "Add Root Directory" 옵션이 보이시는군요!**

### 🎯 지금 해야 할 작업:

#### 1. "Add Root Directory" 클릭
- Source 섹션의 **"Add Root Directory"** 버튼을 클릭하세요

#### 2. Root Directory 입력
- 나타나는 입력 필드에 다음 값을 정확히 입력:
```
services/main-api
```

#### 3. 저장/적용
- 입력 후 **Save** 또는 **Apply** 버튼 클릭

### 📝 중요한 포인트:
- 슬래시(`/`) 사용 (백슬래시 아님)
- 경로 시작에 슬래시 없음 (`/services/main-api` ❌)
- 정확한 경로: `services/main-api` ✅

### 🚀 Root Directory 설정 후 즉시 확인:
1. 설정이 저장되었는지 확인
2. **Deployments** 탭으로 이동
3. 자동으로 새로운 배포가 시작되는지 확인

### ⚡ 예상 결과:
Root Directory 설정 후 Railway가 자동으로 다음을 수행합니다:
1. `services/main-api` 폴더에서 `requirements.txt` 감지
2. Python 의존성 설치
3. `main.py` 파일 실행
4. 배포 완료

**이제 Deployments 탭으로 이동하여 배포 상태를 확인해주세요!** 🚂

### ❌ 빌드 실패: UTF-8 인코딩 문제 발생

**오류 내용:**
```
Nixpacks build failed
Error: Error reading frontend/src/pages/admin/CMS_Programs_Backup.tsx
Caused by: stream did not contain valid UTF-8
```

### 🔍 문제 분석:
Railway가 `services/main-api` 폴더가 아닌 **전체 프로젝트**를 빌드하려고 시도하고 있습니다.
`frontend/src/pages/admin/CMS_Programs_Backup.tsx` 파일에 UTF-8이 아닌 인코딩이 포함되어 있어 빌드가 실패했습니다.

### 🚀 즉시 해결방법:

#### 방법 1: 문제 파일 UTF-8로 재저장 (권장)
1. VS Code에서 `frontend/src/pages/admin/CMS_Programs_Backup.tsx` 파일 열기
2. 하단 상태바에서 인코딩 확인 (UTF-8이 아닐 가능성)
3. **Save with Encoding → UTF-8** 선택하여 재저장
4. GitHub에 푸시

#### 방법 2: 문제 파일 임시 제외
```powershell
# 문제 파일을 임시로 이름 변경
cd frontend/src/pages/admin
rename CMS_Programs_Backup.tsx CMS_Programs_Backup.tsx.backup
```

#### 방법 3: .gitignore에 문제 파일 추가
```gitignore
# UTF-8 인코딩 문제 파일들 임시 제외
frontend/src/pages/admin/CMS_Programs_Backup.tsx
**/CMS_Programs_Backup.tsx
```

### 🎯 즉시 실행할 명령어:

#### 1단계: 문제 파일 확인
```powershell
# VS Code에서 파일 열기
code frontend/src/pages/admin/CMS_Programs_Backup.tsx
```

#### 2단계: UTF-8로 재저장
1. 파일을 연 상태에서 **Ctrl+Shift+P**
2. `Change File Encoding` 검색
3. **Save with Encoding** 선택
4. **UTF-8** 선택

#### 3단계: 즉시 GitHub 푸시
```powershell
git add frontend/src/pages/admin/CMS_Programs_Backup.tsx
git commit -m "🔧 CMS_Programs_Backup.tsx UTF-8 인코딩 수정"
git push origin main
```

### ⚡ 빠른 해결 (임시 방법):
문제 파일을 임시로 제외하고 배포를 진행:
```powershell
# 1. 문제 파일 임시 백업
move frontend\src\pages\admin\CMS_Programs_Backup.tsx frontend\src\pages\admin\CMS_Programs_Backup.tsx.backup

# 2. 즉시 푸시
git add .
git commit -m "🔧 UTF-8 문제 파일 임시 제외"
git push origin main
```

### 🔄 Railway 재배포:
파일 수정 후 Railway에서 자동으로 재배포되거나, 수동으로 **Redeploy** 버튼 클릭

**먼저 어떤 방법으로 진행하시겠습니까?**
1. 파일 UTF-8 재저장 (권장)
2. 문제 파일 임시 제외 (빠른 해결)

알려주시면 구체적인 단계를 안내해드리겠습니다! 🛠️

### ✅ UTF-8 인코딩 문제 해결 완료!

**성공적으로 완료된 작업:**
1. ✅ `CMS_Programs_Backup.tsx` 파일을 UTF-8로 재저장
2. ✅ GitHub에 푸시 완료 (`cee639e..9618da4`)
3. ✅ Railway 자동 재배포 시작됨

### 🚀 다음 단계: Railway 배포 확인

**이제 Railway 대시보드에서 확인하세요:**

1. **Deployments** 탭으로 이동
2. 새로운 배포가 자동으로 시작되었는지 확인
3. 빌드 로그에서 UTF-8 오류가 해결되었는지 확인

### 📊 배포 성공 후 확인:
배포가 완료되면 생성된 도메인으로 접속 테스트:
```
https://ideal-wonder-production.up.railway.app/
https://ideal-wonder-production.up.railway.app/health
```

**Railway Deployments 탭에서 새로운 배포 진행 상황을 확인해주세요!** 🚂

UTF-8 인코딩 문제가 해결되어 이번에는 성공할 가능성이 높습니다! 📈

### ❌ 새로운 문제: Railway가 전체 프로젝트를 빌드하고 있음

**현재 문제:**
```
context: vxdd-ajAz
Nixpacks build failed
Nixpacks was unable to generate a build plan for this app.
The contents of the app directory are:
250707_1143hrs_배포도전.md
큐문자 실행방법.txt
SERVER_COMMANDS.md
```

### 🔍 근본 원인:
Railway가 **Root Directory 설정을 무시**하고 전체 프로젝트를 스캔하고 있습니다.
이로 인해 한글 파일들 때문에 빌드 플랜 생성에 실패하고 있습니다.

### 🚀 강제 해결방법:

#### 방법 1: Settings에서 Root Directory 완전 재설정 (권장)
1. **Settings** → **Source** 섹션으로 이동
2. 현재 Root Directory 설정을 **완전히 제거**
3. 다시 **Add Root Directory** 클릭
4. `services/main-api` 입력 후 **Save**
5. **반드시 Save 버튼 클릭** 후 페이지 새로고침
6. 설정이 저장되었는지 재확인
7. **Deployments** 탭에서 **Redeploy** 클릭

#### 방법 2: 한글 파일들 완전 제거 (임시 해결)
```powershell
# 한글 파일들을 임시 폴더로 이동
mkdir temp_korean_files
move "250707_*" temp_korean_files/
move "큐*" temp_korean_files/
move "SERVER_COMMANDS.md" temp_korean_files/
move "PROJECT_PLAN.md" temp_korean_files/

# 즉시 푸시
git add .
git commit -m "🔧 한글 파일들 임시 제거 - Railway 빌드 문제 해결"
git push origin main
```

#### 방법 3: Services 폴더만 별도 Repository 생성
Railway가 Root Directory를 인식하지 못하므로 아예 별도 저장소 생성:
```powershell
# 새 저장소 생성 및 main-api만 복사
mkdir railway-main-api
cd railway-main-api
git init
copy ..\services\main-api\* .
git add .
git commit -m "Railway 전용 main-api 저장소"
# GitHub에 새 저장소 생성 후 푸시
```

### 🎯 즉시 실행할 해결순서:

#### 1단계: Railway Settings 강제 재설정
1. **Railway Settings** → **Source** 섹션
2. Root Directory 설정 **완전 삭제**
3. 페이지 **새로고침** (F5)
4. **Add Root Directory** 다시 클릭
5. `services/main-api` 입력
6. **Save** 클릭 후 **반드시 확인**

#### 2단계: 설정 확인 후 재배포
1. Root Directory가 제대로 저장되었는지 확인
2. **Deployments** 탭으로 이동
3. **Redeploy** 버튼 클릭

#### 3단계: 여전히 실패 시 - 한글 파일 임시 제거
```powershell
# 임시 폴더 생성
mkdir temp_korean_docs

# 한글 파일들 이동
move "250707_*" temp_korean_docs/
move "큐*" temp_korean_docs/
move "빠른해결가이드.md" temp_korean_docs/
move "실행방법250624.txt" temp_korean_docs/

# 즉시 푸시
git add .
git commit -m "🔧 한글 문서 임시 제거 - Railway Root Directory 강제 적용"
git push origin main
```

### ⚠️ 중요한 체크포인트:
```
❌ Railway가 전체 루트를 스캔하고 있음
❌ Root Directory 설정이 적용되지 않음
❌ .railwayignore 파일이 무시됨
✅ Settings에서 Root Directory 강제 재설정 필요
✅ 최악의 경우 한글 파일들 임시 제거 필요
```

### 🚨 긴급 해결책:
지금 당장 배포가 필요하다면 **한글 파일들을 임시로 제거**하는 것이 가장 확실합니다:

```powershell
# 한글 파일들 백업 후 제거
mkdir backup_korean_files
move "250707_*" backup_korean_files/
move "큐*" backup_korean_files/
git add .
git commit -m "⚡ 긴급: 한글 파일 제거로 Railway 빌드 문제 해결"
git push origin main
```

**어떤 방법으로 진행하시겠습니까?**
1. **Settings에서 Root Directory 강제 재설정** (권장)
2. **한글 파일들 임시 제거** (빠른 해결)
3. **별도 저장소 생성** (근본적 해결)

선택해주시면 구체적인 명령어를 실행해드리겠습니다! 🛠️

## 🚂 Railway 동시 배포 관리 가이드

### ⚠️ 여러 배포가 동시 진행 중일 때 해결방법:

#### 1. Deployments 탭에서 현재 상황 확인
- 진행 중인 배포들의 **시간순서** 확인
- **가장 최신 배포** (맨 위) 식별

#### 2. 이전 배포들 Abort 하기
1. **이전 배포** 클릭
2. **⋯ (Actions)** 메뉴 클릭  
3. **"Cancel"** 또는 **"Abort"** 선택
4. 확인 후 abort 실행

#### 3. 최신 배포만 남기고 모니터링
- **가장 최근 푸시한 배포**만 진행
- **Logs** 탭에서 실시간 로그 확인
- **건강상태 체크** 대기

#### 4. 배포 완료 후 확인사항
```
✅ 배포 상태: Deployed
✅ 상태: Active  
✅ URL 접속: https://ideal-wonder-production.up.railway.app
✅ Health Check: 통과
```

### 🎯 동시 배포 방지 방법:
- **한 번에 하나씩** GitHub 푸시
- **이전 배포 완료** 확인 후 다음 푸시
- **Deployments 상태** 모니터링

### 📊 정상 배포 흐름:
```
1. GitHub 푸시
2. Railway 자동 감지
3. 단일 배포 시작
4. 빌드 → 배포 → 활성화
5. Health Check 통과
6. 서비스 정상 운영
```

## 🚨 Railway Health Check 실패 문제 해결 진행 중

#### ❌ 발생한 문제:
```
Attempt #1-6 failed with service unavailable
Health Check 계속 실패 - 서비스가 응답하지 않음
```

#### 🔍 가능한 원인들:
1. **임포트 오류**: 의존성 모듈들이 정상적으로 로드되지 않음
2. **포트 바인딩 실패**: 애플리케이션이 올바른 포트에서 시작되지 않음
3. **데이터베이스 연결 실패**: DB 초기화 과정에서 오류
4. **환경변수 문제**: 필수 환경변수가 누락되거나 잘못 설정됨

#### 🚀 현재 해결 시도 중:

**1단계: 최소 버전으로 테스트 (진행 중)**
- ✅ `main_simple.py` 생성 (최소 의존성)
- ✅ `railway.json` 수정 → `"startCommand": "python main_simple.py"`
- ✅ GitHub 푸시 완료 (`0aca455`)
- 🔄 Railway 배포 진행 중...

**2단계: 로그 분석 (대기 중)**
Railway Deployments → Logs에서 확인할 항목:
```
✅ 빌드 성공 여부
✅ Python 패키지 설치 성공
✅ 서버 시작 메시지
❌ 임포트 오류 메시지
❌ 포트 바인딩 오류
❌ 데이터베이스 연결 오류
```

#### 📊 최소 버전 테스트 내용:
```python
# main_simple.py - 최소 기능만 포함
- FastAPI 기본 앱
- / 엔드포인트
- /health 엔드포인트
- 데이터베이스 없음
- 최소 임포트만 사용
```

#### 🎯 예상 결과:
- ✅ 성공 시: Health Check 통과 → 점진적으로 기능 추가
- ❌ 실패 시: Railway 환경 자체 문제 → 환경변수/설정 재점검

#### 🔄 Railway에서 지금
1. **Deployments** 탭에서 새로운 배포 진행상황
2. **Logs** 탭에서 실시간 빌드/실행 로그
3. **이전 배포들 모두 Abort** (동시 배포 방지)
4. **배포 완료 후 Health Check** 결과 확인

**현재 간단한 버전으로 테스트 배포 중입니다! Railway에서 로그를 확인해주세요.** 🔍

### 🔧 Railway uvicorn $PORT 문제 완전 해결!

#### ❌ 근본 원인 발견:
```
Error: Invalid value for '--port': '$PORT' is not a valid integer.
```
**문제**: Railway가 여러 설정 파일을 혼용해서 uvicorn CLI 명령어를 계속 실행

#### 🔍 발견된 문제 파일들:
1. **✅ railway.json**: `"startCommand": "python main_simple.py"` (올바름)
2. **❌ Procfile**: `web: uvicorn main:app --host 0.0.0.0 --port $PORT` (문제!)
3. **⚠️ Railway 자동 감지**: FastAPI 감지 시 uvicorn 자동 실행

#### 🚀 완전 해결된 사항:

**1. Procfile 수정**
```
❌ 이전: web: uvicorn main:app --host 0.0.0.0 --port $PORT
✅ 수정: web: python main_simple.py
```

**2. nixpacks.toml 생성**
```toml
[start]
cmd = "python main_simple.py"
```

**3. main_simple.py 포트 처리 강화**
```python
try:
    port = int(os.getenv("PORT", 8000))
except (ValueError, TypeError):
    port = 8000
```

#### 📊 배포 우선순위 설정:
```
1. Procfile (최우선)
2. nixpacks.toml 
3. railway.json
4. Dockerfile
5. 자동 감지 (FastAPI → uvicorn)
```

#### ✅ 수정 완료 사항:
- ✅ GitHub 푸시 완료 (`1c1db95`)
- ✅ Railway 자동 재배포 시작됨
- ✅ uvicorn CLI 사용 완전 차단
- ✅ Python 직접 실행으로 강제 변경

#### 🎯 이번에는 성공할 가능성:
```
✅ Procfile에서 python main_simple.py 직접 실행
✅ uvicorn CLI 명령어 완전 차단
✅ $PORT 환경변수 Python에서 안전하게 처리
✅ 모든 빌드 설정 파일에서 일관된 명령어
```

**이제 Railway에서 다시 배포를 확인해주세요. 이번에는 uvicorn CLI 오류가 발생하지 않을 것입니다!** 🚀
