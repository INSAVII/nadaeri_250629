# QClick 마이크로서비스 배포 체크리스트

## 사전 준비사항

### 계정 및 도구
- [ ] Railway 계정 생성 및 CLI 설치
- [ ] Render 계정 생성
- [ ] GitHub 저장소 준비
- [ ] Vercel 프로젝트 설정 완료

### 코드 준비
- [ ] 모든 서비스의 requirements.txt 확인
- [ ] 환경변수 설정 파일 준비
- [ ] 데이터베이스 마이그레이션 스크립트 준비
- [ ] 헬스 체크 엔드포인트 구현 확인

## 1단계: 메인 API 서버 배포 (Railway)

### Railway 설정
- [ ] Railway CLI 로그인
- [ ] 프로젝트 생성
- [ ] PostgreSQL 데이터베이스 추가
- [ ] 환경변수 설정:
  - [ ] DATABASE_URL
  - [ ] SECRET_KEY
  - [ ] CORS_ORIGINS

### 배포 실행
- [ ] `cd services/main-api`
- [ ] `railway init`
- [ ] `railway up`
- [ ] 배포 URL 확인: `https://qclick-main-api.railway.app`

### 검증
- [ ] 헬스 체크: `GET /health`
- [ ] 데이터베이스 연결 테스트
- [ ] CORS 설정 확인

## 2단계: 큐네임 서비스 배포 (Render)

### Render 설정
- [ ] Render 대시보드 접속
- [ ] "New Web Service" 생성
- [ ] GitHub 저장소 연결
- [ ] 서비스 설정:
  - [ ] Name: qclick-qname-service
  - [ ] Environment: Python
  - [ ] Build Command: `pip install -r requirements.txt`
  - [ ] Start Command: `python main.py`
  - [ ] Health Check Path: `/health`

### 환경변수 설정
- [ ] CORS_ORIGINS: `https://qclick-app.vercel.app,http://localhost:3003`
- [ ] 기타 필요한 환경변수

### 검증
- [ ] 배포 URL 확인: `https://qclick-qname.onrender.com`
- [ ] 헬스 체크: `GET /health`
- [ ] API 엔드포인트 테스트

## 3단계: 큐문자 서비스 배포 (Railway)

### Railway 설정
- [ ] 새 Railway 프로젝트 생성
- [ ] 환경변수 설정
- [ ] 배포 실행

### 검증
- [ ] 배포 URL 확인: `https://qclick-qtext.railway.app`
- [ ] 헬스 체크: `GET /health`
- [ ] API 엔드포인트 테스트

## 4단계: 프론트엔드 업데이트 (Vercel)

### 환경변수 설정
- [ ] Vercel 대시보드 접속
- [ ] 프로젝트 설정 → Environment Variables
- [ ] 다음 변수 추가:
  ```
  NEXT_PUBLIC_MAIN_API=https://qclick-main-api.railway.app
  NEXT_PUBLIC_QNAME_SERVICE=https://qclick-qname.onrender.com
  NEXT_PUBLIC_QTEXT_SERVICE=https://qclick-qtext.railway.app
  ```

### 재배포
- [ ] 환경변수 저장 후 자동 재배포 확인
- [ ] 배포 완료 대기

## 5단계: 통합 테스트

### 전체 시스템 테스트
- [ ] 프론트엔드 접속: `https://qclick-app.vercel.app`
- [ ] 로그인 기능 테스트
- [ ] 큐네임 서비스 테스트
- [ ] 큐문자 서비스 테스트
- [ ] 결제 기능 테스트 (있다면)

### 성능 테스트
- [ ] 응답 시간 측정
- [ ] 동시 사용자 테스트
- [ ] 에러 처리 확인

## 6단계: 모니터링 설정

### 모니터링 도구 설정
- [ ] 서비스 모니터링 스크립트 실행
- [ ] 알림 설정 (이메일, Slack 등)
- [ ] 로그 수집 설정

### 백업 및 복구
- [ ] 데이터베이스 백업 설정
- [ ] 복구 절차 문서화
- [ ] 장애 대응 계획 수립

## 7단계: 문서화

### 배포 문서
- [ ] 배포 절차 문서화
- [ ] 환경변수 목록 정리
- [ ] 문제 해결 가이드 작성

### 운영 문서
- [ ] 모니터링 가이드
- [ ] 백업/복구 절차
- [ ] 확장 계획

## 완료 확인

### 최종 체크
- [ ] 모든 서비스 정상 작동
- [ ] 프론트엔드에서 모든 기능 사용 가능
- [ ] 모니터링 시스템 정상 작동
- [ ] 문서화 완료

### 비용 확인
- [ ] Railway 비용: 월 $10-20
- [ ] Render 비용: 무료 (초기)
- [ ] Vercel 비용: 무료
- [ ] 총 예상 비용: 월 $15-25

## 문제 해결

### 일반적인 문제들
- [ ] CORS 오류: 환경변수 CORS_ORIGINS 확인
- [ ] 데이터베이스 연결 실패: DATABASE_URL 확인
- [ ] 서비스 시작 실패: 로그 확인 및 환경변수 점검
- [ ] 느린 응답: 서비스별 성능 최적화

### 연락처
- Railway 지원: https://railway.app/support
- Render 지원: https://render.com/docs/help
- Vercel 지원: https://vercel.com/support 