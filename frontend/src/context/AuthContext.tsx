/**
 * 🔥 중요: 로그인 무한반복 문제 해결 기록 🔥
 * 
 * 문제: 로그아웃 후 재로그인 시 무한반복 발생
 * 원인: localStorage의 사용자 데이터가 완전히 제거되지 않아서 발생
 * 
 * 해결책: clearUserData 함수에서 모든 관련 localStorage 데이터를 완전히 제거
 * - localStorage.removeItem('mockUsers') 추가
 * - localStorage.removeItem('USER_DATA') 추가  
 * - localStorage.removeItem('currentUser') 추가
 * - localStorage.removeItem('authUser') 추가
 * - setIsLoading(false) 추가로 로딩 상태 초기화
 * 
 * ⚠️ 주의: 이 수정사항을 변경하지 마세요! 로그인 무한반복 문제가 다시 발생할 수 있습니다.
 * 
 * 작성일: 2024년 12월
 * 문제 해결자: AI Assistant
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { MOCK_ADMIN_USER, MOCK_TEST_USER } from '../utils/mockData';
import { STORAGE_KEYS } from '../config/constants';
import { validateUserData } from '../utils/authHelpers';
import { getMockUsers } from '../utils/mockUsers';
import { AuthUser, convertToAuthUser, convertFromAuthUser } from '../types/user';

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
  }) => Promise<boolean>;
  // 개발용 디버그 함수들
  forceAdminLogin?: () => boolean;
  debugAuthState?: () => void;
  // 관리자 권한 체크 함수
  isUserAdmin?: (user: AuthUser | null) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 🛡️ 무한루프 재발 방지: 초기화 횟수 제한
  const initCountRef = React.useRef(0);
  const MAX_INIT_ATTEMPTS = 3;

  // 초기화 플래그를 사용하여 한 번만 실행
  useEffect(() => {
    if (isInitialized) return;
    
    // 🚨 무한루프 방지: 초기화 횟수 체크
    initCountRef.current += 1;
    if (initCountRef.current > MAX_INIT_ATTEMPTS) {
      console.error('🚨 AuthContext - 초기화 횟수 초과, 강제 중단');
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }

    const initializeAuth = () => {
      try {
        console.log('AuthContext - 초기화 시작');

        // 로그아웃 플래그 확인
        const logoutFlag = sessionStorage.getItem('forceLogout');
        if (logoutFlag === 'true') {
          console.log('AuthContext - 강제 로그아웃 플래그 감지, 초기화 생략');
          sessionStorage.removeItem('forceLogout');
          setUser(null);
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        const savedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);

        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            console.log('AuthContext - 저장된 사용자 데이터:', parsedUser);

            // 유효성 검사
            if (
              parsedUser &&
              typeof parsedUser === 'object' &&
              parsedUser.userId &&
              parsedUser.name &&
              (parsedUser.role === 'admin' || parsedUser.role === 'user')
            ) {
              console.log('AuthContext - 유효한 사용자 데이터 설정');
              setUser(parsedUser);
            } else {
              console.log('AuthContext - 유효하지 않은 사용자 데이터, 초기화');
              setUser(null);
            }
          } catch (parseError) {
            console.error('AuthContext - JSON 파싱 오류:', parseError);
            setUser(null);
          }
        } else {
          console.log('AuthContext - 저장된 사용자 데이터 없음');
          setUser(null);
        }
      } catch (error) {
        console.error('AuthContext - 초기화 중 오류:', error);
        setUser(null);
      } finally {
        console.log('AuthContext - 초기화 완료');
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    // 즉시 실행
    initializeAuth();
  }, [isInitialized]);

  // 🔄 안전한 예치금 실시간 업데이트 - CMS 연동
  useEffect(() => {
    if (!isInitialized) return;

    const handleBalanceChanged = (event: CustomEvent) => {
      try {
        const { userId, newBalance, source, timestamp } = event.detail;
        
        // 현재 로그인한 사용자의 예치금만 업데이트
        if (user && user.id === userId && typeof newBalance === 'number') {
          console.log(`💰 AuthContext - 예치금 실시간 업데이트: ${source}에서 ${newBalance}원으로 변경`);
          
          // 사용자 데이터 업데이트 (무한루프 방지)
          const updatedUser = { ...user, balance: newBalance };
          
          // localStorage 업데이트
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          
          // 상태 업데이트
          setUser(updatedUser);
          
          console.log('✅ AuthContext - 예치금 업데이트 완료');
        }
      } catch (error) {
        console.error('❌ AuthContext - 예치금 업데이트 오류:', error);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('balanceChanged', handleBalanceChanged as EventListener);
    
    console.log('🔔 AuthContext - balanceChanged 이벤트 리스너 등록');

    // 정리 함수
    return () => {
      window.removeEventListener('balanceChanged', handleBalanceChanged as EventListener);
      console.log('🧹 AuthContext - balanceChanged 이벤트 리스너 제거');
    };
  }, [user, isInitialized]); // user와 isInitialized에 의존

  // 사용자 데이터 저장 함수 (단순화)
  const saveUserData = useCallback((userData: AuthUser) => {
    try {
      console.log('AuthContext - saveUserData 호출:', userData);

      if (
        userData &&
        typeof userData === 'object' &&
        userData.userId &&
        userData.name &&
        (userData.role === 'admin' || userData.role === 'user')
      ) {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        setUser(userData);
        console.log('AuthContext - 사용자 데이터 저장 완료');
        return true;
      } else {
        console.error('AuthContext - 유효하지 않은 사용자 데이터:', userData);
        return false;
      }
    } catch (error) {
      console.error('AuthContext - saveUserData 오류:', error);
      return false;
    }
  }, []);

  // 사용자 데이터 제거 함수 (단순화)
  const clearUserData = useCallback(() => {
    try {
      console.log('AuthContext - clearUserData 호출');

      // 강제 로그아웃 플래그 설정
      sessionStorage.setItem('forceLogout', 'true');

      // localStorage 완전 삭제
      localStorage.clear();
      sessionStorage.clear();

      // 상태 초기화
      setUser(null);

      console.log('AuthContext - 사용자 데이터 완전 제거 완료');
    } catch (error) {
      console.error('AuthContext - clearUserData 오류:', error);
    }
  }, []);

  // 단순화된 로그인 함수
  const login = async (userId: string, password: string): Promise<boolean> => {
    console.log('AuthContext - 로그인 시도:', {
      userId,
      password,
      userIdType: typeof userId,
      passwordType: typeof password,
      userIdLength: userId?.length,
      passwordLength: password?.length
    });
    setIsLoading(true);

    try {
      const mockUsers = getMockUsers();
      console.log('AuthContext - 사용 가능한 mock 사용자들:', mockUsers.map(u => ({ id: u.id, password: u.password })));

      const foundUser = mockUsers.find(user => {
        const idMatch = user.id === userId;
        const passwordMatch = user.password === password;
        console.log(`AuthContext - 사용자 확인: ${user.id} (id일치: ${idMatch}, pw일치: ${passwordMatch})`);
        return idMatch && passwordMatch;
      });

      if (foundUser) {
        console.log('AuthContext - 사용자 찾음:', foundUser);
        const userData: AuthUser = convertToAuthUser(foundUser);

        console.log('AuthContext - 변환된 사용자 데이터:', userData);

        // 사용자 데이터 저장
        const saveResult = saveUserData(userData);

        if (saveResult) {
          console.log('AuthContext - 로그인 성공');
          setIsLoading(false);
          return true;
        } else {
          console.error('AuthContext - 사용자 데이터 저장 실패');
          setIsLoading(false);
          return false;
        }
      } else {
        console.log('AuthContext - 사용자를 찾을 수 없음. 입력값:', { userId, password });
        console.log('AuthContext - 비교 대상:', mockUsers.map(u => ({ id: u.id, password: u.password })));
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('AuthContext - 로그인 중 오류:', error);
      setIsLoading(false);
      return false;
    }
  };

  // 단순화된 로그아웃 함수
  const logout = async () => {
    console.log('AuthContext - 로그아웃 시작');
    setIsLoading(true);

    try {
      clearUserData();
      console.log('AuthContext - 로그아웃 완료');
    } catch (error) {
      console.error('AuthContext - 로그아웃 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입 함수
  const signup = async (userData: {
    userId: string;
    name: string;
    email?: string;
    password: string;
    confirmPassword: string;
  }): Promise<boolean> => {
    setIsLoading(true);
    if (userData.userId === 'admin') {
      setIsLoading(false);
      return false;
    }
    const normalUser: AuthUser = {
      id: '2',
      userId: userData.userId,
      email: userData.email || 'user@qclick.com',
      name: userData.name,
      role: 'user',
      balance: 50000
    };
    saveUserData(normalUser);
    setIsLoading(false);
    return true;
  };

  // 개발용 디버그 함수들
  const forceAdminLogin = (): boolean => {
    const adminUser: AuthUser = {
      id: 'admin',
      userId: 'admin',
      email: 'admin@qclick.com',
      name: '관리자',
      role: 'admin',
      balance: 100000
    };
    saveUserData(adminUser);
    return true;
  };

  const debugAuthState = () => {
    // 디버그 정보는 개발 환경에서만 필요시 활성화
  };

  // 관리자 권한 체크 함수 추가
  const isUserAdmin = useCallback((user: AuthUser | null): boolean => {
    if (!user) {
      console.log('AuthContext - isUserAdmin: 사용자 없음');
      return false;
    }

    const isAdmin = user.role === 'admin';
    console.log('AuthContext - isUserAdmin:', {
      userId: user.userId,
      role: user.role,
      isAdmin
    });

    return isAdmin;
  }, []);

  // 값에 isUserAdmin 함수 추가
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
    forceAdminLogin,
    debugAuthState,
    isUserAdmin
  };

  // 디버깅을 위한 상태 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('AuthContext - 현재 상태:', {
      user: user ? { userId: user.userId, role: user.role, id: user.id } : null,
      isAuthenticated: !!user,
      isLoading,
      isInitialized
    });
  }

  // 🛡️ 무한루프 재발 방지: 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      console.log('AuthContext - 컴포넌트 언마운트');
      initCountRef.current = 0;
    };
  }, []);

  // 🛡️ 무한루프 재발 방지: 10초 타이머로 강제 초기화 완료
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!isInitialized) {
        console.warn('🚨 AuthContext - 10초 타임아웃, 강제 초기화 완료');
        setIsLoading(false);
        setIsInitialized(true);
      }
    }, 10000);

    return () => clearTimeout(safetyTimer);
  }, [isInitialized]);

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