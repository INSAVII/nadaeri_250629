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