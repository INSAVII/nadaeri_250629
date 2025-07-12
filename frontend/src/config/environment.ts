// 🛡️ 환경별 설정 - 디자인 안정성 보장
// 환경변수 기반 설정으로 AuthContext와 분리

export interface EnvConfig {
  API_BASE_URL: string;
  QNAME_API_URL: string;
  QTEXT_API_URL: string;
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
  ENABLE_DEBUG_LOGS: boolean;
  API_ENABLED: boolean; // API 연결 활성화/비활성화 플래그
}

// 환경 감지
const isDevelopment =
  process.env.NODE_ENV === 'development' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const isProduction = process.env.NODE_ENV === 'production';

// 🔧 환경별 설정 객체
const developmentConfig: EnvConfig = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'https://nadaeri250629-production.up.railway.app',
  QNAME_API_URL: process.env.REACT_APP_QNAME_API_URL || 'https://qname-production.up.railway.app',
  QTEXT_API_URL: process.env.REACT_APP_QTEXT_API_URL || 'https://qtext-production.up.railway.app',
  IS_DEVELOPMENT: true,
  IS_PRODUCTION: false,
  ENABLE_DEBUG_LOGS: true,
  API_ENABLED: false, // 1단계: API 비활성화
};

const productionConfig: EnvConfig = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'https://nadaeri250629-production.up.railway.app',
  QNAME_API_URL: process.env.REACT_APP_QNAME_API_URL || 'https://qname-production.up.railway.app',
  QTEXT_API_URL: process.env.REACT_APP_QTEXT_API_URL || 'https://qtext-production.up.railway.app',
  IS_DEVELOPMENT: false,
  IS_PRODUCTION: true,
  ENABLE_DEBUG_LOGS: false,
  API_ENABLED: false, // 1단계: API 비활성화
};

// 🎯 현재 환경 설정 내보내기
export const config: EnvConfig = isDevelopment ? developmentConfig : productionConfig;

// 🔒 AuthContext에서 사용할 안전한 API 함수들
export const authAPI = {
  getBaseUrl: () => config.API_BASE_URL,
  getLoginUrl: () => `${config.API_BASE_URL}/api/auth/login`,
  getLogoutUrl: () => `${config.API_BASE_URL}/api/auth/logout`,
  getProfileUrl: () => `${config.API_BASE_URL}/api/auth/profile`,
  isDebugEnabled: () => config.ENABLE_DEBUG_LOGS,
  isEnabled: () => config.API_ENABLED, // API 활성화 상태 확인
};

// 🌐 서비스별 API 함수들
export const serviceAPI = {
  qname: {
    getBaseUrl: () => config.QNAME_API_URL,
    getProcessUrl: () => `${config.QNAME_API_URL}/api/process`,
    isEnabled: () => config.API_ENABLED,
  },
  qtext: {
    getBaseUrl: () => config.QTEXT_API_URL,
    getProcessUrl: () => `${config.QTEXT_API_URL}/api/process`,
    isEnabled: () => config.API_ENABLED,
  },
};

// 🔍 디버그용 환경 정보 출력
if (config.ENABLE_DEBUG_LOGS) {
  console.log('🔧 환경 설정:', {
    환경: isDevelopment ? '개발' : '배포',
    API_BASE_URL: config.API_BASE_URL,
    QNAME_API_URL: config.QNAME_API_URL,
    QTEXT_API_URL: config.QTEXT_API_URL,
    API_ENABLED: config.API_ENABLED,
  });
}
