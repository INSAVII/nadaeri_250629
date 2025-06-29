// 전역 사용자 타입 정의
// 모든 컴포넌트에서 공통으로 사용할 통일된 User 인터페이스

export interface User {
    id: string;                    // 시스템 내부 ID
    userId: string;               // 사용자 로그인 ID (필수, 고유값)
    password: string;             // 비밀번호
    name: string;                 // 실명
    email: string;                // 이메일
    phone: string;                // 전화번호 (필수)
    role: 'user' | 'admin';       // 사용자 역할
    balance: number;              // 예치금
    isActive: boolean;            // 활성 상태
    businessNumber?: string;      // 사업자번호 (선택)
    createdAt: string;            // 가입일
    lastLoginAt?: string;         // 마지막 로그인일
    totalSpent?: number;          // 총 사용금액
    depositHistory?: Array<{      // 예치금 내역
        date: string;
        amount: number;
        type: 'deposit' | 'withdraw';
        memo: string;
    }>;
    programPermissions: {         // 프로그램 권한 (필수)
        free: boolean;
        month1: boolean;
        month3: boolean;
    };
}

// AuthContext에서 사용할 간소화된 User 타입
export interface AuthUser {
    id: string;
    userId: string;
    name: string;
    email?: string;
    role: 'user' | 'admin';
    balance: number;
    programPermissions?: {
        free: boolean;
        month1: boolean;
        month3: boolean;
    };
}

// CMS에서 사용할 확장된 User 타입
export interface CMSUser extends User {
    // CMS 전용 필드들
}

// MockUser는 User와 동일하게 통일
export type MockUser = User;

// 기본 프로그램 권한 값
export const DEFAULT_PROGRAM_PERMISSIONS = {
    free: false,
    month1: false,
    month3: false
};

// 타입 변환 헬퍼 함수들
export function convertToAuthUser(user: User): AuthUser {
    return {
        id: user.id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        programPermissions: user.programPermissions
    };
}

export function convertToCMSUser(user: User): CMSUser {
    return user as CMSUser;
}

export function convertFromAuthUser(authUser: AuthUser): User {
    return {
        id: authUser.id,
        userId: authUser.userId,
        password: 'unknown', // 기본값
        name: authUser.name,
        email: authUser.email || `${authUser.userId}@example.com`,
        phone: '010-0000-0000', // 기본값
        role: authUser.role,
        balance: authUser.balance,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        lastLoginAt: new Date().toISOString().split('T')[0],
        programPermissions: authUser.programPermissions || DEFAULT_PROGRAM_PERMISSIONS
    };
}

// User 객체에 기본값을 제공하는 헬퍼 함수
export function ensureUserDefaults(user: Partial<User>): User {
    return {
        id: user.id || 'unknown',
        userId: user.userId || user.id || 'unknown',
        password: user.password || 'unknown',
        name: user.name || 'Unknown User',
        email: user.email || 'unknown@example.com',
        phone: user.phone || '010-0000-0000',
        role: user.role || 'user',
        balance: user.balance || 0,
        isActive: user.isActive ?? true,
        businessNumber: user.businessNumber,
        createdAt: user.createdAt || new Date().toISOString().split('T')[0],
        lastLoginAt: user.lastLoginAt,
        totalSpent: user.totalSpent || 0,
        depositHistory: user.depositHistory || [],
        programPermissions: user.programPermissions || DEFAULT_PROGRAM_PERMISSIONS
    };
} 