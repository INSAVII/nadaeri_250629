# Railway 빌드 단계 설정 가이드

## 빌드 단계 구성

### 1. Python 환경 설정
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  }
}
```

**설정 내용:**
- ✅ **NIXPACKS**: Railway의 표준 Python 빌더
- ✅ **자동 감지**: Python 프로젝트 자동 인식
- ✅ **Python 3.12**: runtime.txt로 버전 명시

### 2. 패키지 설치 (pip install)
```json
// railway.json
{
  "build": {
    "buildCommand": "python3 -m ensurepip --upgrade && python3 -m pip install -r requirements.txt"
  }
}
```

**빌드 명령어:**
- ✅ `python3 -m ensurepip --upgrade`: pip 최신 버전으로 업그레이드
- ✅ `python3 -m pip install -r requirements.txt`: requirements.txt의 패키지 설치

### 3. 의존성 해결
```txt
// requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
```

**의존성 관리:**
- ✅ **버전 고정**: 안정적인 배포를 위해 버전 명시
- ✅ **최소 의존성**: 필수 패키지만 포함
- ✅ **Python 3.12 호환**: 모든 패키지가 Python 3.12와 호환

## 현재 설정 파일들

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "python3 -m ensurepip --upgrade && python3 -m pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### runtime.txt
```txt
python-3.12.7
```

### requirements.txt
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
```

## 빌드 프로세스

### 1단계: 환경 감지
- Railway가 Python 프로젝트임을 자동 감지
- runtime.txt에서 Python 3.12.7 사용

### 2단계: pip 업그레이드
- `python3 -m ensurepip --upgrade`
- 최신 pip 버전으로 업그레이드

### 3단계: 패키지 설치
- `python3 -m pip install -r requirements.txt`
- requirements.txt의 모든 패키지 설치

### 4단계: 의존성 검증
- 모든 패키지가 올바르게 설치되었는지 확인
- Python 3.12 호환성 검증

## 빌드 성공 확인

### 로컬 테스트
```bash
cd services/qtext-service

# Python 환경 확인
python --version  # Python 3.12.x

# 패키지 설치 테스트
pip install -r requirements.txt

# 애플리케이션 실행 테스트
python main.py
```

### Railway 배포 후 확인
```bash
# 헬스 체크
curl https://your-qtext-service.railway.app/health

# 응답 예시
{
  "status": "healthy",
  "service": "qtext-service",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 문제 해결

### 빌드 실패 시 확인사항
1. **Python 버전**: runtime.txt의 버전이 올바른지 확인
2. **패키지 호환성**: requirements.txt의 패키지들이 Python 3.12와 호환되는지 확인
3. **빌드 명령어**: railway.json의 buildCommand가 올바른지 확인
4. **파일 위치**: 모든 파일이 올바른 위치에 있는지 확인

### 일반적인 문제들
- **pip 없음**: `python3 -m ensurepip --upgrade`로 해결
- **패키지 충돌**: 버전을 명시적으로 고정
- **Python 버전**: runtime.txt로 명시적 지정

## 현재 설정 상태

- ✅ **Python 환경**: 3.12.7 명시적 설정
- ✅ **빌더**: NIXPACKS 사용
- ✅ **패키지 설치**: pip 업그레이드 + requirements.txt 설치
- ✅ **의존성**: 최소한의 안정적인 패키지들
- ✅ **빌드 명령어**: 명확한 빌드 프로세스 정의
