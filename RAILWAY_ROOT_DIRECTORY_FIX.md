# Railway Root Directory 설정 문제 해결 가이드

## 문제 상황
- Railway에서 Root Directory를 `services/main-api`로 설정했지만 무시되고 전체 루트에서 빌드 시도
- 한글 파일명으로 인한 UTF-8 인코딩 오류 발생

## 해결 방법 (우선순위대로)

### 방법 1: Railway 설정 완전 재설정
1. Railway 대시보드 접속
2. Settings > Source 탭
3. **Root Directory 입력란을 완전히 비운 후 저장**
4. 새로고침 (F5)
5. 다시 `services/main-api` 입력 후 **Save**
6. **Deploy** 탭으로 이동하여 **Redeploy** 클릭

### 방법 2: 환경 변수로 강제 설정
Settings > Variables에서 추가:
```
RAILWAY_BUILD_COMMAND=cd services/main-api && pip install -r requirements.txt
RAILWAY_START_COMMAND=cd services/main-api && python main.py
```

### 방법 3: 프로젝트 삭제 후 재생성
1. 현재 프로젝트 삭제
2. GitHub 연결하여 새 프로젝트 생성
3. 처음부터 Root Directory를 `services/main-api`로 설정

### 방법 4: 한글 파일 임시 제거
프로젝트 루트의 한글 파일들을 임시 폴더로 이동하여 빌드 성공 후 복원

## 현재 상태
- Root Directory: `services/main-api` (정확함)
- .railwayignore 파일 생성됨
- UTF-8 인코딩 적용 완료
- GitHub 푸시 완료

## 다음 단계
방법 1부터 차례로 시도하여 빌드 성공 확인
