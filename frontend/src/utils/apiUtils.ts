// API utility functions
// API 호출 관련 공통 유틸리티

import { API_CONFIG, STORAGE_KEYS } from '../config/constants';

/**
 * 🚫 인증 토큰을 포함한 기본 헤더 반환 - localStorage 사용 금지
 */
export const getAuthHeaders = (): HeadersInit => {
  console.log('🚫 apiUtils - getAuthHeaders 호출됨 (localStorage 사용 금지)');
  // localStorage에서 토큰을 가져오지 않음 - 자동 로그인 방지
  return {
    'Content-Type': 'application/json'
    // Authorization 헤더 제거하여 토큰 기반 자동 로그인 방지
  };
};

/**
 * API 기본 URL과 엔드포인트를 결합하여 전체 URL 반환
 */
export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const baseUrl = `${API_CONFIG.BASE_URL}${endpoint}`;

  if (!params) {
    return baseUrl;
  }

  const searchParams = new URLSearchParams(params);
  return `${baseUrl}?${searchParams.toString()}`;
};

/**
 * 표준화된 API 에러 처리
 */
export const handleApiError = (response: Response, defaultMessage: string = '서버 오류가 발생했습니다.'): string => {
  switch (response.status) {
    case 401:
      return '인증이 필요합니다. 다시 로그인해주세요.';
    case 403:
      return '권한이 없습니다.';
    case 404:
      return '요청한 데이터를 찾을 수 없습니다.';
    case 500:
      return '서버 내부 오류가 발생했습니다.';
    default:
      return defaultMessage;
  }
};

/**
 * 표준화된 fetch 래퍼
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  params?: Record<string, string>
): Promise<T> => {
  const url = buildApiUrl(endpoint, params);
  const defaultOptions: RequestInit = {
    headers: getAuthHeaders(),
    ...options
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      throw new Error(handleApiError(response));
    }

    return await response.json() as T;
  } catch (error) {
    console.error('API 요청 실패:', error);
    throw error;
  }
};
