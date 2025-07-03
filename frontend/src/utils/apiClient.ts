import { getApiUrl, ERROR_MESSAGES } from '../config/constants';

// API 응답 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

// HTTP 오류 타입
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 요청 옵션 타입
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  token?: string;
  timeout?: number;
}

// 기본 헤더
const getDefaultHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token && token.trim() && token !== 'null' && token !== 'undefined') {
    // JWT 토큰 형식 검증 (3개 세그먼트)
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      headers.Authorization = `Bearer ${token}`;
      console.log('🔐 유효한 토큰으로 Authorization 헤더 설정');
    } else {
      console.warn('⚠️ 잘못된 JWT 토큰 형식:', {
        tokenLength: token.length,
        tokenStart: token.substring(0, 20),
        segments: tokenParts.length
      });
    }
  } else {
    console.warn('⚠️ 토큰이 없거나 유효하지 않음:', {
      token: token,
      tokenType: typeof token,
      tokenLength: token?.length
    });
  }

  return headers;
};

// API 요청 래퍼 함수
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const {
    method = 'GET',
    headers = {},
    body,
    token,
    timeout = 30000
  } = options;

  const url = `${getApiUrl()}${endpoint}`;
  const defaultHeaders = getDefaultHeaders(token);

  // 토큰 체크
  if (!token || token.split('.').length !== 3) {
    console.error('[apiClient] 인증 오류: 토큰이 없거나 잘못됨. 자동 로그아웃.');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('USER_DATA');
      window.location.href = '/login';
    }
    throw new ApiError(401, '인증 오류: 토큰이 없거나 잘못되었습니다. 다시 로그인 해주세요.');
  }

  // AbortController로 타임아웃 처리
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`🌐 API 요청: ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers: { ...defaultHeaders, ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // 401/403 인증 오류 처리
    if (response.status === 401 || response.status === 403) {
      console.error('[apiClient] 인증 오류(401/403): 자동 로그아웃.');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('USER_DATA');
        window.location.href = '/login';
      }
      throw new ApiError(response.status, '인증 오류: 세션이 만료되었거나 권한이 없습니다. 다시 로그인 해주세요.');
    }

    if (!response.ok) {
      let errorMessage: string = ERROR_MESSAGES.INTERNAL_ERROR;
      let errorData: any;

      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      throw new ApiError(response.status, errorMessage, errorData);
    }

    // 응답 파싱
    const responseData = await response.json();
    console.log(`✅ API 응답 성공: ${method} ${url}`, responseData);

    return responseData;

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    // 네트워크 오류 처리
    if (error instanceof TypeError || (error as any)?.name === 'AbortError') {
      throw new ApiError(0, ERROR_MESSAGES.NETWORK_ERROR);
    }

    // 기타 오류
    throw new ApiError(500, error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

// GET 요청
export const apiGet = <T = any>(endpoint: string, token?: string): Promise<T> =>
  apiRequest<T>(endpoint, { method: 'GET', token });

// POST 요청
export const apiPost = <T = any>(endpoint: string, data?: any, token?: string): Promise<T> =>
  apiRequest<T>(endpoint, { method: 'POST', body: data, token });

// PUT 요청
export const apiPut = <T = any>(endpoint: string, data?: any, token?: string): Promise<T> =>
  apiRequest<T>(endpoint, { method: 'PUT', body: data, token });

// DELETE 요청
export const apiDelete = <T = any>(endpoint: string, token?: string): Promise<T> =>
  apiRequest<T>(endpoint, { method: 'DELETE', token });

// Form 데이터 전송 (파일 업로드 등)
export const apiPostForm = async <T = any>(
  endpoint: string,
  formData: FormData,
  token?: string
): Promise<T> => {
  const url = `${getApiUrl()}${endpoint}`;
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      let errorMessage: string = ERROR_MESSAGES.INTERNAL_ERROR;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new ApiError(response.status, errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

// 로그인 전용 API (form-urlencoded)
export const apiLogin = async (username: string, password: string): Promise<any> => {
  const url = `${getApiUrl()}/api/auth/login`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username,
        password,
      }),
    });

    if (!response.ok) {
      let errorMessage: string = '로그인에 실패했습니다.';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new ApiError(response.status, errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.');
  }
};

// 재시도 로직이 포함된 API 요청
export const apiRequestWithRetry = async <T = any>(
  endpoint: string,
  options: RequestOptions = {},
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiRequest<T>(endpoint, options);
    } catch (error) {
      lastError = error as Error;

      // 마지막 시도거나 재시도하면 안 되는 오류인 경우
      if (attempt === maxRetries ||
        (error instanceof ApiError && error.status >= 400 && error.status < 500)) {
        throw error;
      }

      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      console.log(`🔄 API 재시도 ${attempt}/${maxRetries}: ${endpoint}`);
    }
  }

  throw lastError!;
};

// 인증이 필요한 API 요청 래퍼
export const authenticatedRequest = <T = any>(
  endpoint: string,
  options: Omit<RequestOptions, 'token'> = {},
  token: string
): Promise<T> => {
  if (!token) {
    throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);
  }

  return apiRequest<T>(endpoint, { ...options, token });
};
