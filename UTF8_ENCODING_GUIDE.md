# UTF-8 인코딩 배포 가이드

## 개요
QClick 프로젝트를 Railway와 Vercel에 배포할 때 발생하는 UTF-8 인코딩 문제를 해결하기 위한 가이드입니다.

## 🔧 적용된 변경사항

### 1. Python 파일 인코딩 헤더 추가
모든 Python 파일 첫 줄에 UTF-8 인코딩 헤더가 추가되었습니다:
```python
# -*- coding: utf-8 -*-
```

**적용된 파일:**
- `services/main-api/main.py`
- `services/qname-service/main.py`
- `services/qtext-service/main.py`

### 2. 배치 파일 UTF-8 설정
모든 배치 파일에 UTF-8 코드페이지 설정이 추가되었습니다:
```batch
@echo off
chcp 65001 >nul
```

**적용된 파일:**
- `큐문자_캐시완전삭제.bat`
- `deployment/deploy_railway.bat`
- `apply_utf8_encoding.bat` (신규)

### 3. JSON 설정 파일 UTF-8 재저장
모든 JSON 설정 파일이 UTF-8 인코딩으로 재저장되었습니다:
- `vercel.json`
- `railway.json`
- `frontend/package.json`

### 4. 의존성 파일 UTF-8 재저장
모든 requirements.txt 파일이 UTF-8 인코딩으로 재저장되었습니다:
- `services/main-api/requirements.txt`
- `services/qname-service/requirements.txt`
- `services/qtext-service/requirements.txt`

### 5. Dockerfile UTF-8 재저장
Docker 설정 파일이 UTF-8 인코딩으로 재저장되었습니다:
- `frontend/Dockerfile`

## 🚀 배포 전 확인사항

### Railway 배포 시
1. 모든 환경변수가 UTF-8로 설정되었는지 확인
2. 데이터베이스 연결 문자열에 charset=utf8 추가 고려
3. CORS_ORIGINS 설정에 한글 도메인이 올바르게 설정되었는지 확인

### Vercel 배포 시
1. build 명령어가 UTF-8 환경에서 실행되는지 확인
2. 환경변수에 한글이 포함된 경우 인코딩 확인
3. 정적 파일들의 인코딩 확인

## 🔍 인코딩 문제 진단 방법

### 1. 로그에서 인코딩 오류 확인
```
UnicodeDecodeError: 'ascii' codec can't decode byte
UnicodeEncodeError: 'ascii' codec can't encode character
```

### 2. 파일 인코딩 확인 (Windows)
```cmd
file -i filename.txt
```

### 3. Python에서 인코딩 확인
```python
import locale
print(locale.getpreferredencoding())
```

## 🛠️ 문제 해결 방법

### 1. Python 파일 읽기/쓰기 시 명시적 인코딩
```python
# 올바른 방법
with open('file.txt', 'r', encoding='utf-8') as f:
    content = f.read()

with open('file.txt', 'w', encoding='utf-8') as f:
    f.write(content)
```

### 2. 환경변수 설정
```bash
# Linux/Mac
export PYTHONIOENCODING=utf-8
export LANG=en_US.UTF-8

# Windows
set PYTHONIOENCODING=utf-8
```

### 3. Railway 환경변수
Railway 대시보드에서 다음 환경변수 추가:
```
PYTHONIOENCODING=utf-8
LANG=en_US.UTF-8
```

## 📁 백업 파일
원본 파일들은 `backup_original/` 폴더에 백업되어 있습니다.

## 🚀 사용 방법

### 자동 적용
```cmd
apply_utf8_encoding.bat
```

### 수동 확인
1. 모든 Python 파일 첫 줄에 `# -*- coding: utf-8 -*-` 있는지 확인
2. 모든 배치 파일에 `chcp 65001` 있는지 확인
3. JSON 파일들이 UTF-8로 저장되었는지 확인

## ⚠️ 주의사항
1. 기존 파일을 덮어쓰기 전 백업 확인
2. 한글 파일명은 가능한 영문으로 변경 권장
3. 데이터베이스 스키마에서 charset 설정 확인
4. API 응답에서 한글 데이터 인코딩 확인

## 📞 문제 발생 시
1. 백업 파일에서 원본 복구
2. 로그에서 구체적인 인코딩 오류 확인
3. 해당 파일의 인코딩 개별 수정
4. 배포 환경의 locale 설정 확인
