# SMS 자동 발송 설정 가이드

## 개요
무통장 입금 신청 시 자동으로 SMS를 발송하는 기능을 설정하는 방법입니다.

## 1. SMS 서비스 선택

### 네이버 클라우드 SENS (권장)
- **장점**: 안정적, 한국에서 가장 많이 사용
- **비용**: SMS 1건당 약 20원
- **가입**: https://www.ncloud.com/product/applicationService/sens

### 카카오톡 비즈니스 (알림톡)
- **장점**: 무료, 템플릿 사용 가능
- **단점**: 카카오톡 앱 필요
- **가입**: https://business.kakao.com/

### AWS SNS
- **장점**: 글로벌 서비스
- **단점**: 설정 복잡
- **가입**: https://aws.amazon.com/sns/

## 2. 네이버 클라우드 SENS 설정

### 2.1 계정 생성
1. https://www.ncloud.com/ 접속
2. 회원가입 및 로그인
3. SENS 서비스 신청

### 2.2 프로젝트 생성
1. 콘솔에서 새 프로젝트 생성
2. SENS 서비스 활성화
3. 발신번호 등록 (필수)

### 2.3 API 키 생성
1. IAM & Access Management → Access Key
2. 새 Access Key 생성
3. Service ID, Access Key, Secret Key 복사

## 3. 환경 변수 설정

`services/main-api/` 폴더에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
# SMS 서비스 설정
SMS_ENABLED=true

# 네이버 클라우드 SENS 설정
NAVER_SENS_SERVICE_ID=your_service_id_here
NAVER_SENS_ACCESS_KEY=your_access_key_here
NAVER_SENS_SECRET_KEY=your_secret_key_here
NAVER_SENS_FROM_NUMBER=your_sender_number_here

# 관리자 전화번호
ADMIN_PHONE=010-5904-2213
```

## 4. 발송되는 SMS 내용

### 관리자에게 발송
```
[나대리que] 무통장 입금 신청
사용자: 최호진(insavi)
입금자: 최호진
금액: 10,000원
연락처: 010-1234-5678
메모: 없음
신청시간: 2025-07-06 14:43
```

### 입금자에게 발송
```
[나대리que] 입금 신청 완료
최호진님의 입금 신청이 접수되었습니다.

입금자명: 최호진
신청금액: 10,000원
입금계좌: [계좌번호]
입금기한: 24시간 이내

입금 후 관리자 확인 시 예치금이 충전됩니다.
문의: 010-5904-2213
```

## 5. 테스트 방법

### 5.1 SMS 비활성화 상태에서 테스트
```env
SMS_ENABLED=false
```
- SMS는 발송되지 않지만 로그에 발송 내용이 기록됩니다.

### 5.2 SMS 활성화 상태에서 테스트
```env
SMS_ENABLED=true
```
- 실제 SMS가 발송됩니다.

## 6. 비용 예상

### 네이버 클라우드 SENS
- SMS 1건: 약 20원
- 월 100건 발송 시: 약 2,000원
- 월 1,000건 발송 시: 약 20,000원

### 카카오톡 알림톡
- 무료 (카카오톡 앱 필요)

## 7. 주의사항

1. **발신번호 등록 필수**: 네이버 클라우드에서 발신번호를 미리 등록해야 합니다.
2. **SMS 내용 길이**: 한글 기준 90자 이내 권장
3. **발송 시간**: 24시간 발송 가능
4. **수신 거부**: 수신자가 수신 거부할 수 있습니다.

## 8. 문제 해결

### SMS 발송 실패 시
1. 환경 변수 확인
2. 네이버 클라우드 콘솔에서 발신번호 등록 확인
3. API 키 권한 확인
4. 로그 확인: `services/main-api/logs/`

### 테스트 모드
개발 중에는 `SMS_ENABLED=false`로 설정하여 실제 SMS 발송 없이 테스트할 수 있습니다. 