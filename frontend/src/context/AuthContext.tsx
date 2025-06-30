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
import { STORAGE_KEYS } from '../config/constants';
import { validateUserData } from '../utils/authHelpers';
import { AuthUser, convertToAuthUser, convertFromAuthUser } from '../types/user';
import { getApiUrl } from '../config/constants';

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
  forceAdminLogin?: () => Promise<boolean>;
  debugAuthState?: () => void;
  // 관리자 권한 체크 함수
  isUserAdmin?: (user: AuthUser | null) => boolean;
}

// 실제 API 연동 함수들
const loginAPI = async (userId: string, password: string): Promise<{ user: AuthUser; token: string }> => {
  console.log('AuthContext - 로그인 API 호출:', {
    url: `${getApiUrl()}/api/auth/login`,
    userId,
    password: '[HIDDEN]'
  });

  const response = await fetch(`${getApiUrl()}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, password })
  });

  console.log('AuthContext - 로그인 API 응답 상태:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('AuthContext - 로그인 API 오류:', errorData);
    throw new Error(errorData.detail || '로그인에 실패했습니다');
  }

  const data = await response.json();
  console.log('AuthContext - 로그인 API 성공 응답:', data);

  return {
    user: {
      id: data.user.id,
      userId: data.user.userId,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      balance: data.user.balance,
      token: data.access_token,
      programPermissions: data.user.programPermissions
    },
    token: data.access_token
  };
};

const signupAPI = async (userData: {
  userId: string;
  name: string;
  email?: string;
  password: string;
  confirmPassword: string;
}): Promise<{ user: AuthUser; token: string }> => {
  console.log('AuthContext - 회원가입 API 호출:', {
    url: `${getApiUrl()}/api/auth/signup`,
    userData: { ...userData, password: '[HIDDEN]' }
  });

  const response = await fetch(`${getApiUrl()}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userData.userId,
      name: userData.name,
      email: userData.email,
      password: userData.password
    })
  });

  console.log('AuthContext - 회원가입 API 응답 상태:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('AuthContext - 회원가입 API 오류:', errorData);
    throw new Error(errorData.detail || '회원가입에 실패했습니다');
  }

  const data = await response.json();
  console.log('AuthContext - 회원가입 API 성공 응답:', data);

  return {
    user: {
      id: data.user.id,
      userId: data.user.userId,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      balance: data.user.balance,
      token: data.access_token,
      programPermissions: data.user.programPermissions
    },
    token: data.access_token
  };
};

const getCurrentUserAPI = async (token: string): Promise<AuthUser> => {
  const response = await fetch(`${getApiUrl()}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('사용자 정보를 불러오지 못했습니다');
  }

  const data = await response.json();
  return {
    id: data.id,
    userId: data.userId,
    name: data.name,
    email: data.email,
    role: data.role,
    balance: data.balance,
    token,
    programPermissions: data.programPermissions
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}