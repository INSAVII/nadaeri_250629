# 🚀 실제 배포 테스트 가이드

## 📋 시스템 개요
- **백엔드**: FastAPI (Python) - `http://localhost:8000`
- **프론트엔드**: React (TypeScript) - `http://localhost:3000`
- **데이터베이스**: SQLite (qclick.db)
- **파일 저장**: `services/main-api/uploads/programs/`

## 🎯 완전한 배포 테스트 시나리오

### 1단계: 시스템 시작
```bash
# 백엔드 서버 시작
cd services/main-api
python main.py

# 프론트엔드 서버 시작 (새 터미널)
cd frontend
npm start
```

### 2단계: 관리자 로그인 및 프로그램 업로드

#### 2.1 관리자 로그인
- 브라우저에서 `http://localhost:3000` 접속
- 관리자 계정으로 로그인
- 관리자 권한 확인

#### 2.2 프로그램 관리 페이지에서 파일 업로드
- 관리자 메뉴 → "프로그램 관리" 클릭
- 큐캡쳐 섹션에서 각 프로그램 파일 업로드:
  - **무료 프로그램**: `qcapture_free_v1.0.exe`
  - **1개월 프로그램**: `qcapture_1month_v2.1.exe`
  - **3개월 프로그램**: `qcapture_3month_v3.0.exe`

#### 2.3 업로드 확인
- 각 프로그램의 파일명, 크기, 업로드 날짜 확인
- "업로드 완료" 메시지 확인

### 3단계: 사용자 권한 설정

#### 3.1 CMS 페이지에서 권한 관리
- 관리자 메뉴 → "CMS" 클릭
- "프로그램 관리" 탭 선택
- 사용자에게 프로그램 권한 부여:
  - 무료 프로그램 권한 체크
  - 1개월 프로그램 권한 체크
  - 3개월 프로그램 권한 체크
- "선택된 X명 권한 저장" 버튼 클릭

### 4단계: 실제 다운로드 테스트

#### 4.1 무료 프로그램 다운로드
- 큐캡쳐 페이지 (`/qcapture`) 접속
- "큐캡쳐 무료" 다운로드 버튼 클릭
- 예상 결과:
  - ✅ 권한 확인 성공
  - ✅ 예치금 차감 없음 (무료)
  - ✅ 실제 파일 다운로드 시작
  - ✅ 다운로드 횟수 1/3 표시

#### 4.2 유료 프로그램 다운로드
- "큐캡쳐 1개월" 다운로드 버튼 클릭
- 예상 결과:
  - ✅ 권한 확인 성공
  - ✅ 예치금 5,000원 차감
  - ✅ 실제 파일 다운로드 시작
  - ✅ 잔액 업데이트 표시

#### 4.3 다운로드 횟수 제한 테스트
- 같은 프로그램을 3번 다운로드
- 4번째 시도 시 "다운로드 횟수 제한" 에러 확인

### 5단계: 가격 설정 테스트

#### 5.1 관리자 가격 설정
- 큐캡쳐 페이지에서 가격 수정 버튼 클릭
- 1개월: 5,000원 → 6,000원 변경
- 3개월: 12,000원 → 15,000원 변경
- 저장 버튼 클릭

#### 5.2 가격 변경 확인
- 다른 사용자로 로그인하여 가격 변경 확인
- 새로운 가격으로 다운로드 시 차감 금액 확인

## 🔧 문제 해결

### 백엔드 서버 오류
```bash
# 포트 확인
netstat -ano | findstr :8000

# 프로세스 종료
taskkill /f /im python.exe

# 서버 재시작
cd services/main-api
python main.py
```

### 프론트엔드 서버 오류
```bash
# 포트 확인
netstat -ano | findstr :3000

# 프로세스 종료
taskkill /f /im node.exe

# 서버 재시작
cd frontend
npm start
```

### 데이터베이스 오류
```bash
# 데이터베이스 파일 확인
dir services\main-api\qclick.db

# 데이터베이스 재생성
cd services/main-api
python clean_and_init_db.py
```

### 파일 업로드 오류
- 파일 크기 확인 (100MB 이하)
- 파일 형식 확인 (.exe, .dmg, .zip, .msi, .pkg)
- 업로드 디렉토리 권한 확인

## 📊 성공 지표

### ✅ 완료되어야 할 항목들
- [ ] 백엔드 서버 정상 실행 (포트 8000)
- [ ] 프론트엔드 서버 정상 실행 (포트 3000)
- [ ] 관리자 로그인 성공
- [ ] 프로그램 파일 업로드 성공 (3개 파일)
- [ ] 사용자 권한 설정 성공
- [ ] 무료 프로그램 다운로드 성공
- [ ] 유료 프로그램 다운로드 성공 (예치금 차감)
- [ ] 다운로드 횟수 제한 작동
- [ ] 가격 설정 및 변경 성공
- [ ] 실제 파일 다운로드 완료

### 🎯 배포 준비 완료 조건
1. **모든 기능이 오류없이 작동**
2. **실제 파일 업로드 및 다운로드 성공**
3. **예치금 차감 및 권한 관리 정상**
4. **사용자 경험 최적화**

## 🚀 최종 배포 체크리스트

### 시스템 준비
- [ ] 모든 서버 정상 실행
- [ ] 데이터베이스 연결 확인
- [ ] 파일 업로드 디렉토리 생성
- [ ] 관리자 계정 설정

### 기능 테스트
- [ ] 프로그램 업로드 기능
- [ ] 사용자 권한 관리
- [ ] 예치금 차감 시스템
- [ ] 실제 파일 다운로드
- [ ] 다운로드 횟수 제한
- [ ] 가격 설정 기능

### 보안 및 안정성
- [ ] 파일 형식 검증
- [ ] 파일 크기 제한
- [ ] 사용자 권한 확인
- [ ] 예외 처리 완료

---

**🎉 모든 항목이 완료되면 실제 배포 준비가 완료됩니다!** 