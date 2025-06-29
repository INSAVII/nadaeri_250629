# QName 서비스 완전 개선 가이드

## 🎯 개선 목표

현재 QName 서비스는 기본적으로 작동하지만, 다음 사항들을 개선하여 완전한 웹 서비스로 만들 수 있습니다:

1. **API 키 설정** - AI 기반 상품명 생성 활성화
2. **사용자 경험 개선** - 처리 진행률 표시 및 오류 처리
3. **성능 최적화** - API 호출 실패 시 fallback 로직
4. **코드 품질 향상** - TypeScript 오류 수정
5. **배포 및 운영** - 쉬운 서비스 시작 및 관리

---

## 🚀 1단계: API 키 설정 (최우선)

### 1-1. Google Gemini API 키 발급
```bash
# 1. https://makersuite.google.com/app/apikey 접속
# 2. Google 계정으로 로그인
# 3. "Create API Key" 클릭
# 4. API 키 이름 입력 (예: "QName Service")
# 5. 생성된 API 키 복사
```

### 1-2. 네이버 쇼핑 API 키 발급 (선택사항)
```bash
# 1. https://developers.naver.com/apps/#/list 접속
# 2. 네이버 계정으로 로그인
# 3. "애플리케이션 등록" 클릭
# 4. 애플리케이션 정보 입력:
#    - 이름: "QName Service"
#    - 사용 API: "검색" 선택
#    - 서비스 URL: http://localhost:8004
# 5. Client ID와 Client Secret 복사
```

### 1-3. 환경 변수 설정
```bash
# services/qname-service 디렉토리에서
cp env_example.txt .env

# .env 파일 편집
GEMINI_API_KEY=your_actual_gemini_api_key_here
NAVER_CLIENT_ID=your_actual_naver_client_id_here
NAVER_CLIENT_SECRET=your_actual_naver_client_secret_here
```

---

## 🎨 2단계: 사용자 경험 개선

### 2-1. 처리 진행률 표시
- ✅ 파일 업로드 중 진행률 표시
- ✅ 백엔드 처리 중 상태 표시
- ✅ 결과 파일 준비 중 표시
- ✅ 완료 시 성공 메시지 표시

### 2-2. 오류 처리 개선
- ✅ API 호출 실패 시 명확한 오류 메시지
- ✅ 네트워크 오류 시 재시도 안내
- ✅ 파일 형식 오류 시 가이드 제공

### 2-3. UI/UX 개선
- ✅ 처리 중 버튼 비활성화
- ✅ 진행률 바 애니메이션
- ✅ 완료 후 다운로드 버튼 강조

---

## ⚡ 3단계: 성능 최적화

### 3-1. API 호출 최적화
```python
# API 호출 간격 조절 (0.5초)
time.sleep(0.5)

# API 키 없을 때 기본 모드로 빠른 처리
if not self.model:
    # 기본 템플릿 상품명 생성
    return f"실용적인 {keyword} 고급스러운 주방용품"
```

### 3-2. Fallback 로직 개선
```python
# API 호출 실패 시 기본 모드로 자동 전환
try:
    response = self.model.generate_content(prompt)
    return response.text.strip()
except Exception as e:
    logger.error(f"API 호출 실패: {str(e)}")
    return self._generate_basic_product_name(keyword)
```

### 3-3. 메모리 최적화
```python
# 임시 파일 자동 정리
finally:
    if temp_file_path and os.path.exists(temp_file_path):
        os.remove(temp_file_path)
```

---

## 🔧 4단계: 코드 품질 향상

### 4-1. TypeScript 오류 수정
```typescript
// canProcess가 null일 수 있는 문제 해결
canProcess: canProcess || false
```

### 4-2. 불필요한 의존성 제거
```typescript
// mockUsers import 실패 시 무시
try {
    const { updateUserBalance } = await import('../utils/mockUsers');
    updateUserBalance(user.id, newBalance, `큐네임 서비스 사용: ${rowCount}건 처리`);
} catch (e) {
    console.warn('mockUsers 업데이트 실패:', e);
    // 기능에 영향 없음
}
```

### 4-3. 로깅 개선
```python
# 상세한 로깅으로 디버깅 용이성 향상
logger.info(f"=== 파일 처리 요청 시작 ===")
logger.info(f"파일명: {file.filename}")
logger.info(f"파일 크기: {file.size} bytes")
logger.info(f"요청 시간: {datetime.now().isoformat()}")
```

---

## 🚀 5단계: 배포 및 운영

### 5-1. 서비스 시작 스크립트
```bash
# start_qname_service.bat 실행
# - Python 환경 확인
# - 필요한 패키지 설치
# - 환경 변수 파일 확인
# - 서비스 자동 시작
```

### 5-2. 서비스 상태 확인
```bash
# 헬스 체크
curl http://localhost:8004/health

# API 키 상태 확인
curl http://localhost:8004/api/qname/health
```

### 5-3. 로그 모니터링
```bash
# 실시간 로그 확인
tail -f services/qname-service/logs/qname_service.log
```

---

## 📊 개선 효과

### Before (현재)
- ✅ 기본 파일 처리 작동
- ⚠️ API 키 없음으로 기본 모드
- ⚠️ 사용자 피드백 부족
- ⚠️ 오류 처리 미흡

### After (개선 후)
- ✅ AI 기반 상품명 생성
- ✅ 실시간 처리 진행률 표시
- ✅ 명확한 오류 메시지
- ✅ 자동 fallback 로직
- ✅ 쉬운 서비스 관리

---

## 🎯 우선순위별 실행 계획

### 즉시 실행 (1시간 내)
1. API 키 발급 및 설정
2. 서버 재시작
3. 기본 기능 테스트

### 단기 개선 (1일 내)
1. 프론트엔드 UI 개선 적용
2. TypeScript 오류 수정
3. 사용자 테스트

### 중기 개선 (1주 내)
1. 성능 최적화 적용
2. 로깅 시스템 구축
3. 모니터링 도구 설정

### 장기 개선 (1개월 내)
1. 사용자 피드백 반영
2. 추가 기능 개발
3. 확장성 고려

---

## 🔍 문제 해결 체크리스트

### API 호출 문제
- [ ] API 키가 올바르게 설정되었는가?
- [ ] .env 파일이 올바른 위치에 있는가?
- [ ] 서버를 재시작했는가?
- [ ] API 키의 사용량 한도를 확인했는가?

### 네트워크 문제
- [ ] 방화벽 설정을 확인했는가?
- [ ] 프록시 설정을 확인했는가?
- [ ] 인터넷 연결 상태를 확인했는가?

### 파일 처리 문제
- [ ] 엑셀 파일 형식이 올바른가?
- [ ] 파일 크기가 적절한가?
- [ ] 필요한 컬럼이 모두 있는가?

---

## 📞 지원 및 문의

문제가 발생하면 다음 순서로 확인하세요:

1. **로그 확인**: 브라우저 개발자 도구 콘솔
2. **서버 로그**: 백엔드 터미널 출력
3. **API 상태**: `http://localhost:8004/health`
4. **문서 참조**: `API_SETUP_GUIDE.md`

---

## 🎉 완료 후 확인사항

모든 개선이 완료되면 다음을 확인하세요:

- [ ] API 키 설정 완료
- [ ] 파일 업로드 및 처리 정상 작동
- [ ] 처리 진행률 표시 정상 작동
- [ ] 오류 메시지 명확하게 표시
- [ ] 완성 파일 다운로드 정상 작동
- [ ] 서비스 시작 스크립트 정상 작동

**축하합니다! 이제 완전한 QName 웹 서비스를 운영할 수 있습니다! 🚀** 