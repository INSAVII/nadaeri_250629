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
  const [isLoading, setIsLoading] = useState(false);
  const initialized = useRef(false);

  // 🛡️ 단순화된 초기화 로직 - 백화면 방지
  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    console.log('🔄 AuthContext - 백화면 방지 초기화 시작');

    const initializeAuth = () => {
      try {
        // 강제 초기화 플래그 확인
        const forceInit = sessionStorage.getItem('forceInit');
        if (forceInit === 'true') {
          console.log('🧹 강제 초기화 플래그 감지, 모든 데이터 삭제');
          sessionStorage.removeItem('forceInit');
          localStorage.clear();
          sessionStorage.clear();
          setUser(null);
          return;
        }

        // 로그아웃 플래그 확인
        const logoutFlag = sessionStorage.getItem('forceLogout');
        if (logoutFlag === 'true') {
          console.log('🚪 강제 로그아웃 플래그 감지');
          sessionStorage.removeItem('forceLogout');
          setUser(null);
          return;
        }

        // localStorage에서 사용자 데이터 복원
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed && parsed.token) {
              console.log('✅ AuthContext - 사용자 데이터 복원 성공');
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
      }
    };

    const timer = setTimeout(initializeAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  // 사용자 데이터 저장 함수
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
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        localStorage.setItem('token', userData.token || '');
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

  // 사용자 데이터 제거 함수
  const clearUserData = useCallback(() => {
    try {
      console.log('AuthContext - clearUserData 호출 (명시적 로그아웃)');
      sessionStorage.setItem('forceLogout', 'true');
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('forceLogout', 'true');
      setUser(null);
      setIsLoading(false);
      console.log('AuthContext - 명시적 로그아웃: 모든 데이터 완전 제거');
      return true;
    } catch (error) {
      console.error('AuthContext - clearUserData 오류:', error);
      return false;
    }
  }, []);

  // 로그인 함수 - 1단계: API 비활성화
  const login = async (userId: string, password: string): Promise<boolean> => {
    console.log('🔥 AuthContext - 로그인 함수 시작 (API 비활성화 모드)');
    console.log('🚫 API 연결 비활성화 - 기본 UI 테스트 모드');
    setIsLoading(false);
    return false; // API 연결 없이 실패 반환
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      console.log('AuthContext - 로그아웃 시작');
      clearUserData();
      console.log('AuthContext - 로그아웃 완료');
    } catch (error) {
      console.error('AuthContext - 로그아웃 중 오류:', error);
    }
  };

  // 회원가입 함수 - 1단계: API 비활성화
  const signup = async (userData: {
    userId: string;
    name: string;
    email?: string;
    password: string;
    confirmPassword: string;
    phone?: string;
  }): Promise<boolean> => {
    console.log('🔥 AuthContext - 회원가입 함수 시작 (API 비활성화 모드)');
    console.log('🚫 API 연결 비활성화 - 기본 UI 테스트 모드');
    setIsLoading(false);
    return false; // API 연결 없이 실패 반환
  };

  // 예치금 업데이트 함수 - 1단계: API 비활성화
  const updateUserBalance = async (newBalance: number): Promise<boolean> => {
    console.log('🔥 AuthContext - 예치금 업데이트 함수 시작 (API 비활성화 모드)');
    console.log('🚫 API 연결 비활성화 - 기본 UI 테스트 모드');
    return false; // API 연결 없이 실패 반환
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
    updateUserBalance,
  };

  return (
    <AuthContext.Provider value={value}>
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
