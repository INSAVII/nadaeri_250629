# QText 서비스 데이터 저장 기반 설정 가이드

## 📋 개요

QText 서비스를 데이터 저장 기반으로 전환하여 다음과 같은 기능을 제공합니다:

- ✅ **작업 추적**: 모든 QText 작업을 데이터베이스에 저장
- ✅ **사용량 관리**: 사용자별 처리 통계 및 금액 관리
- ✅ **오류 처리**: 실패한 작업에 대한 환불 처리
- ✅ **작업 히스토리**: 사용자의 모든 작업 내역 조회
- ✅ **통계 제공**: 성공률, 총 처리 파일 수, 총 사용 금액 등

## 🏗️ 아키텍처 변경사항

### 기존 구조
```
프론트엔드 → QText 서비스 (독립적)
```

### 새로운 구조
```
프론트엔드 → 메인 API (작업 생성/관리) → QText 서비스 (이미지 처리)
```

## 🔧 설정 단계

### 1단계: 데이터베이스 테이블 생성

```bash
cd services/main-api
python create_qtext_tables.py
```

### 2단계: 환경 변수 설정

#### 메인 API 서버 (.env)
```env
# 기존 설정에 추가
DATABASE_URL=sqlite:///./qclick.db
CORS_ORIGINS=http://localhost:3003,http://localhost:3001,https://qclick-app.vercel.app
```

#### QText 서비스 (.env)
```env
# 기존 설정에 추가
MAIN_API_URL=http://localhost:8001
MAIN_API_TOKEN=your_main_api_token_here
CORS_ORIGINS=http://localhost:3003,http://localhost:3001,https://qclick-app.vercel.app
```

### 3단계: 서비스 재시작

```bash
# 메인 API 서버 재시작
cd services/main-api
python main.py

# QText 서비스 재시작
cd services/qtext-service
python main.py
```

## 📊 새로운 API 엔드포인트

### 메인 API (포트 8001)

#### 작업 관리
- `POST /api/qtext/jobs` - 새로운 QText 작업 생성
- `GET /api/qtext/jobs` - 사용자의 QText 작업 목록 조회
- `GET /api/qtext/jobs/{job_id}` - 특정 작업 조회
- `POST /api/qtext/jobs/{job_id}/complete` - 작업 완료 처리
- `POST /api/qtext/jobs/{job_id}/fail` - 작업 실패 처리
- `POST /api/qtext/jobs/{job_id}/cancel` - 작업 취소 처리

#### 통계
- `GET /api/qtext/stats` - 사용자의 QText 사용 통계

### QText 서비스 (포트 8003)

#### 이미지 처리
- `POST /api/qtext/process-images` - 이미지 문자 제거 처리 (수정됨)

## 🔄 처리 흐름

### 1. 작업 생성 (프론트엔드 → 메인 API)
```javascript
const jobData = {
  file_count: 5,
  unit_price: 100
};
const job = await apiPost('/api/qtext/jobs', jobData, user.token);
```

### 2. 이미지 처리 (프론트엔드 → QText 서비스)
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('user_id', user.id);
formData.append('user_token', user.token);
formData.append('job_id', job.id);

const result = await qtextApiRequest('/api/qtext/process-images', {
  method: 'POST',
  body: formData
});
```

### 3. 작업 완료 처리 (QText 서비스 → 메인 API)
```python
# QText 서비스에서 자동으로 호출
call_main_api(
    f"/api/qtext/jobs/{job_id}/complete",
    method="POST",
    data={
        "result_file_path": result_file_path,
        "processed_files": json.dumps(processed_filenames)
    },
    headers={"Authorization": f"Bearer {user_token}"}
)
```

## 💾 데이터베이스 스키마

### qtext_jobs 테이블
```sql
CREATE TABLE qtext_jobs (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    file_count INTEGER NOT NULL DEFAULT 0,
    unit_price FLOAT NOT NULL DEFAULT 30.0,
    total_amount FLOAT NOT NULL DEFAULT 0.0,
    status VARCHAR NOT NULL DEFAULT 'processing',
    original_files TEXT,
    processed_files TEXT,
    result_file_path VARCHAR,
    error_message TEXT,
    processing_started_at DATETIME,
    processing_completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

## 🔍 모니터링 및 디버깅

### 로그 확인
```bash
# 메인 API 로그
tail -f services/main-api/logs/app.log

# QText 서비스 로그
tail -f services/qtext-service/logs/app.log
```

### 데이터베이스 확인
```bash
cd services/main-api
python -c "
from database import get_db
from models.qtext_job import QTextJob
db = next(get_db())
jobs = db.query(QTextJob).all()
print(f'총 QText 작업 수: {len(jobs)}')
for job in jobs[:5]:
    print(f'- {job.id}: {job.status} ({job.file_count}개 파일)')
"
```

## 🚨 오류 처리

### 일반적인 오류 및 해결방법

#### 1. "메인 API 연동 실패" 오류
- **원인**: QText 서비스가 메인 API에 연결할 수 없음
- **해결**: MAIN_API_URL 환경변수 확인, 메인 API 서버 실행 상태 확인

#### 2. "작업 생성 실패" 오류
- **원인**: 데이터베이스 연결 문제 또는 권한 문제
- **해결**: 데이터베이스 테이블 생성 확인, 사용자 토큰 유효성 확인

#### 3. "잔액 부족" 오류
- **원인**: 사용자 예치금이 부족함
- **해결**: 예치금 충전 후 재시도

## 📈 성능 최적화

### 1. 데이터베이스 인덱스
```sql
CREATE INDEX idx_qtext_jobs_user_id ON qtext_jobs (user_id);
CREATE INDEX idx_qtext_jobs_status ON qtext_jobs (status);
CREATE INDEX idx_qtext_jobs_created_at ON qtext_jobs (created_at);
```

### 2. 배치 처리
- 최대 100개 파일까지 한 번에 처리 가능
- 파일 크기 제한: 개당 10MB

### 3. 캐싱
- 처리된 결과 파일을 서버에 임시 저장
- ZIP 파일로 압축하여 다운로드 제공

## 🔒 보안 고려사항

### 1. 인증
- 모든 API 호출에 JWT 토큰 필요
- 토큰 만료 시 자동 로그아웃

### 2. 권한
- 사용자는 자신의 작업만 조회/수정 가능
- 관리자는 모든 작업 조회 가능

### 3. 파일 보안
- 업로드된 파일의 크기 및 형식 검증
- 임시 파일은 처리 완료 후 자동 삭제

## 🎯 다음 단계

### 1. 관리자 대시보드
- QText 작업 통계 대시보드 추가
- 실시간 처리 현황 모니터링

### 2. 알림 시스템
- 작업 완료/실패 시 이메일 알림
- 푸시 알림 기능

### 3. 고급 기능
- 작업 예약 기능
- 배치 처리 최적화
- 결과 파일 클라우드 저장

---

**설정 완료 후 테스트 방법:**
1. 프론트엔드에서 QText 페이지 접속
2. 이미지 파일 업로드
3. 처리 진행 상황 확인
4. 결과 파일 다운로드
5. 작업 히스토리 확인 