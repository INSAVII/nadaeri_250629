/**
 * 🔥 중요: 백화현상 해결을 위한 AuthContext 단순화 🔥
 *
 * 문제: 복잡한 초기화 로직으로 인한 백화현상 발생
 * 원인: 중복된 useEffect와 무한루프 방지 로직이 충돌
 *
 * 해결책: 초기화 로직을 단순화하고 안정적인 구조로 변경
 *
 * 작성일: 2024년 12월
 * 문제 해결자: AI Assistant
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { STORAGE_KEYS, getApiUrl, IS_DEVELOPMENT } from '../config/constants';
import { validateUserData } from '../utils/authHelpers';
import { AuthUser, convertToAuthUser, convertFromAuthUser } from '../types/user';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (userData: {
    userId: string;
    name: string;
    email?: string;
    password: string;
    confirmPassword: string;
    phone?: string;
  }) => Promise<boolean>;
  // 개발용 디버그 함수들
  forceAdminLogin?: () => boolean;
  debugAuthState?: () => void;
  forceReset?: () => void;
  refreshBalance?: () => Promise<boolean>;
  updateBalance?: (user: AuthUser, newBalance: number) => Promise<boolean>;
  updateUserBalance: (newBalance: number) => Promise<boolean>;
  refreshUserData?: () => Promise<boolean>;
  // 프로그램 권한 관리 함수
  fetchProgramPermissions?: () => Promise<{ free: boolean; month1: boolean; month3: boolean } | null>;
  updateProgramPermissions?: (permissions: { free: boolean; month1: boolean; month3: boolean }) => Promise<boolean>;
  // 관리자 권한 체크 함수
  isUserAdmin?: (user: AuthUser | null) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🛡️ 단순화된 초기화 로직
  useEffect(() => {
    console.log('🔄 AuthContext - 단순화된 초기화 시작');

    try {
      // 강제 초기화 플래그 확인
      const forceInit = sessionStorage.getItem('forceInit');
      if (forceInit === 'true') {
        console.log('🧹 강제 초기화 플래그 감지, 모든 데이터 삭제');
        sessionStorage.removeItem('forceInit');
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
        setIsLoading(false);
        return;
      }

      // 로그아웃 플래그 확인
      const logoutFlag = sessionStorage.getItem('forceLogout');
      if (logoutFlag === 'true') {
        console.log('🚪 강제 로그아웃 플래그 감지');
        sessionStorage.removeItem('forceLogout');
        setUser(null);
        setIsLoading(false);
        return;
      }

      // localStorage에서 사용자 데이터 복원
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.token) {
            console.log('✅ AuthContext - 사용자 데이터 복원 성공');
            // userId를 id와 동일하게 설정
            if (parsed.id && !parsed.userId) {
              parsed.userId = parsed.id;
            }
            setUser(parsed);
          } else {
            console.log('❌ AuthContext - 유효한 토큰 없음');
            setUser(null);
          }
        } catch (error) {
          console.error('❌ AuthContext - 데이터 파싱 오류:', error);
          setUser(null);
        }
      } else {
        console.log('ℹ️ AuthContext - 저장된 사용자 데이터 없음');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ AuthContext - 초기화 중 오류:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // 의존성 배열을 비워서 한 번만 실행

  // 사용자 데이터 저장 함수 (단순화) - 예치금과 분리
  const saveUserData = useCallback((userData: AuthUser) => {
    try {
      console.log('AuthContext - saveUserData 호출:', {
        userData,
        role: userData?.role,
        userId: userData?.userId,
        name: userData?.name,
        balance: userData?.balance,
        type: typeof userData?.balance
      });

      if (
        userData &&
        typeof userData === 'object' &&
        userData.userId &&
        userData.name &&
        (userData.role === 'admin' || userData.role === 'user') &&
        typeof userData.balance === 'number'
      ) {
        // ✅ localStorage 저장 복원 - 토큰 저장을 위해 필요
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        localStorage.setItem('token', userData.token || '');

        // 메모리 저장
        setUser(userData);
        console.log('AuthContext - 사용자 데이터 저장 완료 (localStorage + 메모리):', userData);
        return true;
      } else {
        console.error('AuthContext - 유효하지 않은 사용자 데이터:', {
          userData,
          hasUserId: !!userData?.userId,
          hasName: !!userData?.name,
          roleValid: userData?.role === 'admin' || userData?.role === 'user',
          balanceValid: typeof userData?.balance === 'number'
        });
        return false;
      }
    } catch (error) {
      console.error('AuthContext - saveUserData 오류:', error);
      return false;
    }
  }, []);

  // 사용자 데이터 제거 함수 (명시적 로그아웃 전용)
  const clearUserData = useCallback(() => {
    try {
      console.log('AuthContext - clearUserData 호출 (명시적 로그아웃)');

      // 강제 로그아웃 플래그 설정
      sessionStorage.setItem('forceLogout', 'true');

      // 🚫 명시적 로그아웃 시에만 localStorage/sessionStorage 정리
      localStorage.clear();
      sessionStorage.clear();

      // 로그아웃 플래그만 다시 설정 (위에서 clear로 삭제되었으므로)
      sessionStorage.setItem('forceLogout', 'true');

      // 메모리 상태 초기화
      setUser(null);
      setIsLoading(false);

      console.log('AuthContext - 명시적 로그아웃: 모든 데이터 완전 제거');
      return true;
    } catch (error) {
      console.error('AuthContext - clearUserData 오류:', error);
      return false;
    }
  }, []);

  // 로그인 함수 (개선됨)
  const login = async (userId: string, password: string): Promise<boolean> => {
    console.log('🔥 AuthContext - 로그인 함수 시작');

    try {
      console.log('🔥 AuthContext - try 블록 진입');
      console.log('AuthContext - 로그인 시도:', userId);
      setIsLoading(true);

      // URL 확인을 위한 추가 로깅
      console.log('🔥 getApiUrl 호출 전');
      const apiUrl = getApiUrl();
      console.log('🔥 getApiUrl 호출 후:', apiUrl);

      const fullUrl = `${apiUrl}/api/auth/login`;
      console.log('🔥 fullUrl 생성:', fullUrl);

      console.log('🔍 AuthContext - API 요청 시작');
      console.log('🔍 getApiUrl() 결과:', apiUrl);
      console.log('🔍 전체 요청 URL:', fullUrl);
      console.log('🔍 요청 데이터:', { username: userId, password: '[숨김]' });
      console.log('🔍 현재 환경:', {
        NODE_ENV: process.env.NODE_ENV,
        IS_DEVELOPMENT,
        window_location: window.location.href
      });

      // API 접근성 사전 테스트
      console.log('🏓 API 접근성 사전 테스트 시작');
      try {
        const pingResponse = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          mode: 'cors'
        });
        console.log('🏓 Health check 결과:', {
          status: pingResponse.status,
          ok: pingResponse.ok,
          statusText: pingResponse.statusText
        });
        if (pingResponse.ok) {
          const healthData = await pingResponse.json();
          console.log('🏓 Health check 데이터:', healthData);
        }
      } catch (pingError: any) {
        console.error('🚨 API 접근성 사전 테스트 실패:', {
          error: pingError,
          name: pingError?.name,
          message: pingError?.message
        });
        // 핑 테스트 실패해도 로그인 시도는 계속 진행
      }

      // fetch 요청 전에 URL 테스트
      console.log('🔍 fetch 요청 직전 - URL 재확인:', fullUrl);
      console.log('🔥 fetch 호출 직전');

      // 추가 환경 정보 로깅
      console.log('🌍 Browser 환경 정보:', {
        userAgent: navigator.userAgent,
        currentOrigin: window.location.origin,
        targetUrl: fullUrl,
        isSecureContext: window.isSecureContext,
        onlineStatus: navigator.onLine
      });

      // fetch 요청 설정 로깅
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: userId,
          password: password,
        }),
      };

      console.log('🔍 fetch 옵션:', fetchOptions);
      console.log('🔍 body 내용:', fetchOptions.body.toString());

      // fetch를 AbortController와 함께 실행하여 타임아웃 제어
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ fetch 타임아웃 (10초)');
        controller.abort();
      }, 10000);

      let response: Response;
      try {
        response = await fetch(fullUrl, {
          ...fetchOptions,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log('✅ fetch 성공!');
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error('🚨 fetch 에러 상세:', {
          error: fetchError,
          name: fetchError?.name,
          message: fetchError?.message,
          stack: fetchError?.stack,
          isAbortError: fetchError?.name === 'AbortError',
          isNetworkError: fetchError?.message?.includes('fetch'),
          timestamp: new Date().toISOString()
        });
        throw fetchError;
      }

      console.log('🔥 fetch 호출 완료');
      console.log('🔍 AuthContext - 응답 상태:', response.status, response.statusText);
      console.log('🔍 AuthContext - 응답 헤더:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('🔍 AuthContext - 응답 데이터 원본:', data);

      // 🆕 응답 구조 검증 강화
      console.log('🔍 AuthContext - 응답 구조 분석:', {
        responseOk: response.ok,
        hasUser: !!data.user,
        hasToken: !!data.access_token,
        userType: typeof data.user,
        tokenType: typeof data.access_token,
        dataKeys: Object.keys(data),
        userKeys: data.user ? Object.keys(data.user) : null
      });

      if (response.ok && data.user && data.access_token) {
        console.log('🎯 AuthContext - 백엔드 로그인 응답 전체:', data);
        console.log('🎯 AuthContext - 사용자 데이터 상세:', data.user);

        // 🆕 사용자 데이터 구조 검증
        if (!data.user.id || !data.user.name || !data.user.role) {
          console.error('❌ 사용자 데이터에 필수 필드가 없음:', {
            hasId: !!data.user.id,
            hasName: !!data.user.name,
            hasRole: !!data.user.role,
            userData: data.user
          });
          return false;
        }

        // 토큰 검증 강화
        if (!data.access_token || typeof data.access_token !== 'string') {
          console.error('❌ 로그인 응답에 유효한 토큰이 없음:', {
            access_token: data.access_token,
            tokenType: typeof data.access_token
          });
          return false;
        }

        // JWT 토큰 형식 검증
        const tokenParts = data.access_token.split('.');
        if (tokenParts.length !== 3) {
          console.error('❌ 잘못된 JWT 토큰 형식:', {
            tokenLength: data.access_token.length,
            segments: tokenParts.length,
            tokenStart: data.access_token.substring(0, 30)
          });
          return false;
        }

        console.log('✅ 유효한 JWT 토큰 확인:', {
          tokenLength: data.access_token.length,
          segments: tokenParts.length,
          tokenStart: data.access_token.substring(0, 20) + '...'
        });

        // 🆕 프로그램 권한 정보 검증
        console.log('🔍 AuthContext - 프로그램 권한 정보 확인:', {
          hasProgramPermissions: !!data.user.programPermissions,
          programPermissionsType: typeof data.user.programPermissions,
          programPermissionsValue: data.user.programPermissions
        });

        // 백엔드 응답을 표준 AuthUser 형식으로 변환
        const authUser: AuthUser = {
          id: data.user.id,
          userId: data.user.id,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone || "010-0000-0000",
          role: data.user.role,
          balance: data.user.balance,
          is_active: data.user.is_active,
          created_at: data.user.created_at,
          last_login_at: data.user.last_login_at,
          token: data.access_token,
          programPermissions: data.user.programPermissions || {
            free: false,
            month1: false,
            month3: false
          }
        };

        console.log('🎯 AuthContext - 변환된 사용자 데이터 상세:', {
          originalRole: data.user.role,
          finalRole: authUser.role,
          isActive: authUser.is_active,
          userId: authUser.id, // 🆕 user.id 사용으로 통일
          name: authUser.name,
          email: authUser.email,
          balance: authUser.balance,
          programPermissions: authUser.programPermissions,
          fullUserData: authUser
        });

        // 🚨 역할 검증 로그
        console.log('🚨 AuthContext - 역할 검증:', {
          backendRole: data.user.role,
          frontendRole: authUser.role,
          isAdmin: authUser.role === 'admin',
          roleType: typeof authUser.role,
          roleLength: authUser.role?.length
        });

        console.log('🔍 AuthContext - saveUserData 호출 전');
        const saveResult = saveUserData(authUser);
        console.log('🔍 AuthContext - saveUserData 결과:', saveResult);

        if (saveResult) {
          console.log('🎉 AuthContext - 로그인 완료, 저장된 사용자:', {
            userId: authUser.id, // 🆕 user.id 사용으로 통일
            name: authUser.name,
            role: authUser.role,
            isAdmin: authUser.role === 'admin',
            balance: authUser.balance
          });

          // 🕐 로그인 시간 저장 (세션 관리용)
          localStorage.setItem('LOGIN_TIME', Date.now().toString());

          return true;
        } else {
          console.error('❌ AuthContext - 사용자 데이터 저장 실패');
          return false;
        }
      } else {
        // 🆕 실패 응답 구조 상세 분석
        console.error('❌ AuthContext - 로그인 실패 (응답 구조 문제):', {
          responseOk: response.ok,
          responseStatus: response.status,
          responseStatusText: response.statusText,
          hasUser: !!data.user,
          hasToken: !!data.access_token,
          dataKeys: Object.keys(data),
          data: data,
          errorDetail: data.detail || data.message || '알 수 없는 오류'
        });

        // 🆕 HTTP 상태 코드별 오류 메시지
        if (response.status === 401) {
          console.error('❌ 인증 실패: 이메일 또는 비밀번호가 올바르지 않습니다');
        } else if (response.status === 400) {
          console.error('❌ 요청 오류:', data.detail || data.message);
        } else if (response.status === 500) {
          console.error('❌ 서버 오류:', data.detail || data.message);
        } else {
          console.error('❌ 예상치 못한 오류:', response.status, data);
        }

        return false;
      }
    } catch (error) {
      console.error('❌ AuthContext - 로그인 중 오류 상세:', {
        error,
        errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      return false;
    } finally {
      console.log('🔍 AuthContext - 로그인 함수 완료, isLoading false 설정');
      setIsLoading(false);
    }
  };

  // 로그아웃 함수 (개선됨)
  const logout = async () => {
    try {
      console.log('AuthContext - 로그아웃 시작');

      // 사용자 데이터 완전 제거
      clearUserData();

      console.log('AuthContext - 로그아웃 완료');
    } catch (error) {
      console.error('AuthContext - 로그아웃 중 오류:', error);
    }
  };

  // 회원가입 함수 (개선됨)
  const signup = async (userData: {
    userId: string;
    name: string;
    email?: string;
    password: string;
    confirmPassword: string;
    phone?: string;
  }): Promise<boolean> => {
    try {
      console.log('AuthContext - 회원가입 시도:', userData.userId);
      setIsLoading(true);

      if (userData.password !== userData.confirmPassword) {
        console.error('AuthContext - 비밀번호 불일치');
        return false;
      }

      const response = await fetch(`${getApiUrl()}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.userId,
          name: userData.name,
          email: userData.email || `${userData.userId}@example.com`,
          password: userData.password,
          phone: userData.phone || '010-0000-0000',
        }),
      });

      const data = await response.json();

      if (response.ok && data.user && data.access_token) {
        console.log('AuthContext - 회원가입 성공:', data.user);

        // 토큰 검증 강화
        if (!data.access_token || typeof data.access_token !== 'string') {
          console.error('❌ 회원가입 응답에 유효한 토큰이 없음:', {
            access_token: data.access_token,
            tokenType: typeof data.access_token
          });
          return false;
        }

        // JWT 토큰 형식 검증
        const tokenParts = data.access_token.split('.');
        if (tokenParts.length !== 3) {
          console.error('❌ 회원가입 - 잘못된 JWT 토큰 형식:', {
            tokenLength: data.access_token.length,
            segments: tokenParts.length,
            tokenStart: data.access_token.substring(0, 30)
          });
          return false;
        }

        console.log('✅ 회원가입 - 유효한 JWT 토큰 확인:', {
          tokenLength: data.access_token.length,
          segments: tokenParts.length,
          tokenStart: data.access_token.substring(0, 20) + '...'
        });

        // 백엔드 응답을 표준 AuthUser 형식으로 변환
        const authUser: AuthUser = {
          id: data.user.id,
          userId: data.user.id,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone || '010-0000-0000',
          role: data.user.role || 'user', // role이 없으면 기본값 'user'로 설정
          balance: data.user.balance || 0,
          is_active: data.user.is_active !== false, // 명시적으로 false가 아니면 true
          created_at: data.user.created_at,
          last_login_at: data.user.last_login_at,
          token: data.access_token,
          programPermissions: data.user.programPermissions || {
            free: false,
            month1: false,
            month3: false
          }
        };

        console.log('AuthContext - 회원가입 변환된 사용자 데이터:', {
          originalRole: data.user.role,
          finalRole: authUser.role,
          isActive: authUser.is_active,
          userId: authUser.id, // 🆕 user.id 사용으로 통일
          programPermissions: authUser.programPermissions
        });

        if (saveUserData(authUser)) {
          console.log('AuthContext - 회원가입 완료');
          return true;
        } else {
          console.error('AuthContext - 사용자 데이터 저장 실패');
          return false;
        }
      } else {
        console.error('AuthContext - 회원가입 실패:', data);
        return false;
      }
    } catch (error) {
      console.error('AuthContext - 회원가입 중 오류:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 🚫 개발용 관리자 강제 로그인 - 완전 비활성화
  const forceAdminLogin = (): boolean => {
    console.log('🚫 AuthContext - forceAdminLogin 호출됨 (비활성화)');
    return false; // 항상 false 반환하여 자동 로그인 방지
  };

  // 디버그 함수
  const debugAuthState = () => {
    console.log('=== AuthContext 디버그 정보 ===');
    console.log('현재 사용자:', user);
    console.log('인증 상태:', !!user);
    console.log('로딩 상태:', isLoading);
    console.log('localStorage USER_DATA:', localStorage.getItem(STORAGE_KEYS.USER_DATA));
    console.log('sessionStorage forceLogout:', sessionStorage.getItem('forceLogout'));
    console.log('==============================');
  };

  // 강제 초기화 함수 (개발/디버깅 전용)
  const forceReset = () => {
    console.log('🧹 AuthContext - 강제 초기화 시작 (개발 전용)');
    sessionStorage.setItem('forceInit', 'true');
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('forceInit', 'true'); // clear 후 다시 설정
    setUser(null);
    setIsLoading(false);
    console.log('🧹 AuthContext - 강제 초기화 완료 (개발 전용)');
  };

  // 예치금 새로고침 함수 (localStorage 제거 버전)
  const refreshBalance = async () => {
    try {
      if (!user?.token) {
        console.error('AuthContext - 토큰이 없어서 예치금 새로고침 불가');
        return false;
      }

      console.log('💰 AuthContext - 예치금 새로고침 시작');

      const response = await fetch(`${getApiUrl()}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('💰 AuthContext - 예치금 새로고침 응답:', data);

        // 🚫 localStorage 사용 금지: 메모리만 업데이트 (DB 기반)
        const updatedUser = {
          ...user,
          balance: data.balance,
          role: data.role // role도 함께 새로고침하여 정확성 보장
        };
        setUser(updatedUser);

        console.log('✅ AuthContext - 예치금 새로고침 완료:', {
          balance: data.balance,
          role: data.role,
          userId: data.userId
        });
        return true;
      } else {
        console.error('❌ AuthContext - 예치금 새로고침 실패:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ AuthContext - 예치금 새로고침 오류:', error);
      return false;
    }
  };

  // 💰 예치금 업데이트 함수 (새로운 단순 버전 - role 강력 보존)
  const updateBalance = useCallback(async (user: AuthUser, newBalance: number) => {
    try {
      console.log('💰 AuthContext - 예치금 업데이트 시작:', {
        userId: user.id,
        oldBalance: user.balance,
        newBalance,
        currentRole: user.role,
        source: 'direct_update'
      });

      // 🔒 중요: role 정보 절대 보존 - 예치금 변경이 role에 절대 영향을 주지 않도록
      const updatedUser = {
        ...user,  // 모든 기존 정보 유지
        balance: newBalance,  // 예치금만 업데이트
        // role: user.role 명시적으로 기존 role 보존 (spread로 이미 포함됨)
      };

      // 🔍 role 보존 검증
      if (updatedUser.role !== user.role) {
        console.error('🚨 AuthContext - role 정보 변경 감지! 이는 예상되지 않은 동작입니다:', {
          originalRole: user.role,
          updatedRole: updatedUser.role
        });
        // role 강제 복원
        updatedUser.role = user.role;
      }

      setUser(updatedUser);

      // 🚫 localStorage 사용 금지: 메모리만 업데이트 (DB 기반)
      // localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

      console.log('✅ AuthContext - 예치금 업데이트 완료:', {
        newBalance,
        preservedRole: updatedUser.role,
        userId: updatedUser.id, // 🆕 user.id 사용으로 통일
        roleCheck: updatedUser.role === 'admin' ? 'ADMIN' : 'USER'
      });
      return true;
    } catch (error) {
      console.error('❌ AuthContext - 예치금 업데이트 오류:', error);
      return false;
    }
  }, []);

  // 💰 큐네임 페이지용 예치금 업데이트 함수 (안정화)
  const updateUserBalance = useCallback(async (newBalance: number) => {
    try {
      console.log('💰 updateUserBalance 함수 호출됨:', {
        newBalance,
        hasUser: !!user,
        userId: user?.id,
        currentBalance: user?.balance,
        timestamp: new Date().toISOString()
      });

      // 🆕 호출 스택 추적
      const stack = new Error().stack;
      console.log('💰 updateUserBalance 호출 스택:', stack);

      // 🆕 강력한 유효성 검사
      if (!user) {
        console.error('❌ 사용자가 로그인되지 않음');
        return false;
      }

      if (typeof newBalance !== 'number' || isNaN(newBalance)) {
        console.error('❌ 잘못된 예치금 값:', newBalance);
        return false;
      }

      if (newBalance < 0) {
        console.error('❌ 음수 예치금은 허용되지 않음:', newBalance);
        return false;
      }

      console.log('💰 단순한 예치금 업데이트:', {
        oldBalance: user.balance,
        newBalance,
        userId: user.id
      });

      // 🆕 단순한 사용자 정보 업데이트
      const updatedUser = {
        ...user,
        balance: newBalance
      };

      setUser(updatedUser);

      console.log('✅ 예치금 업데이트 완료:', newBalance);
      return true;
    } catch (error) {
      console.error('❌ 예치금 업데이트 오류:', error);
      console.error('❌ 오류 스택:', error instanceof Error ? error.stack : '스택 없음');
      return false;
    }
  }, [user]); // user 의존성 유지

  // 🔄 사용자 정보 완전 새로고침 (프로그램 권한 포함)
  const refreshUserData = useCallback(async () => {
    // 🚫 완전 비활성화: 사용자 정보 새로고침 기능 차단 (토큰 검증 방지)
    console.log('🚫 AuthContext - 사용자 정보 새로고침 기능 완전 차단 (토큰 검증 방지)');
    return false;
  }, []);

  // 관리자 권한 체크 함수
  const isUserAdmin = (user: AuthUser | null): boolean => {
    return user?.role === 'admin';
  };

  // 프로그램 권한 조회 함수 (단순화된 버전)
  const fetchProgramPermissions = useCallback(async (): Promise<{ free: boolean; month1: boolean; month3: boolean } | null> => {
    // 호출 스택 추적을 위한 로그
    const stack = new Error().stack;
    const stackLines = stack?.split('\n').slice(1, 10) || [];

    console.log('🔄 AuthContext - fetchProgramPermissions 호출됨', {
      timestamp: new Date().toISOString(),
      userExists: !!user,
      hasPermissions: !!user?.programPermissions,
      stack: stackLines.join('\n'), // 호출 스택의 처음 10줄
      caller: stackLines[0]?.trim() || 'unknown'
    });

    // 🚫 이미 권한 정보가 있으면 API 호출하지 않음 (캐싱)
    if (user?.programPermissions) {
      console.log('🔄 AuthContext - 기존 권한 정보 사용 (캐싱):', user.programPermissions);
      return user.programPermissions;
    }

    // 🚫 토큰이 없으면 기본값 반환 (API 호출 방지)
    if (!user?.token) {
      console.log('🔄 AuthContext - 토큰 없음, 기본 권한 반환');
      return {
        free: false,
        month1: false,
        month3: false
      };
    }

    // 🚫 이미 권한 조회 중이면 중복 호출 방지
    const isFetching = sessionStorage.getItem('FETCHING_PERMISSIONS');
    if (isFetching === 'true') {
      console.log('🔄 AuthContext - 권한 조회 중, 중복 호출 방지');
      return null;
    }

    try {
      console.log('🔄 AuthContext - 프로그램 권한 조회 시작 (1회성)');
      sessionStorage.setItem('FETCHING_PERMISSIONS', 'true');

      const response = await fetch(`${getApiUrl()}/api/auth/program-permissions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('❌ AuthContext - 프로그램 권한 조회 실패:', response.status);
        return null;
      }

      const data = await response.json();

      if (data.success && data.programPermissions) {
        console.log('✅ AuthContext - 프로그램 권한 조회 성공:', data.programPermissions);

        // 사용자 정보 업데이트 (1회성)
        if (user) {
          const updatedUser = {
            ...user,
            programPermissions: data.programPermissions
          };
          setUser(updatedUser);
        }

        return data.programPermissions;
      }

      return null;
    } catch (error) {
      console.error('❌ AuthContext - 프로그램 권한 조회 오류:', error);
      return null;
    } finally {
      sessionStorage.removeItem('FETCHING_PERMISSIONS');
    }
  }, [user?.programPermissions, user?.token, user]);

  // 프로그램 권한 관리 함수 (단순화된 버전)
  const updateProgramPermissions = useCallback(async (permissions: { free: boolean; month1: boolean; month3: boolean }) => {
    try {
      if (!user?.token) {
        console.error('AuthContext - 토큰이 없어서 프로그램 권한 업데이트 불가');
        return false;
      }

      console.log('🔄 AuthContext - 프로그램 권한 업데이트 시작 (1회성)');

      const response = await fetch(`${getApiUrl()}/api/auth/update-program-permissions-bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ AuthContext - 프로그램 권한 업데이트 완료:', data);

        // 사용자 정보 업데이트 (1회성)
        const updatedUser = {
          ...user,
          programPermissions: permissions,
          token: user.token,
        };

        setUser(updatedUser);

        // 🚫 이벤트 발생 완전 제거 - 새로고침 방지
        // window.dispatchEvent(new CustomEvent('programPermissionChanged', {
        //   detail: {
        //     userId: user.id,
        //     permissions,
        //     timestamp: new Date().toISOString(),
        //     type: 'simple_update'
        //   }
        // }));

        return true;
      } else {
        console.error('❌ AuthContext - 프로그램 권한 업데이트 실패:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ AuthContext - 프로그램 권한 업데이트 오류:', error);
      return false;
    }
  }, [user]);

  // user.token이 잘못된 형식이거나 만료되면 자동 로그아웃 - 단순화된 버전
  useEffect(() => {
    if (user && user.token) {
      // 🚫 JWT 토큰 검증을 완전히 비활성화 - 세션 기반으로 변경
      // 로그인 시에만 토큰을 검증하고, 이후에는 세션 상태만 확인

      // 세션 타임아웃 체크 (7일) - 더 관대하게 설정
      const sessionTimeout = 30 * 24 * 60 * 60 * 1000; // 30일로 연장
      const loginTime = localStorage.getItem('LOGIN_TIME');

      if (loginTime) {
        const loginTimestamp = parseInt(loginTime);
        const currentTime = Date.now();

        if (currentTime - loginTimestamp > sessionTimeout) {
          console.log('🔍 AuthContext - 세션 만료, 자동 로그아웃');
          logout();
          return;
        }
      }

      console.log('✅ AuthContext - 세션 유지 (토큰 검증 완전 생략)');
    }
  }, [user]);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
    forceAdminLogin,
    debugAuthState,
    isUserAdmin,
    forceReset,
    refreshBalance,
    updateBalance, // 새로운 단순 예치금 업데이트 함수 추가
    updateUserBalance, // 큐네임 페이지용 예치금 업데이트 함수 추가
    refreshUserData, // 사용자 정보 완전 새로고침 함수 추가
    fetchProgramPermissions, // 프로그램 권한 조회 함수 추가
    updateProgramPermissions, // 프로그램 권한 관리 함수 추가
  };

  // 🔍 Context 값 변경 시마다 로그 출력 (무한 루프 방지)
  useEffect(() => {
    console.log('🔄 AuthContext - contextValue 변경:', {
      userId: user?.userId || user?.id,
      isAuthenticated: !!user,
      isLoading,
      timestamp: new Date().toISOString()
    });

    // 🆕 window 객체에 사용자 정보 노출 (디버깅용)
    if (user) {
      (window as any).authUser = user;
      console.log('🆕 window.authUser 설정됨:', user);
    } else {
      (window as any).authUser = null;
      console.log('🆕 window.authUser 제거됨');
    }
  }, [user?.userId, user?.id, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
