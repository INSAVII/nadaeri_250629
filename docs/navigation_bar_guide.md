# QClick 네비게이션 바 가이드

## 개요

이 문서는 QClick 프로젝트의 네비게이션 바 구현에 대한 상세 정보와 향후 개선 방향을 제공합니다. 네비게이션 바는 사용자 인증 상태를 반영하고 다양한 페이지로의 접근을 제공하는 중요한 UI 구성 요소입니다.

## 현재 구현

현재 네비게이션 바는 `Header.tsx` 컴포넌트에 구현되어 있으며 다음과 같은 특징을 가집니다:

### 파일 위치
```
d:\250612_refactoring\frontend\src\components\Header.tsx
```

### 주요 기능

1. **인증 상태 표시**
   - 로그인/로그아웃 버튼
   - 로그인한 사용자 이름 및 역할(관리자/일반 사용자) 표시
   - 예치금 잔액 표시

2. **네비게이션 링크**
   - 메인 서비스 (QCapture, QText, QName)
   - 지원 & 도움말 (매뉴얼, 가격 정보)
   - 커뮤니티 (게시판)
   - 계정 관련 (마이페이지)
   - 관리자용 페이지 링크 (관리자 로그인 시에만 표시)

3. **반응형 디자인**
   - 모바일 화면에서는 햄버거 메뉴로 변환
   - 다양한 화면 크기에 대응

### 상태 관리

- `AuthContext`를 통한 인증 상태 관리
- 로컬 스토리지를 통한 사용자 세션 유지
- 예치금 업데이트 기능 (비동기식 로딩 UI 포함)

### 코드 구조

```tsx
// 주요 컴포넌트 구조
const Header: React.FC = () => {
  const auth = useAuth(); // 인증 정보 가져오기
  const [isOpen, setIsOpen] = useState(false); // 모바일 메뉴 상태
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false); // 예치금 업데이트 상태

  // 예치금 업데이트 처리 함수
  const handleUpdateBalance = async () => {
    setIsUpdatingBalance(true);
    await auth.updateBalance();
    setIsUpdatingBalance(false);
  };

  return (
    <header>
      {/* 로고 및 메인 메뉴 */}
      {/* 사용자 인증 상태에 따른 메뉴 표시 */}
      {/* 모바일 햄버거 메뉴 */}
    </header>
  );
};
```

## 향후 개선 사항

1. **디자인 개선**
   - 2중열 구조 도입으로 주요 메뉴와 보조 메뉴 구분
   - 일관된 디자인 언어와 브랜딩 적용
   - 고급스러운 애니메이션 효과 추가

2. **기능 추가**
   - 실시간 예치금 표시 및 홀드 상태 표시
   - 사용자별 허용 프로그램 목록 표시
   - 알림 센터 통합
   - 최근 사용 서비스 빠른 접근 기능

3. **성능 최적화**
   - 불필요한 리렌더링 방지
   - 메모이제이션을 통한 성능 향상
   - 지연 로딩(Lazy Loading) 적용

4. **접근성 향상**
   - ARIA 속성 추가
   - 키보드 탐색 개선
   - 스크린 리더 지원 강화

5. **코드 구조화**
   - 서브 컴포넌트로 분리하여 유지보수성 향상
   - TypeScript 타입 정의 강화
   - 테스트 케이스 추가

## 예시 코드: 2중열 네비게이션 바

```tsx
<header className="bg-white shadow">
  {/* 상단 네비게이션 - 주요 링크 */}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      <div className="flex">
        <div className="flex-shrink-0 flex items-center">
          <Logo />
        </div>
        <nav className="hidden md:ml-6 md:flex md:space-x-8">
          {/* 주요 서비스 링크 */}
          <MainNavLinks />
        </nav>
      </div>
      <div className="flex items-center">
        {/* 사용자 정보 및 예치금 */}
        <UserInfo />
      </div>
    </div>
  </div>
  
  {/* 하단 네비게이션 - 보조 링크 */}
  <div className="hidden md:block border-t border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-10">
        <nav className="flex space-x-8">
          {/* 보조 메뉴 링크 */}
          <SecondaryNavLinks />
        </nav>
        {/* 관리자 링크 */}
        {auth.user?.role === 'admin' && <AdminLinks />}
      </div>
    </div>
  </div>
  
  {/* 모바일 메뉴 */}
  <MobileMenu isOpen={isOpen} setIsOpen={setIsOpen} />
</header>
```

## 참고 자료

- [Tailwind CSS 네비게이션 바 예제](https://tailwindui.com/components/application-ui/navigation/navbars)
- [React Router 문서](https://reactrouter.com/web/guides/quick-start)
- [접근성 가이드라인](https://www.w3.org/WAI/standards-guidelines/aria/)

## 주의사항

- 관리자 메뉴는 권한에 따라 적절하게 표시되어야 합니다.
- 예치금 업데이트는 비동기 처리를 통해 UI 블로킹을 방지해야 합니다.
- 네비게이션 바는 모든 페이지에서 일관되게 표시되어야 합니다.
- 상태 변경 시 네비게이션 바와 페이지 간의 동기화가 보장되어야 합니다.

이 문서는 QClick 프로젝트의 네비게이션 바 구현을 위한 가이드라인으로 사용해주세요. 프로젝트 요구사항이나 디자인에 따라 내용이 변경될 수 있습니다.
