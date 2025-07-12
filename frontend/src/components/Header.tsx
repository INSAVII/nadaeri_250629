import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './ui/Loading';

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // 백화면 방지: 즉시 mounted 상태 설정
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔍 강화된 디버깅: 인증 상태 로그 출력
  console.log('🔍 Header.tsx - 현재 인증 상태:', {
    isAuthenticated,
    user,
    userId: user?.userId,
    role: user?.role,
    balance: user?.balance,
    userType: typeof user,
    isUserNull: user === null,
    isUserUndefined: user === undefined,
    isAdmin: user?.role === 'admin',
    roleCheck: {
      roleValue: user?.role,
      roleType: typeof user?.role,
      roleLength: user?.role?.length,
      adminComparison: user?.role === 'admin'
    }
  });

  // 🔍 실시간 감지: user 상태 변경 시마다 로그
  useEffect(() => {
    console.log('🔄 Header.tsx - user 상태 변경 감지:', {
      isAuthenticated,
      user,
      roleCheck: {
        role: user?.role,
        isAdmin: user?.role === 'admin',
        roleString: JSON.stringify(user?.role),
        userId: user?.userId
      },
      timestamp: new Date().toISOString()
    });

    // 🚨 관리자 역할 특별 감지
    if (user?.role === 'admin') {
      console.log('✅ Header.tsx - 관리자 역할 감지됨!', {
        role: user.role,
        userId: user.id, // 🆕 user.id 사용으로 통일
        name: user.name
      });
    } else if (user?.role) {
      console.log('⚠️ Header.tsx - 관리자가 아닌 역할:', {
        role: user.role,
        expected: 'admin',
        userId: user.userId
      });
    }
  }, [user, isAuthenticated]);

  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // 무한루프 방지를 위한 ref들
  const eventListenersRegisteredRef = useRef(false);
  const isUpdatingRef = useRef(false);

  // 이벤트 리스너 등록 (한 번만)
  useEffect(() => {
    if (eventListenersRegisteredRef.current) {
      return;
    }
    eventListenersRegisteredRef.current = true;

    // 페이지 이동 이벤트만 처리
    const handleLocationChange = () => {
      setIsAdminMenuOpen(false);
      setIsMobileMenuOpen(false);
    };

    // 예치금 변경 이벤트 처리 (안전한 동기화)
    const handleBalanceChanged = (event: CustomEvent) => {
      if (user && event.detail.userId === user.id) {
        // 예치금 변경 시 페이지 새로고침 없이 실시간 업데이트
        // AuthContext에서 자동으로 업데이트되므로 별도 처리 불필요
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('balanceChanged', handleBalanceChanged as EventListener);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('balanceChanged', handleBalanceChanged as EventListener);
      eventListenersRegisteredRef.current = false;
    };
  }, []); // 빈 의존성 배열

  // 경로 변경 감지 (단순화)
  useEffect(() => {
    setIsAdminMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // 드롭다운 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setIsAdminMenuOpen(false);
    };
    if (isAdminMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isAdminMenuOpen]);

  const toggleAdminMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isAdminMenuOpen;
    setIsAdminMenuOpen(newState);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // 캐시 정리 함수
  const clearCache = () => {
    if (confirm('브라우저 캐시를 정리하시겠습니까?\n\n로그인 정보와 설정이 모두 삭제됩니다.')) {
      try {
        // localStorage 정리
        localStorage.clear();
        console.log('✅ localStorage 완전 삭제됨');

        // sessionStorage 정리
        sessionStorage.clear();
        console.log('✅ sessionStorage 완전 삭제됨');

        // 쿠키 정리
        document.cookie.split(";").forEach(function (c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        console.log('✅ 쿠키 완전 삭제됨');

        alert('캐시가 정리되었습니다. 페이지가 새로고침됩니다.');

        // 페이지 새로고침
        window.location.reload();
      } catch (error) {
        console.error('캐시 정리 중 오류:', error);
        alert('캐시 정리 중 오류가 발생했습니다.');
      }
    }
  };

  // 현재 경로가 특정 패턴과 일치하는지 확인하는 함수
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // 사용자 정보를 localStorage에 저장
  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        userId: user.id, // 🆕 user.id와 동일하게 설정
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance
      }));
    }
  }, [user]);

  // 백화면 방지: 로딩 중에도 기본 헤더 구조 표시
  if (!mounted) {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <div className="text-2xl text-blue-600 font-light">나대리que</div>
            </div>
            <div className="flex items-center">
              <Loading size="sm" text="" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1차 메인 네비게이션 (데스크톱 용) */}
        <div className="flex items-center justify-between py-4">
          {/* 로고 */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl text-blue-600 hover:text-blue-700 transition-colors flex items-center">
              <span className="font-light">나대리que</span>
            </Link>
          </div>

          {/* 모바일 메뉴 토글 버튼 */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* 데스크톱 메뉴 */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-base font-light transition-colors ${isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
            >
              홈
            </Link>

            {/* 서비스 메뉴들 - 모든 사용자에게 표시 */}
            <Link
              to={user?.role === 'admin' ? '/admin/qname' : '/qname'}
              className={`px-3 py-2 rounded-md text-base font-light ${isActive('/qname') || isActive('/app/qname') || isActive('/admin/qname') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
            >
              큐네임
            </Link>
            <Link
              to={user?.role === 'admin' ? '/admin/qcapture' : '/qcapture'}
              className={`px-3 py-2 rounded-md text-base font-light ${isActive('/qcapture') || isActive('/app/qcapture') || isActive('/admin/qcapture') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
            >
              큐캡쳐
            </Link>
            <Link
              to="/qtext"
              className={`px-3 py-2 rounded-md text-base font-light ${isActive('/qtext') || isActive('/app/qtext') || isActive('/admin/qtext') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
            >
              큐문자
            </Link>

            <Link
              to="/board"
              className={`px-3 py-2 rounded-md text-base font-light ${isActive('/board') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
            >
              게시판/자료실
            </Link>

            {/* 로그인 상태에 따른 메뉴 */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* 관리자 메뉴 */}
                {user?.role === 'admin' && (
                  <div className="relative">
                    <button
                      onClick={toggleAdminMenu}
                      className={`flex items-center px-3 py-2 rounded-md text-base font-light transition-colors ${isActive('/admin') ? 'text-blue-600 bg-blue-50' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                        }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                      </svg>
                      관리자
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isAdminMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-xl z-50 max-h-[calc(100vh-100px)] overflow-y-auto">
                        <div className="py-2 px-4 bg-blue-50 text-blue-600 font-medium border-b border-gray-200 sticky top-0">
                          관리자 메뉴
                        </div>
                        <div className="py-1">
                          <Link
                            to="/admin"
                            className="block px-3 py-2 rounded-md text-base font-light text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setIsAdminMenuOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            대시보드
                          </Link>
                          <Link
                            to="/admin/cms"
                            className="block px-3 py-2 rounded-md text-base font-light text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setIsAdminMenuOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            CMS 관리
                          </Link>
                          <Link
                            to="/admin/programs"
                            className="block px-3 py-2 rounded-md text-base font-light text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setIsAdminMenuOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            프로그램관리(큐캡쳐)
                          </Link>
                          <Link
                            to="/promotion-manager"
                            className="block px-3 py-2 rounded-md text-base font-light text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setIsAdminMenuOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            홍보문구관리
                          </Link>
                          <Link
                            to="/admin/bank-transfer"
                            className="block px-3 py-2 rounded-md text-base font-light text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setIsAdminMenuOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            💰 무통장입금관리
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={clearCache}
                  className="flex items-center px-3 py-2 rounded-md text-base font-light text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                  title="브라우저 캐시 정리"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  캐시정리
                </button>
                <button
                  onClick={logout}
                  className="flex items-center px-3 py-2 rounded-md text-base font-light text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <Link
                  to="/login"
                  className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-md text-base font-light transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className="ml-2 flex items-center px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md text-base font-light transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  회원가입
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* 모바일 메뉴 */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} pb-3 border-t border-gray-200`}>
          <div className="pt-2 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-light ${isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              홈
            </Link>

            {/* 서비스 메뉴들 - 모든 사용자에게 표시 */}
            <Link
              to={user?.role === 'admin' ? '/admin/qname' : '/qname'}
              className={`block px-3 py-2 rounded-md text-base font-light ${isActive('/qname') || isActive('/app/qname') || isActive('/admin/qname') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              큐네임
            </Link>
            <Link
              to={user?.role === 'admin' ? '/admin/qcapture' : '/qcapture'}
              className={`block px-3 py-2 rounded-md text-base font-light ${isActive('/qcapture') || isActive('/app/qcapture') || isActive('/admin/qcapture') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              큐캡쳐
            </Link>
            <Link
              to="/qtext"
              className={`block px-3 py-2 rounded-md text-base font-light ${isActive('/qtext') || isActive('/app/qtext') || isActive('/admin/qtext') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              큐문자
            </Link>
            <Link
              to="/board"
              className={`block px-3 py-2 rounded-md text-base font-light ${isActive('/board') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              게시판/자료실
            </Link>

            {/* 관리자 메뉴 */}
            {isAuthenticated && user?.role === 'admin' && (
              <>
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <div className="px-3 py-1 text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    관리자 메뉴
                  </div>
                  <Link
                    to="/admin"
                    className="block px-3 py-2 rounded-md text-base font-light text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🏠 대시보드
                  </Link>
                  <Link
                    to="/admin/cms"
                    className="block px-3 py-2 rounded-md text-base font-light text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🏢 CMS 관리
                  </Link>
                  <Link
                    to="/admin/programs"
                    className="block px-3 py-2 rounded-md text-base font-light text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🔧 프로그램관리(큐캡쳐)
                  </Link>
                  <Link
                    to="/promotion-manager"
                    className="block px-3 py-2 rounded-md text-base font-light text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    📢 홍보문구관리
                  </Link>
                  <Link
                    to="/admin/bank-transfer"
                    className="block px-3 py-2 rounded-md text-base font-light text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    💰 무통장입금관리
                  </Link>
                </div>
              </>
            )}

            {/* 사용자 관련 메뉴 */}
            <div className="border-t border-gray-200 mt-2 pt-2">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      clearCache();
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-light text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                  >
                    🧹 캐시정리
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-light text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-light text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    로그인
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-3 py-2 rounded-md textBase font-light text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2차 사용자 정보 표시 (우측 글씨, 좌측 정렬) - 로그인된 상태에서만 표시 */}
        {isAuthenticated && (
          <div className="hidden md:flex justify-end py-2 text-base text-gray-600 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center space-x-3">
              {/* 사용자 ID */}
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>ID <strong className="text-gray-800">{user?.userId || '사용자'}</strong></span>
              </div>
              {/* 관리자 뱃지 */}
              {user?.role === 'admin' && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full font-medium border border-blue-200">
                  관리자
                </span>
              )}

              <div className="w-px h-4 bg-gray-300"></div>

              {/* 예치금 잔액 */}
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                <span>예치금잔액 <strong className="text-green-600 font-semibold">{user?.balance?.toLocaleString() || '0'}원</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
