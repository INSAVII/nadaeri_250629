// Application constants
// 애플리케이션 상수 정의

// 환경 변수 감지
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// API URL 동적 결정 함수
export const getApiUrl = (): string => {
  // 개발 환경 설정
  const isDevelopmentMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const useProductionAPI = true; // 개발 시 true로 변경하면 프로덕션 API 사용

  if (!isDevelopmentMode || useProductionAPI) {
    // 프로덕션 환경 또는 프로덕션 API 강제 사용
    if (window.location.hostname.includes('나대리.kr') ||
      window.location.hostname.includes('xn--h32b11jwwbvvm.kr')) {
      return process.env.REACT_APP_API_URL || 'https://nadaeri250629-production.up.railway.app';
    }
    return process.env.REACT_APP_API_URL || 'https://nadaeri250629-production.up.railway.app';
  }

  // 개발 환경 - 로컬 서버 (아직 구현 안됨)
  console.warn('⚠️ 로컬 백엔드가 실행되지 않았습니다. 로그인이 불가능합니다.');
  console.info('💡 해결방법: constants.ts에서 useProductionAPI = true로 변경하세요.');
  return 'http://localhost:8001';
};

// 🆕 큐네임 서비스 API URL 동적 결정 함수
export const getQNameApiUrl = (): string => {
  try {
    // 개발 환경 설정
    const isDevelopmentMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const useProductionAPI = true; // 개발 시 true로 변경하면 프로덕션 API 사용

    if (!isDevelopmentMode || useProductionAPI) {
      // 프로덕션 환경 또는 프로덕션 API 강제 사용
      // QName 서비스 별도 Railway URL 사용
      return process.env.REACT_APP_QNAME_API_URL || 'https://qname-service-production.up.railway.app';
    }

    // 개발 환경 - 로컬 큐네임 서버
    console.warn('⚠️ 로컬 큐네임 서버가 실행되지 않았습니다.');
    console.info('💡 해결방법: constants.ts에서 useProductionAPI = true로 변경하세요.');
    return 'http://localhost:8004';
  } catch (error) {
    console.error('getQNameApiUrl 오류:', error);
    // 오류 발생 시 메인 API 사용
    return getApiUrl();
  }
};

// 🆕 큐텍스트 서비스 API URL 동적 결정 함수
export const getQTextApiUrl = (): string => {
  try {
    // QText는 메인 API에 통합되어 있음
    return getApiUrl(); // 메인 API와 동일한 서버 사용
    
    // 원래 코드 (QText 서비스 별도 배포 시 사용)
    /*
    // 프로덕션 환경
    if (IS_PRODUCTION && !window.location.hostname.includes('localhost')) {
      // 배포 환경에서는 실제 큐텍스트 서비스 URL 사용
      const envUrl = (window as any).REACT_APP_QTEXT_API_URL || process.env?.REACT_APP_QTEXT_API_URL;
      return envUrl || 'https://qtext.나대리.kr';
    }

    // 개발 환경 - 로컬 큐텍스트 서버
    return 'http://localhost:8003';
    */
  } catch (error) {
    console.error('getQTextApiUrl 오류:', error);
    // 오류 발생 시 메인 API 사용
    return getApiUrl();
  }
};

// API 관련 상수
export const API_CONFIG = {
  get BASE_URL() { return getApiUrl(); },
  ENDPOINTS: {
    USERS: '/api/users/',
    PAYMENTS: '/api/payments',
    AUTH: '/api/auth',
    BALANCE: '/api/payments/balance',
    TRANSACTIONS: '/api/payments/admin/transactions',
    PROGRAMS: '/api/programs',
    DEPOSITS: '/api/deposits'
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

// 테스트 사용자 계정
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

// 서비스 타입
export const SERVICE_TYPES = {
  QNAME: 'qname',
  QTEXT: 'qtext',
  QCAPTURE: 'qcapture'
} as const;

// 프로그램 라이센스 타입
export const LICENSE_TYPES = {
  FREE: 'free',
  MONTH1: 'month1',
  MONTH3: 'month3'
} as const;

// 기본 서비스 가격
export const DEFAULT_PRICES = {
  QNAME: 50,
  QTEXT: 30,
  QCAPTURE: 100
} as const;

// 오류 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  INTERNAL_ERROR: '서버 오류가 발생했습니다.'
} as const;

// 성공 메시지
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '로그인되었습니다.',
  LOGOUT_SUCCESS: '로그아웃되었습니다.',
  UPDATE_SUCCESS: '업데이트되었습니다.',
  DELETE_SUCCESS: '삭제되었습니다.'
} as const;
