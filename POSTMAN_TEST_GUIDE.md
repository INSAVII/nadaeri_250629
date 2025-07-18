# Postman을 이용한 QClick API 테스트 가이드

## 1. 서버 실행
```bash
cd backend
python main.py
```
서버가 `http://localhost:8001`에서 실행됩니다.

## 2. Postman 설정

### 2.1 컬렉션 임포트
1. Postman에서 `Import` 버튼 클릭
2. `postman_test_collection.json` 파일 선택
3. 컬렉션이 임포트됩니다

### 2.2 환경 변수 설정
컬렉션의 Variables 탭에서:
- `base_url`: `http://localhost:8001`
- `access_token`: (로그인 후 자동 설정)
- `admin_token`: (관리자 로그인 후 설정)

## 3. 테스트 순서

### 3.1 서버 상태 확인
1. `서버 상태 확인` 요청 실행
2. 응답: `{"status": "ok", "message": "서버가 정상 작동 중입니다."}`

### 3.2 회원가입 테스트
1. `회원가입` 요청 실행
2. 요청 본문 수정:
```json
{
  "email": "test@example.com",
  "password": "test1234",
  "name": "테스트 사용자",
  "userId": "testuser"
}
```
3. 성공 응답 예시:
```json
{
  "id": "uuid-string",
  "user_id": "testuser",
  "email": "test@example.com",
  "name": "테스트 사용자",
  "balance": 10000.0,
  "is_active": true,
  "is_admin": false,
  "created_at": "2024-01-01T00:00:00"
}
```

### 3.3 로그인 테스트
1. `로그인` 요청 실행
2. 성공 시 `access_token` 받음
3. 이 토큰을 `access_token` 변수에 저장

### 3.4 내 정보 조회
1. `내 정보 조회` 요청 실행
2. Authorization 헤더에 토큰 자동 포함됨

### 3.5 내 정보 수정
1. `내 정보 수정` 요청 실행
2. 요청 본문 수정:
```json
{
  "name": "수정된 이름"
}
```

### 3.6 전체 회원 목록 (관리자용)
1. 관리자 계정으로 로그인
2. 받은 토큰을 `admin_token` 변수에 저장
3. `전체 회원 목록` 요청 실행

## 4. 디버그 기능

### 4.1 사용자 목록 확인
- `디버그 - 사용자 목록` 요청으로 DB에 저장된 사용자 확인

## 5. 예상 오류 및 해결방법

### 5.1 CORS 오류
- 서버의 CORS 설정 확인
- `main.py`에서 `cors_origins` 설정 확인

### 5.2 데이터베이스 오류
- SQLite 파일 권한 확인
- `database.py` 설정 확인

### 5.3 인증 오류
- 토큰 형식 확인: `Bearer {token}`
- 토큰 만료 시간 확인

## 6. 테스트 시나리오

### 시나리오 1: 일반 회원가입
1. 새로운 이메일로 회원가입
2. 로그인
3. 내 정보 조회
4. 정보 수정

### 시나리오 2: 중복 회원가입
1. 이미 존재하는 이메일로 회원가입 시도
2. 오류 메시지 확인

### 시나리오 3: 관리자 기능
1. 관리자 계정으로 로그인
2. 전체 회원 목록 조회
3. 특정 회원 정보 수정

## 7. 성공 기준

✅ **회원가입**: 201 상태코드, 사용자 정보 반환
✅ **로그인**: 200 상태코드, access_token 반환  
✅ **정보 조회**: 200 상태코드, 현재 사용자 정보 반환
✅ **정보 수정**: 200 상태코드, 수정된 정보 반환
✅ **관리자 목록**: 200 상태코드, 사용자 목록 반환

## 8. 다음 단계

API 테스트가 성공하면:
1. 프론트엔드와 연동
2. 데이터베이스 최적화
3. 보안 강화
4. 배포 준비 