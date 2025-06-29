# QClick 네비게이션 바 상세 가이드

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
   - 예치금 잔액 표시 및 업데이트 버튼

2. **네비게이션 링크**
   - 메인 서비스 (QCapture, QText, QName)
   - 지원 & 도움말 (매뉴얼, 가격 정보)
   - 커뮤니티 (게시판)
   - 계정 관련 (마이페이지)
   - 관리자용 페이지 링크 (관리자 로그인 시에만 표시)

3. **반응형 디자인**
   - 모바일 화면에서는 햄버거 메뉴로 변환
   - 다양한 화면 크기에 대응

4. **메뉴 상호작용**
   - 드롭다운 메뉴 (관리자 메뉴)
   - 활성 경로 하이라이트 표시
   - 외부 클릭 시 메뉴 자동 닫기

### 상태 관리

- `AuthContext`를 통한 인증 상태 관리 및 사용자 정보 접근
- `useState` 훅을 사용한 메뉴 열기/닫기 상태 관리
- `useLocation` 훅을 사용한 현재 경로 감지 및 활성 메뉴 표시
- `useEffect` 훅을 사용한 경로 변경 시 메뉴 닫기 및 상태 동기화
- 예치금 업데이트 기능 (비동기식 로딩 UI 포함)

### 컴포넌트 구조

```tsx
// Header.tsx 메인 구조
export default function Header() {
  // 훅과 상태 관리
  const { user, isAuthenticated, logout, updateBalance } = useAuth();
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
  const [, forceUpdate] = useState(0);
  const location = useLocation();

  // 이벤트 핸들러와 사이드 이펙트
  // ...

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* 데스크톱 네비게이션 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* 로고 */}
          {/* 메인 내비게이션 링크 */}
          {/* 사용자 정보 및 로그인/로그아웃 */}
          {/* 모바일 메뉴 토글 버튼 */}
        </div>
      </div>

      {/* 모바일 네비게이션 */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          {/* 모바일 메뉴 아이템 */}
        </div>
      )}
    </header>
  );
}
```

## 주요 기능 상세 설명

### 1. 예치금 업데이트 기능

사용자가 최신 예치금 정보를 확인할 수 있도록 업데이트 버튼을 제공합니다. 비동기 작업으로 처리되며 로딩 상태를 표시합니다.

```tsx
// 예치금 업데이트 함수
const handleUpdateBalance = async () => {
  if (isUpdatingBalance) return; // 이미 업데이트 중이면 중복 호출 방지
  
  setIsUpdatingBalance(true);
  try {
    const success = await updateBalance();
    if (success) {
      console.log('예치금 업데이트 성공');
      forceUpdate(prev => prev + 1); // 강제 리렌더링으로 업데이트된 잔액 표시
    } else {
      console.error('예치금 업데이트 실패');
      alert('예치금 정보를 업데이트하지 못했습니다. 다시 시도해주세요.');
    }
  } catch (error) {
    console.error('예치금 업데이트 중 오류:', error);
  } finally {
    setIsUpdatingBalance(false);
  }
};
```

### 2. 활성 메뉴 표시

현재 경로에 따라 해당 메뉴를 시각적으로 활성화하여 사용자가 현재 위치를 쉽게 파악할 수 있게 합니다.

```tsx
// 현재 경로가 특정 패턴과 일치하는지 확인하는 함수
const isActive = (path: string) => {
  if (path === '/') {
    return location.pathname === '/';
  }
  return location.pathname.startsWith(path);
};

// 사용 예시
<Link 
  to="/qcapture" 
  className={`${
    isActive('/qcapture') 
      ? 'border-blue-500 text-gray-900' 
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
>
  QCapture
</Link>
```

### 3. 조건부 메뉴 표시

사용자 권한(관리자/일반 사용자)에 따라 적절한 메뉴를 표시합니다.

```tsx
{/* 관리자 메뉴 - 관리자로 로그인한 경우에만 표시 */}
{isAuthenticated && user?.role === 'admin' && (
  <div className="relative ml-3">
    <button
      onClick={toggleAdminMenu}
      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
    >
      <span>관리자 메뉴</span>
      <svg className="ml-1 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
    
    {/* 관리자 드롭다운 메뉴 */}
    {isAdminMenuOpen && (
      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
        <div className="py-1">
          <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">관리자 대시보드</Link>
          <Link to="/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">회원 관리</Link>
          <Link to="/admin/deposits" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">예치금 관리</Link>
          <Link to="/admin/programs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">프로그램 관리</Link>
          <Link to="/admin/pricing" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">가격 설정</Link>
        </div>
      </div>
    )}
  </div>
)}
```

## 향후 개선 방향

1. **디자인 개선**
   - 2중열 구조 도입으로 주요 메뉴와 보조 메뉴 구분
   - 일관된 디자인 언어와 브랜딩 적용
   - 고급스러운 애니메이션 효과 추가
   - 테마 전환 기능 (다크 모드/라이트 모드)

2. **기능 추가**
   - 실시간 예치금 표시 및 홀드 상태 표시
   - 사용자별 허용 프로그램 목록 표시
   - 알림 센터 통합
   - 최근 사용 서비스 빠른 접근 기능
   - 검색 기능 통합

3. **성능 최적화**
   - `React.memo`를 사용한 불필요한 리렌더링 방지
   - `useMemo`와 `useCallback`을 활용한 메모이제이션
   - 지연 로딩(Lazy Loading) 적용
   - 성능 모니터링 도구 통합

4. **접근성 향상**
   - ARIA 속성 추가로 스크린 리더 지원
   - 키보드 탐색 개선 (Tab 인덱스 설정)
   - 고대비 모드 지원
   - 글꼴 크기 조정 기능

5. **코드 구조화**
   - 메인 네비게이션, 모바일 메뉴, 사용자 정보 등 서브 컴포넌트로 분리
   - 타입 정의 강화 및 인터페이스 문서화
   - 테스트 케이스 추가 (유닛 테스트, 통합 테스트)
   - 스토리북(Storybook) 통합으로 UI 컴포넌트 문서화

## 2중열 네비게이션 바 구현 예시

현재 단일 행 네비게이션을 2중열 구조로 개선하여 더 체계적이고 시각적으로 구분된 메뉴를 제공할 수 있습니다:

```tsx
<header className="bg-white shadow">
  {/* 상단 네비게이션 - 로고, 주요 링크, 사용자 정보 */}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      {/* 로고 섹션 */}
      <div className="flex items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center">
          <span className="ml-2">QClick</span>
        </Link>
      </div>

      {/* 주요 서비스 링크 - 데스크톱 */}
      <nav className="hidden md:flex items-center space-x-8">
        <Link to="/qcapture" className={`${isActive('/qcapture') ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}>
          QCapture
        </Link>
        <Link to="/qtext" className={`${isActive('/qtext') ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}>
          QText
        </Link>
        <Link to="/qname" className={`${isActive('/qname') ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}>
          QName
        </Link>
      </nav>

      {/* 사용자 정보 및 로그인/로그아웃 */}
      <div className="flex items-center">
        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            {/* 예치금 정보 */}
            <div className="hidden md:flex items-center">
              <span className="text-sm text-gray-500 mr-2">예치금:</span>
              <span className="text-sm font-medium text-gray-900">{user?.balance?.toLocaleString()}원</span>
              <button 
                onClick={handleUpdateBalance} 
                className="ml-2 text-xs text-blue-600 hover:text-blue-800" 
                disabled={isUpdatingBalance}
              >
                {isUpdatingBalance ? '업데이트 중...' : '업데이트'}
              </button>
            </div>
            
            {/* 사용자 정보 */}
            <div className="flex items-center">
              <span className="text-sm text-gray-900 mr-2">{user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                로그아웃
              </button>
            </div>
          </div>
        ) : (
          <div className="space-x-4">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800">로그인</Link>
            <Link to="/signup" className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">회원가입</Link>
          </div>
        )}
        
        {/* 모바일 메뉴 버튼 */}
        <button
          className="md:hidden ml-4 flex items-center"
          onClick={toggleMobileMenu}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
  
  {/* 하단 네비게이션 - 보조 메뉴 */}
  <div className="hidden md:block border-t border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-10">
        {/* 보조 메뉴 링크 */}
        <nav className="flex space-x-8">
          <Link to="/manuals" className={`${isActive('/manuals') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'} flex items-center text-sm font-medium`}>
            매뉴얼
          </Link>
          <Link to="/pricing" className={`${isActive('/pricing') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'} flex items-center text-sm font-medium`}>
            가격 정보
          </Link>
          <Link to="/board" className={`${isActive('/board') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'} flex items-center text-sm font-medium`}>
            게시판
          </Link>
          <Link to="/mypage" className={`${isActive('/mypage') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'} flex items-center text-sm font-medium`}>
            마이페이지
          </Link>
        </nav>
        
        {/* 관리자 메뉴 */}
        {isAuthenticated && user?.role === 'admin' && (
          <div className="relative">
            <button
              onClick={toggleAdminMenu}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center h-8"
            >
              <span>관리자</span>
              <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {isAdminMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">관리자 대시보드</Link>
                  <Link to="/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">회원 관리</Link>
                  <Link to="/admin/deposits" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">예치금 관리</Link>
                  <Link to="/admin/programs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">프로그램 관리</Link>
                  <Link to="/admin/pricing" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">가격 설정</Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
  
  {/* 모바일 메뉴 */}
  {/* ... 모바일 메뉴 구현 ... */}
</header>
```

## 참고 자료 및 리소스

- [Tailwind CSS 네비게이션 바](https://tailwindui.com/components/application-ui/navigation/navbars)
- [React Router 문서](https://reactrouter.com/web/guides/quick-start)
- [React Navigation 패턴](https://ui.dev/react-router-nested-routes/)
- [접근성 가이드라인](https://www.w3.org/WAI/standards-guidelines/aria/)
- [반응형 디자인 패턴](https://web.dev/responsive-web-design-patterns/)

## 구현 시 주의사항

1. **권한 관리**: 관리자 메뉴는 서버 측 권한 검증과 함께 사용해야 합니다.
2. **성능 최적화**: 불필요한 리렌더링을 방지하려면 메모이제이션 기법을 활용합니다.
3. **접근성**: 키보드 탐색과 스크린 리더 지원을 위한 ARIA 태그를 추가합니다.
4. **반응형 디자인**: 모든 화면 크기에서 일관되게 작동하는지 테스트합니다.
5. **상태 동기화**: `AuthContext`와 로컬 스토리지 간의 상태 동기화를 확인합니다.

이 문서는 QClick 프로젝트의 네비게이션 바 구현을 위한 가이드라인으로 사용해주세요. 프로젝트 요구사항이나 디자인에 따라 내용이 변경될 수 있습니다.
