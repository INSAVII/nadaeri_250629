# 🚀 npm install 속도 개선 가이드

## 현재 문제점
- npm install이 매우 오래 걸림 (5-10분 이상)
- Windows 환경에서의 성능 저하
- 네트워크 지연 문제

## 해결 방법

### 1. 빠른 설치 스크립트 사용
```bash
# 기존 방법 (느림)
npm install

# 새로운 빠른 방법
npm run install-fast

# 완전히 깨끗한 설치
npm run install-clean
```

### 2. 캐시 최적화
```bash
# npm 캐시 정리
npm cache clean --force

# 캐시 확인
npm cache verify
```

### 3. 글로벌 설정 최적화
```bash
# 한국 미러 서버 설정 (선택사항)
npm config set registry https://registry.npmjs.org/

# 캐시 설정
npm config set prefer-offline true

# 병렬 설치 활성화
npm config set maxsockets 50
```

### 4. 대안 패키지 매니저 사용

#### Yarn 사용 (더 빠름)
```bash
# Yarn 설치
npm install -g yarn

# Yarn으로 설치
yarn install
```

#### pnpm 사용 (가장 빠름)
```bash
# pnpm 설치
npm install -g pnpm

# pnpm으로 설치
pnpm install
```

## 성능 비교

| 방법 | 예상 시간 | 장점 | 단점 |
|------|-----------|------|------|
| npm install | 5-10분 | 표준 | 느림 |
| npm run install-fast | 2-3분 | 빠름 | 일부 기능 제한 |
| yarn install | 1-2분 | 매우 빠름 | 추가 도구 필요 |
| pnpm install | 30초-1분 | 가장 빠름 | 추가 도구 필요 |

## 권장사항

1. **개발 환경**: `npm run install-fast` 사용
2. **프로덕션 배포**: `npm run install-clean` 사용
3. **장기적 해결**: Yarn 또는 pnpm 도입 고려

## 문제 해결

### 캐시 문제
```bash
# npm 캐시 완전 삭제
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 네트워크 문제
```bash
# DNS 캐시 정리
ipconfig /flushdns

# 프록시 설정 확인
npm config get proxy
npm config get https-proxy
```

### Windows 특정 문제
```bash
# PowerShell 실행 정책 확인
Get-ExecutionPolicy

# 필요시 변경
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
``` 