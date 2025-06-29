// Mock data utilities for development and testing
// 개발 및 테스트용 더미 데이터 유틸리티

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  balance: number;
  created_at: string;
}

export interface MockAdminUser {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  balance: number;
}

// 관리자 계정 정보 (mockUsers.ts와 일치)
export const MOCK_ADMIN_USER: MockAdminUser = {
  id: 'admin',
  userId: 'admin',
  email: 'admin@qclick.com',
  name: '관리자',
  role: 'admin',
  balance: 100000
};

// 일반 사용자 계정 정보 (mockUsers.ts와 일치)
export const MOCK_TEST_USER: MockAdminUser = {
  id: 'user',
  userId: 'user',
  email: 'user@example.com',
  name: '일반사용자',
  role: 'user',
  balance: 50000
};

// 사용자 관리 페이지용 더미 데이터 (mockUsers.ts와 일치하는 4명)
export const getMockUsers = (): MockUser[] => [
  {
    id: 'admin',
    email: 'admin@qclick.com',
    name: '관리자',
    role: 'admin',
    is_active: true,
    balance: 100000,
    created_at: '2023-01-01'
  },
  {
    id: 'user',
    email: 'user@example.com',
    name: '일반사용자',
    role: 'user',
    is_active: true,
    balance: 50000,
    created_at: '2023-02-01'
  },
  {
    id: 'user2',
    email: 'kim@example.com',
    name: '김철수',
    role: 'user',
    is_active: true,
    balance: 75000,
    created_at: '2023-03-01'
  },
  {
    id: 'user3',
    email: 'lee@example.com',
    name: '이영희',
    role: 'user',
    is_active: true,
    balance: 120000,
    created_at: '2023-04-01'
  }
];

// API 연결 실패 시 사용할 fallback 데이터
export const getFallbackUsers = (): MockUser[] => getMockUsers();
