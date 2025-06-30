# 🚀 프론트엔드 개발 가이드

## 📋 개발 환경 설정

### **필수 조건**
- Node.js 16+ 
- npm 또는 yarn

### **설치**
```bash
cd frontend
npm install
```

## 🛠️ 개발 서버 실행

### **권장 방법 (캐시 문제 방지)**
```bash
cd frontend
npm run dev-clean  # 캐시 정리 + 캐시 비활성화
```

### **일반 개발**
```bash
cd frontend
npm run dev  # 캐시 비활성화
```

### **기본 실행 (캐시 사용)**
```bash
cd frontend
npm start
```

## 🔧 문제 해결

### **캐시 문제 발생 시**
```bash
cd frontend
npm run clean  # 캐시 및 빌드 파일 정리
npm run dev-clean  # 깨끗한 상태에서 시작
```

### **포트 충돌 시**
```bash
# 다른 포트로 실행
npx parcel src/index.html --port 3003
```

## 📦 빌드

### **개발 빌드**
```bash
cd frontend
npm run build
```

### **프로덕션 빌드**
```bash
cd frontend
npm run build
```

## 🚨 주의사항

### **실행 위치**
- ✅ **올바른 방법**: `frontend` 디렉토리에서 실행
- ❌ **잘못된 방법**: 루트 디렉토리에서 `npx parcel frontend/src/index.html` 실행

### **캐시 관리**
- 개발 중 문제 발생 시 `npm run dev-clean` 사용
- 배포 전 `npm run clean`으로 캐시 정리

## 🔍 디버깅

### **캐시 상태 확인**
```bash
ls .parcel-cache  # 캐시 파일 확인
```

### **포트 사용 확인**
```bash
netstat -an | findstr :3002  # 포트 사용 상태 확인
```

## 📚 스크립트 설명

| 스크립트 | 설명 | 사용 시기 |
|----------|------|-----------|
| `start` | 기본 개발 서버 | 일반 개발 |
| `dev` | 캐시 비활성화 | 캐시 문제 방지 |
| `dev-clean` | 캐시 정리 + 비활성화 | 문제 해결 |
| `build` | 프로덕션 빌드 | 배포 |
| `clean` | 캐시 정리 | 문제 해결 |

## 🎯 권장 워크플로우

1. **개발 시작**: `npm run dev-clean`
2. **일반 개발**: `npm run dev`
3. **문제 발생**: `npm run clean` → `npm run dev-clean`
4. **배포 준비**: `npm run build` 

## 로컬 개발 환경에서 캐시 초기화 방법

### 1. 자동 초기화 도구 사용
로컬에서 개발할 때는 화면 우상단에 "개발자 도구"가 표시됩니다:
- **캐시 초기화**: 기본적인 캐시와 저장 데이터 삭제
- **🔄 강제 초기화**: 모든 캐시, IndexedDB, 쿠키 완전 삭제 후 페이지 새로고침
- **관리자 로그인**: 테스트용 관리자 계정으로 로그인

### 2. 브라우저 개발자 도구 사용
1. **F12** 또는 **Ctrl+Shift+I**로 개발자 도구 열기
2. **Application** 탭 선택
3. **Storage** 섹션에서:
   - **Local Storage**: `http://localhost:3000` 선택 후 Clear
   - **Session Storage**: `http://localhost:3000` 선택 후 Clear
   - **Cookies**: `http://localhost:3000` 선택 후 Clear
   - **IndexedDB**: 모든 데이터베이스 삭제
4. **Cache Storage**: 모든 캐시 삭제

### 3. 하드 리프레시
- **Windows**: `Ctrl + F5` 또는 `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### 4. 시크릿 모드 사용
- **Windows**: `Ctrl + Shift + N`
- **Mac**: `Cmd + Shift + N`
- 시크릿 모드에서는 모든 캐시와 저장 데이터가 초기 상태

### 5. 환경 변수 설정
`.env.local` 파일에 다음 설정:
```
REACT_APP_API_URL=http://localhost:8000
```

### 6. 로컬 실행 명령어
```bash
cd frontend
npm start
```

### 7. 문제 해결
- **무한 로그인 루프**: 강제 초기화 버튼 사용
- **API 연결 오류**: Railway 백엔드가 실행 중인지 확인
- **캐시 문제**: 하드 리프레시 또는 시크릿 모드 사용

## 로컬 vs Vercel 실행 차이점

### 로컬 실행 (개발 환경)
- **장점**: 
  - 실시간 코드 변경 반영
  - 개발자 도구 사용 가능
  - 디버깅 용이
  - 캐시 초기화 도구 제공
- **단점**: 
  - 로컬 환경 설정 필요
  - 캐시 문제 발생 가능

### Vercel 실행 (프로덕션 환경)
- **장점**: 
  - 실제 배포 환경과 동일
  - 캐시 최적화
  - CDN 활용
- **단점**: 
  - 코드 변경 시 재배포 필요
  - 디버깅 어려움

## 권장 개발 워크플로우
1. **로컬에서 개발 및 테스트**
2. **Git에 커밋 및 푸시**
3. **Vercel에서 자동 배포 확인**
4. **프로덕션 환경에서 최종 테스트** 