// API 기반 사용자 데이터 유틸리티
// 모든 mock 데이터 제거 - 실제 백엔드 API만 사용

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

// 실제 API만 사용하도록 mock 데이터 완전 제거
// 모든 사용자 데이터는 백엔드 API에서 가져옴

// API 연결 실패 시 빈 배열 반환 (mock 데이터 사용 안함)
export const getFallbackUsers = (): MockUser[] => [];

// 더 이상 사용하지 않는 mock 함수들 제거
// export const getMockUsers = () => []; // 삭제됨
// export const MOCK_ADMIN_USER = {}; // 삭제됨
// export const MOCK_TEST_USER = {}; // 삭제됨
