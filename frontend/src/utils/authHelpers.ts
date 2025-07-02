// authHelpers.ts
// 인증 관련 헬퍼 함수 모음 - localStorage 완전 비활성화

import { STORAGE_KEYS } from '../config/constants';

interface User {
  id: string;       // 시스템 내부 ID
  userId: string;   // 사용자 로그인 ID (필수, 고유값)
  email?: string;   // 이메일 (선택사항)
  name: string;     // 실명
  role: 'admin' | 'user';
  balance: number;
}

// 🚫 localStorage에서 사용자 정보 가져오기 - 완전 비활성화
export const getUserFromStorage = (): User | null => {
  console.log('🚫 authHelpers - getUserFromStorage 호출됨 (localStorage 사용 금지)');
  return null; // 항상 null 반환하여 자동 로그인 방지
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

// 🚫 사용자 인증 여부 확인 - localStorage 사용 금지
export const isUserAuthenticated = (): boolean => {
  console.log('🚫 authHelpers - isUserAuthenticated 호출됨 (localStorage 사용 금지)');
  return false; // 항상 false 반환하여 자동 로그인 방지
};

// 🚫 사용자가 관리자인지 확인 - localStorage 사용 금지
export const isUserAdmin = (): boolean => {
  console.log('🚫 authHelpers - isUserAdmin 호출됨 (localStorage 사용 금지)');
  return false; // 항상 false 반환하여 자동 로그인 방지
};

// 🚫 인증 토큰 가져오기 - localStorage 사용 금지
export const getAuthToken = (): string | null => {
  console.log('🚫 authHelpers - getAuthToken 호출됨 (localStorage 사용 금지)');
  return null; // 항상 null 반환하여 토큰 기반 자동 로그인 방지
};
