// Application constants
// 애플리케이션 상수 정의

// API 관련 상수
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8001',
  ENDPOINTS: {
    USERS: '/api/users/',
    PAYMENTS: '/api/payments',
    AUTH: '/api/auth',
    BALANCE: '/api/payments/balance',
    TRANSACTIONS: '/api/payments/admin/transactions'
  }
} as const;

// 로컬 스토리지 키 상수
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'user',
  REMEMBERED_USER_ID: 'rememberedUserId'
} as const;

// UI 관련 상수
export const UI_CONFIG = {
  CONTAINER_MAX_WIDTH: '1080px',
  DEBOUNCE_DELAY: 500,
  ANIMATION_DURATION: 300
} as const;

// 사용자 역할
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
} as const;

// 기본 잔액
export const DEFAULT_BALANCE = {
  ADMIN: 100000,
  USER: 50000
} as const;

// 관리자 계정 정보 (개발용)
export const ADMIN_ACCOUNT = {
  EMAIL: 'admin@qclick.com',
  USER_ID: 'admin',
  PASSWORD: 'admin',
  NAME: '관리자',
  ROLE: 'admin' as const
} as const;

// 개발용 테스트 계정
export const TEST_ACCOUNTS = {
  ADMIN: {
    userId: 'admin',
    password: 'admin',
    email: 'admin@qclick.com',
    name: '관리자',
    role: 'admin' as const
  },
  USER: {
    userId: 'user',
    password: 'user',
    email: 'user@qservice.com',
    name: '테스트 사용자',
    role: 'user' as const
  }
} as const;
