// authHelpers.ts
// 인증 관련 헬퍼 함수 모음

import { STORAGE_KEYS } from '../config/constants';

interface User {
  id: string;       // 시스템 내부 ID
  userId: string;   // 사용자 로그인 ID (필수, 고유값)
  email?: string;   // 이메일 (선택사항)
  name: string;     // 실명
  role: 'admin' | 'user';
  balance: number;
}

// localStorage에서 사용자 정보 가져오기
export const getUserFromStorage = (): User | null => {
  try {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!savedUser) return null;
    
    const parsedUser = JSON.parse(savedUser);
    return validateUserData(parsedUser) ? parsedUser : null;
  } catch (error) {
    console.error('사용자 정보 파싱 실패:', error);
    return null;
  }
};

// 사용자 데이터가 올바른 형식인지 검증
export const validateUserData = (userData: any): boolean => {
  return (
    userData &&
    typeof userData === 'object' &&
    typeof userData.id === 'string' &&
    typeof userData.userId === 'string' &&
    typeof userData.name === 'string' &&
    (userData.role === 'admin' || userData.role === 'user') &&
    typeof userData.balance === 'number'
  );
};

// 사용자 인증 여부 확인
export const isUserAuthenticated = (): boolean => {
  return !!getUserFromStorage();
};

// 사용자가 관리자인지 확인
export const isUserAdmin = (): boolean => {
  const user = getUserFromStorage();
  return !!user && user.role === 'admin';
};

// 인증 토큰 가져오기
export const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};
