# QClick 프로젝트 복원 및 디자인 시스템 가이드

## 🎯 프로젝트 목표
- Next.js → Parcel + React Router 마이그레이션
- 일관된 디자인 시스템 적용
- 모든 기능 완전 복원
- 하이브리드 배포 준비

## 📐 디자인 시스템 규칙

### 레이아웃 기본 원칙
- **페이지 최대 폭**: `max-w-[1080px] mx-auto px-4`
- **기본 폰트**: `font-light` (모든 텍스트)
- **여백**: `py-6` (페이지 상하), `space-y-6` (섹션 간격)
- **배경**: `bg-white` (기본 흰색)

### 타이포그래피
```css
- 페이지 제목: text-2xl font-light mb-6
- 섹션 제목: text-lg font-light mb-4
- 본문: text-sm font-light
- 캡션/설명: text-xs text-gray-600 font-light
- 사용자명/금액: text-xs font-light
```

### 버튼 시스템
- **문자형 버튼**: `<TextButton variant="text" size="sm">` (네비게이션, 링크)
- **주요 버튼**: `<TextButton variant="primary" size="sm">` (액션)
- **보조 버튼**: `<TextButton variant="secondary" size="sm">` (뒤로가기)
- **위험 버튼**: `<TextButton variant="danger" size="sm">` (삭제)

### 입력 컴포넌트
- **텍스트 입력**: `<CompactInput>` - px-1.5 py-0.5, text-xs, font-light
- **선택 박스**: `<CompactSelect>` - px-1.5 py-0.5, text-xs, font-light
- **테이블**: `<CompactTable>` - 최소 높이, font-light

### 색상 시스템
```css
- 주요 색상: text-blue-600, bg-blue-600
- 성공: text-green-600, bg-green-100
- 경고: text-yellow-600, bg-yellow-100
- 오류: text-red-600, bg-red-100
- 회색: text-gray-600, bg-gray-50
```

## 📋 현재 구현 상태 (2024-06-16 업데이트)

### ✅ 완료된 기능
- [x] **프레임워크 마이그레이션**: Next.js → Parcel + React Router 완료
- [x] **인증 시스템**: AuthContext, ID 기반 로그인/회원가입 시스템 구현
- [x] **Header 완전 복원**: 모든 네비게이션 메뉴 및 관리자 드롭다운
- [x] **페이지 라우팅**: 모든 페이지 경로 설정 완료
- [x] **UI 컴포넌트**: TextButton, CompactInput, CompactSelect, CompactTable
- [x] **디자인 시스템**: 1080px 폭, font-light, 조밀한 UI 적용

### 🎯 Header 메뉴 구조 (실제 구현됨)

#### 메인 네비게이션
- **홈** (`/`) - Home 페이지
- **Q캡쳐** (`/qcapture`) - QCapture 페이지
- **Q텍스트** (`/qtext`) - QText 페이지
- **Q네임** (`/qname`) - QName 페이지
- **사용법** (`/manuals`) - Manuals 페이지
- **가격** (`/pricing`) - Pricing 페이지
- **게시판** (`/board`) - Board 페이지

#### 관리자 드롭다운 메뉴
- **관리자대시보드** (`/admin`) - AdminDashboard
- **회원정보관리** (`/admin/users`) - AdminUsers
- **회원예치금관리** (`/admin/deposits`) - AdminDeposits
- **서비스가격설정** (`/admin/pricing`) - AdminPricing
- **작업모니터링** (`/admin/jobs`) - AdminJobs
- **프로그램관리** (`/admin/programs`) - AdminPrograms
- **사용설명서관리** (`/admin/manuals`) - AdminManuals

#### 사용자 메뉴
- **내정보** (`/mypage`) - MyPage
- **로그인** (`/login`) - Login
- **회원가입** (`/signup`) - Signup
- **로그아웃** - 인증 해제

### � 페이지 구현 상태

#### ✅ 기본 구조 완료 (3단계 복원 필요)
- [x] **Home**: 서비스 소개, CTA 섹션
- [x] **QCapture**: 기본 UI, 다운로드 섹션
- [x] **QText**: 파일 업로드 UI, 처리 옵션
- [x] **QName**: 엑셀 업로드 UI, 생성 옵션
- [x] **Manuals**: 사용법 카드 레이아웃
- [x] **Pricing**: 가격표 그리드
- [x] **Board**: 게시판 테이블 레이아웃

#### ✅ 관리자 페이지 완료
- [x] **AdminDashboard**: 관리 메뉴 대시보드
- [x] **AdminUsers**: 사용자 목록 (더미 데이터)
- [x] **AdminDeposits**: 예치금 관리 기본 구조
- [x] **AdminPricing**: 가격 관리 기본 구조
- [x] **AdminJobs**: 작업 모니터링 테이블
- [x] **AdminPrograms**: 프로그램 관리 카드
- [x] **AdminManuals**: 매뉴얼 관리 테이블

#### ✅ 인증 페이지 완료
- [x] **Login**: ID 기반 로그인 기능 (테스트 계정: admin/admin, testuser/test123)
- [x] **Signup**: 회원가입 기본 구조
- [x] **MyPage**: 마이페이지 기본 구조

## 🗂️ 파일 구조 원칙

### 컴포넌트 구조
```
src/
├── components/
│   ├── ui/                 # 재사용 UI 컴포넌트
│   │   ├── TextButton.tsx
│   │   ├── CompactInput.tsx
│   │   ├── CompactSelect.tsx
│   │   └── CompactTable.tsx
│   └── Header.tsx          # 레이아웃 컴포넌트
├── pages/                  # 페이지 컴포넌트
│   ├── admin/             # 관리자 페이지
│   └── [서비스명].tsx      # 서비스 페이지
├── context/               # 상태 관리
│   └── AuthContext.tsx
└── hooks/                 # 커스텀 훅
```

### 페이지 구조 템플릿
```jsx
export default function PageName() {
  return (
    <div className="max-w-[1080px] mx-auto px-4 py-6">
      <h1 className="text-2xl font-light mb-6">페이지 제목</h1>
      
      {/* 콘텐츠 영역 */}
      <div className="space-y-6">
        {/* 섹션들 */}
      </div>
    </div>
  );
}
```

## 🔧 3단계: 페이지 기능 완성 (현재 진행)

### 우선순위 1: 서비스 페이지 실제 기능 구현

#### QCapture 페이지
- [ ] 파일 업로드 기능 (드래그앤드롭)
- [ ] 프로그램 다운로드 링크 연결
- [ ] 사용 통계 표시
- [ ] 실시간 캡쳐 상태 모니터링

#### QText 페이지  
- [ ] 이미지 파일 업로드 (다중 선택)
- [ ] 처리 옵션 실제 동작
- [ ] 진행 상태 표시
- [ ] 결과 다운로드 기능

#### QName 페이지
- [ ] 엑셀 파일 검증
- [ ] 템플릿 다운로드
- [ ] 상품명 생성 API 연동
- [ ] 결과 프리뷰 및 다운로드

### 우선순위 2: 관리자 페이지 실제 데이터 연동

#### AdminUsers 완성
- [ ] 실제 사용자 목록 API 연동
- [ ] 사용자 편집/삭제 기능
- [ ] 사용자 검색/필터링 개선
- [ ] 권한 변경 기능

#### AdminDeposits 완성  
- [ ] 예치금 내역 조회
- [ ] 충전/차감 기능
- [ ] 거래 내역 필터링
- [ ] 통계 대시보드

#### AdminPricing 완성
- [ ] 서비스별 가격 설정
- [ ] 할인/프로모션 관리
- [ ] 가격 변경 이력

### 우선순위 3: 부가 기능 완성

#### Board 페이지
- [ ] 게시글 CRUD
- [ ] 파일 첨부 기능
- [ ] 댓글 시스템
- [ ] 공지사항 고정

#### Manuals 페이지
- [ ] 매뉴얼 검색 기능
- [ ] 카테고리별 분류
- [ ] 매뉴얼 평가/피드백

## 🔗 4단계: API 연동 상세 계획

### 테스트 계정 (ID 기반 인증)
```
관리자: admin / admin
일반사용자: testuser / test123
```

### API 엔드포인트 연동 순서
1. **인증 API** (ID 기반 구조)
   - POST /api/auth/login (userId, password)
   - POST /api/auth/signup (userId, name, email?, password)
   - POST /api/auth/logout
   - GET /api/auth/me
3. **서비스 API** (QCapture, QText, QName)
4. **관리 API** (예치금, 가격 설정)
5. **부가 기능 API** (게시판, 매뉴얼)

## 📱 현재 개발 서버 정보
- **프론트엔드**: http://localhost:3001 (Parcel)
- **백엔드**: http://localhost:8000 (FastAPI - 연동 예정)

## ⚡ 성능 최적화

### 번들 크기 최적화
- Tree shaking 활성화
- 불필요한 의존성 제거
- 코드 스플리팅 적용

### 로딩 성능
- 이미지 최적화
- Lazy loading 적용
- API 캐싱 구현

## 📝 개발 규칙

### 코딩 컨벤션
- TypeScript 엄격 모드 사용
- ESLint + Prettier 적용
- 컴포넌트명: PascalCase
- 파일명: PascalCase (컴포넌트), camelCase (유틸)

### Git 규칙
- feat: 새 기능
- fix: 버그 수정
- refactor: 리팩토링
- style: 스타일 수정
- docs: 문서 수정

## 🧪 테스트 계획
- [ ] 컴포넌트 단위 테스트
- [ ] 페이지 통합 테스트
- [ ] API 연동 테스트
- [ ] 크로스 브라우저 테스트

---

**업데이트 날짜**: 2025-06-16
**버전**: v1.0.0
**담당자**: GitHub Copilot
