# QClick 마이크로서비스 실전 배포 계획

## 배포 아키텍처

### 프론트엔드
- **플랫폼**: Vercel (이미 배포됨)
- **URL**: https://qclick-app.vercel.app
- **비용**: 무료 플랜

### 백엔드 서비스들

#### 1. 메인 API 서버 (Railway 추천)
- **플랫폼**: Railway
- **이유**: 
  - 무료 플랜: $5 크레딧/월
  - PostgreSQL 데이터베이스 포함
  - 자동 HTTPS
  - GitHub 연동
- **예상 비용**: 월 $5-10
- **URL**: https://qclick-main-api.railway.app

#### 2. 큐네임 서비스 (Render 추천)
- **플랫폼**: Render
- **이유**:
  - 무료 플랜: 750시간/월
  - Python 지원 우수
  - 자동 배포
- **예상 비용**: 무료 (초기)
- **URL**: https://qclick-qname.onrender.com

#### 3. 큐문자 서비스 (Railway 추천)
- **플랫폼**: Railway
- **이유**: 메인 API와 동일한 플랫폼으로 관리 편의
- **예상 비용**: 월 $5-10
- **URL**: https://qclick-qtext.railway.app

## 배포 순서

1. **데이터베이스 설정** (Railway)
2. **메인 API 서버 배포** (Railway)
3. **큐네임 서비스 배포** (Render)
4. **큐문자 서비스 배포** (Railway)
5. **프론트엔드 환경변수 업데이트** (Vercel)
6. **API Gateway 설정** (선택사항)

## 예상 총 비용
- **초기 6개월**: 월 $15-25
- **사용자 200명 기준**: 충분히 수용 가능
- **확장 시**: 서비스별 독립적 스케일링 