// 공통 mock 사용자 데이터 (회원관리/예치금관리 등에서 import)
import { User } from '../types/user';

export type MockUser = User;

// 기본 mock 계정들 (AuthContext와 통합)
const DEFAULT_MOCK_USERS: MockUser[] = [
  {
    id: 'admin',
    userId: 'admin',
    password: 'admin',
    name: '관리자',
    email: 'admin@qclick.com',
    phone: '010-1234-5678',
    businessNumber: '123-45-67890',
    balance: 100000,
    role: 'admin',
    isActive: true,
    createdAt: '2023-01-01',
    lastLoginAt: new Date().toISOString().split('T')[0],
    programPermissions: {
      free: true,
      month1: true,
      month3: true
    }
  },
  {
    id: 'user',
    userId: 'user',
    password: 'user',
    name: '일반사용자',
    email: 'user@example.com',
    phone: '010-2345-6789',
    businessNumber: '234-56-78901',
    balance: 50000,
    role: 'user',
    isActive: true,
    createdAt: '2023-02-01',
    lastLoginAt: new Date().toISOString().split('T')[0],
    programPermissions: {
      free: true,
      month1: false,
      month3: false
    }
  },
  {
    id: 'user2',
    userId: 'user2',
    password: 'user2',
    name: '김철수',
    email: 'kim@example.com',
    phone: '010-3456-7890',
    businessNumber: '345-67-89012',
    balance: 75000,
    role: 'user',
    isActive: true,
    createdAt: '2023-03-01',
    lastLoginAt: new Date().toISOString().split('T')[0],
    programPermissions: {
      free: true,
      month1: true,
      month3: false
    }
  },
  {
    id: 'user3',
    userId: 'user3',
    password: 'user3',
    name: '이영희',
    email: 'lee@example.com',
    phone: '010-4567-8901',
    businessNumber: '456-78-90123',
    balance: 120000,
    role: 'user',
    isActive: true,
    createdAt: '2023-04-01',
    lastLoginAt: new Date().toISOString().split('T')[0],
    programPermissions: {
      free: true,
      month1: false,
      month3: true
    }
  }
];

// localStorage key
const MOCK_USERS_KEY = 'mockUsers';
const AUTH_USER_KEY = 'user'; // AuthContext에서 사용하는 키
const USER_DATA_KEY = 'USER_DATA';

// AuthContext의 사용자 데이터를 mockUsers 형식으로 변환
function convertAuthUserToMockUser(authUser: any): MockUser | null {
  if (!authUser) return null;

  // 필수 필드들을 포함한 기본 구조
  const mockUser: MockUser = {
    id: authUser.id || authUser.userId || 'unknown',
    userId: authUser.userId || authUser.id || 'unknown',
    password: authUser.password || 'unknown',
    name: authUser.name || 'Unknown User',
    email: authUser.email || `${authUser.userId || 'user'}@example.com`,
    phone: authUser.phone || '010-0000-0000', // 필수항목이므로 기본값 제공
    balance: authUser.balance || 0,
    role: authUser.role === 'admin' ? 'admin' : 'user',
    isActive: authUser.isActive || true,
    createdAt: authUser.createdAt || new Date().toISOString().split('T')[0],
    lastLoginAt: new Date().toISOString().split('T')[0],
    programPermissions: authUser.programPermissions || {
      free: true,
      month1: false,
      month3: false
    }
  };

  // 선택적 필드가 있는 경우에만 추가
  if (authUser.businessNumber) {
    mockUser.businessNumber = authUser.businessNumber;
  }

  return mockUser;
}

// AuthContext에서 사용자 데이터 가져오기 (여러 키 시도)
function getAuthUserData(): any {
  // 여러 가능한 키에서 사용자 데이터 찾기
  const keys = [AUTH_USER_KEY, USER_DATA_KEY, 'currentUser', 'authUser'];

  for (const key of keys) {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed && (parsed.id || parsed.userId || parsed.email)) {
          console.log(`✅ AuthContext 사용자 데이터 발견 (키: ${key}):`, parsed);
          return parsed;
        }
      } catch (error) {
        console.warn(`❌ 키 ${key}에서 데이터 파싱 실패:`, error);
      }
    }
  }

  return null;
}

// localStorage에서 mockUsers 불러오기 (AuthContext 사용자 제외)
export const getMockUsers = (): MockUser[] => {
  try {
    // localStorage 초기화 (문제 해결을 위해)
    localStorage.removeItem('mockUsers');

    // 기본 사용자 데이터 반환
    return DEFAULT_MOCK_USERS;
  } catch (error) {
    console.error('getMockUsers 오류:', error);
    return DEFAULT_MOCK_USERS;
  }
};

// mockUsers 설정 함수 (linter 오류 해결용)
export const setMockUsers = (users: MockUser[]): void => {
  try {
    localStorage.setItem('mockUsers', JSON.stringify(users));
  } catch (error) {
    console.error('setMockUsers 오류:', error);
  }
};

// 특정 사용자의 예치금 업데이트 (모든 시스템 동기화)
export function updateUserBalance(userId: string, newBalance: number, memo: string = '관리자 수정') {
  const users = getMockUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    console.error(`❌ 사용자를 찾을 수 없음: ${userId}`);
    return false;
  }

  const oldBalance = users[userIndex].balance;
  const balanceChange = newBalance - oldBalance;

  // 사용자 정보 업데이트
  users[userIndex] = {
    ...users[userIndex],
    balance: newBalance
  };

  setMockUsers(users);

  // AuthContext의 사용자 데이터도 업데이트
  const authUser = getAuthUserData();
  if (authUser && (authUser.id === userId || authUser.userId === userId)) {
    const updatedAuthUser = { ...authUser, balance: newBalance };

    // 여러 가능한 키에 업데이트
    const keys = [AUTH_USER_KEY, USER_DATA_KEY, 'currentUser', 'authUser'];
    keys.forEach(key => {
      const existingData = localStorage.getItem(key);
      if (existingData) {
        try {
          const parsed = JSON.parse(existingData);
          if (parsed && (parsed.id === userId || parsed.userId === userId)) {
            localStorage.setItem(key, JSON.stringify(updatedAuthUser));
            console.log(`🔄 AuthContext 사용자 데이터 업데이트 (키: ${key})`);
          }
        } catch (error) {
          console.warn(`❌ 키 ${key} 업데이트 실패:`, error);
        }
      }
    });
  }

  // 커스텀 이벤트 발생으로 실시간 동기화
  const balanceUpdateEvent = new CustomEvent('mockUsersBalanceUpdated', {
    detail: {
      userId,
      oldBalance,
      newBalance,
      balanceChange,
      updatedUsers: users,
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(balanceUpdateEvent);

  console.log(`✅ 예치금 업데이트 완료: ${userId} (${oldBalance.toLocaleString()}원 → ${newBalance.toLocaleString()}원)`);
  return true;
}

// 사용자 상태 토글 (활성/비활성)
export function toggleUserStatus(userId: string): boolean {
  const users = getMockUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    console.error(`❌ 사용자를 찾을 수 없음: ${userId}`);
    return false;
  }

  users[userIndex] = {
    ...users[userIndex],
    isActive: !users[userIndex].isActive
  };

  setMockUsers(users);
  console.log(`🔄 사용자 상태 변경: ${users[userIndex].name} (${users[userIndex].isActive ? '활성' : '비활성'})`);
  return true;
}

// 사용자 역할 변경
export function updateUserRole(userId: string, newRole: 'user' | 'admin'): boolean {
  const users = getMockUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    console.error(`❌ 사용자를 찾을 수 없음: ${userId}`);
    return false;
  }

  users[userIndex] = {
    ...users[userIndex],
    role: newRole
  };

  setMockUsers(users);
  console.log(`🔄 사용자 역할 변경: ${users[userIndex].name} (${newRole})`);
  return true;
}

// 사용자 정보 업데이트
export function updateUserInfo(userId: string, updateData: Partial<MockUser>): boolean {
  const users = getMockUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    console.error(`❌ 사용자를 찾을 수 없음: ${userId}`);
    return false;
  }

  users[userIndex] = {
    ...users[userIndex],
    ...updateData
  };

  setMockUsers(users);
  console.log(`🔄 사용자 정보 업데이트: ${users[userIndex].name}`);
  return true;
}

// mockUsers를 기본값으로 초기화 (강화된 버전)
export function resetMockUsers() {
  // localStorage에서 하드코딩된 데이터 완전 제거
  localStorage.removeItem(MOCK_USERS_KEY);

  // 기본 mock 회원 2명만 설정
  setMockUsers(DEFAULT_MOCK_USERS);

  // 다른 관련 키들도 정리
  const keysToCheck = ['USERS-DATA', 'mockUsersData', 'userData'];
  keysToCheck.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // 하드코딩된 user1, user2, user3 등의 데이터가 있는 경우 제거
        if (Array.isArray(parsed) && parsed.some(user => user.id && user.id.startsWith('user'))) {
          localStorage.removeItem(key);
          console.log(`🗑️ 하드코딩된 데이터 제거: ${key}`);
        }
      } catch (error) {
        // 파싱 오류 시 제거
        localStorage.removeItem(key);
        console.log(`🗑️ 오류 데이터 제거: ${key}`);
      }
    }
  });

  console.log('🔄 MockUsers 완전 초기화 완료 - 기본 mock 회원 2명만 사용');
}

// 사용자 추가
export function addMockUser(user: Omit<MockUser, 'id'>): string {
  const users = getMockUsers();
  const newId = `user_${Date.now()}`;
  const newUser: MockUser = {
    ...user,
    id: newId,
    createdAt: user.createdAt || new Date().toISOString().split('T')[0]
  };

  users.push(newUser);
  setMockUsers(users);
  console.log(`➕ 새 사용자 추가: ${newUser.name} (${newId})`);
  return newId;
}

// 사용자 삭제
export function removeMockUser(userId: string): boolean {
  const users = getMockUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    console.error(`❌ 사용자를 찾을 수 없음: ${userId}`);
    return false;
  }

  const userName = users[userIndex].name;
  users.splice(userIndex, 1);
  setMockUsers(users);
  console.log(`🗑️ 사용자 삭제: ${userName} (${userId})`);
  return true;
}

// 이벤트 리스너 등록 (페이지에서 사용)
export function subscribeToMockUsersUpdates(callback: (users: MockUser[]) => void): () => void {
  const handleUpdate = (event: CustomEvent) => {
    callback(event.detail.users || getMockUsers());
  };

  window.addEventListener('mockUsersUpdated', handleUpdate as EventListener);
  window.addEventListener('mockUsersBalanceUpdated', handleUpdate as EventListener);

  // 구독 해제 함수 반환
  return () => {
    window.removeEventListener('mockUsersUpdated', handleUpdate as EventListener);
    window.removeEventListener('mockUsersBalanceUpdated', handleUpdate as EventListener);
  };
}

// 시스템 상태 확인 (디버깅용)
export function getSystemStatus() {
  const users = getMockUsers();
  const authUser = getAuthUserData();

  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    totalBalance: users.reduce((sum, u) => sum + u.balance, 0),
    authUser: authUser ? {
      id: authUser.id || authUser.userId,
      name: authUser.name,
      role: authUser.role,
      balance: authUser.balance
    } : null,
    localStorageKeys: {
      mockUsers: !!localStorage.getItem(MOCK_USERS_KEY),
      authUser: !!localStorage.getItem(AUTH_USER_KEY),
      userData: !!localStorage.getItem(USER_DATA_KEY)
    }
  };
}

// 강제로 모든 하드코딩된 데이터 제거 및 새로운 목업 데이터로 초기화
export function forceResetToNewMockUsers() {
  console.log('🔄 강제 리셋 시작 - 모든 하드코딩된 데이터 제거');

  // 모든 관련 키 삭제
  const keysToRemove = [
    MOCK_USERS_KEY,
    AUTH_USER_KEY,
    USER_DATA_KEY,
    'currentUser',
    'authUser',
    'USERS-DATA',
    'mockUsersData',
    'userData'
  ];

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ 키 삭제: ${key}`);
  });

  // 새로운 목업 데이터 설정 (4명의 사용자)
  setMockUsers(DEFAULT_MOCK_USERS);

  console.log('✅ 강제 리셋 완료 - 새로운 목업 데이터 설정됨');
  console.log('📊 설정된 사용자:', DEFAULT_MOCK_USERS.map(u => `${u.name}(${u.id})`));

  return DEFAULT_MOCK_USERS;
}

// 현재 로그인한 사용자의 프로그램 권한 가져오기
export function getCurrentUserProgramPermissions(): { free: boolean; month1: boolean; month3: boolean } | null {
  try {
    // AuthContext에서 현재 사용자 정보 가져오기
    const authUser = getAuthUserData();
    if (!authUser) {
      console.log('🔍 현재 로그인한 사용자 정보 없음');
      return null;
    }

    // mockUsers에서 해당 사용자 찾기
    const mockUsers = getMockUsers();
    const currentUser = mockUsers.find(user =>
      user.id === authUser.id ||
      user.userId === authUser.userId ||
      user.email === authUser.email
    );

    if (currentUser && currentUser.programPermissions) {
      console.log('🔍 현재 사용자 프로그램 권한:', currentUser.programPermissions);
      return currentUser.programPermissions;
    }

    // 기본값 반환
    const defaultPermissions = {
      free: true,
      month1: false,
      month3: false
    };
    console.log('🔍 기본 프로그램 권한 사용:', defaultPermissions);
    return defaultPermissions;
  } catch (error) {
    console.error('❌ 프로그램 권한 가져오기 실패:', error);
    return null;
  }
}

// 프로그램 권한을 표시용 텍스트로 변환
export function getProgramPermissionsText(permissions: { free: boolean; month1: boolean; month3: boolean } | null): string {
  if (!permissions) {
    return '권한 없음';
  }

  const { free, month1, month3 } = permissions;
  const parts: string[] = [];

  if (free) parts.push('무료');
  if (month1) parts.push('1개월');
  if (month3) parts.push('3개월');

  if (parts.length === 0) {
    return '권한 없음';
  }

  return parts.join(' ');
}
