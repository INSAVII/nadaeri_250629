// 표준 User 타입 정의 (DB/백엔드/프론트엔드 완전 일치)
export interface User {
    // 필수 필드 (핵심 정합성)
    id: string;                    // 시스템 내부 ID
    userId: string;                // 사용자 ID (id와 동일)
    name: string;                  // 이름
    email: string;                 // 이메일
    phone: string;                 // 전화번호 (필수)
    role: 'user' | 'admin';        // 사용자 역할
    balance: number;               // 예치금
    is_active: boolean;            // 활성/비활성
    created_at: string;            // 가입일

    // 선택적 필드
    last_login_at?: string;        // 마지막 로그인
    token?: string;                // API 인증 토큰

    // 부가 정보 (선택적)
    region?: string;               // 지역
    age?: string;                  // 나이
    gender?: string;               // 성별
    work_type?: string;            // 직업
    has_business?: boolean;        // 사업자 여부
    business_number?: string;      // 사업자 번호

    // 레거시 호환용 (점진적 제거 예정)
    isActive?: boolean;            // is_active와 동일
    createdAt?: string;            // created_at과 동일
    lastLoginAt?: string;          // last_login_at과 동일
    totalSpent?: number;           // 총 사용금액
    depositHistory?: Array<{       // 예치금 내역
        date: string;
        amount: number;
        type: 'deposit' | 'withdraw';
        memo: string;
    }>;
    programPermissions?: {         // 프로그램 권한
        free: boolean;
        month1: boolean;
        month3: boolean;
    };
    programs?: any[];              // 백엔드 API 응답 호환용
}

// AuthContext에서 사용할 간소화된 User 타입 (표준 구조와 일치)
export interface AuthUser {
    // 필수 필드 (표준 User와 동일)
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    role: 'user' | 'admin';
    balance: number;
    is_active: boolean;
    created_at: string;

    // 선택적 필드
    last_login_at?: string;
    token?: string;

    // 프로그램 권한 (선택적)
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

// 타입 변환 헬퍼 함수들 (표준 구조 기반)
export function convertToAuthUser(user: User): AuthUser {
    return {
        id: user.id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
        is_active: user.is_active,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
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
        name: authUser.name,
        email: authUser.email,
        phone: authUser.phone,
        role: authUser.role,
        balance: authUser.balance,
        is_active: authUser.is_active,
        created_at: authUser.created_at,
        last_login_at: authUser.last_login_at,
        programPermissions: authUser.programPermissions || DEFAULT_PROGRAM_PERMISSIONS
    };
}

// User 객체에 기본값을 제공하는 헬퍼 함수 (표준 구조 기반)
export function ensureUserDefaults(user: Partial<User>): User {
    const perms: any = user.programPermissions || {};

    // programs 배열에서 programPermissions 추출 (program_id 사용)
    let extractedPerms = {
        free: perms.free ?? false,
        month1: perms.month1 ?? false,
        month3: perms.month3 ?? false
    };

    // programs 배열이 있으면 거기서 권한 정보 추출
    if (user.programs && Array.isArray(user.programs)) {
        extractedPerms = {
            free: user.programs.some((p: any) => p.program_id === 'free' && p.is_allowed) || false,
            month1: user.programs.some((p: any) => p.program_id === 'month1' && p.is_allowed) || false,
            month3: user.programs.some((p: any) => p.program_id === 'month3' && p.is_allowed) || false
        };
    }

    return {
        id: user.id || 'unknown',
        userId: user.userId || user.id || 'unknown',
        name: user.name || 'Unknown User',
        email: user.email || 'unknown@example.com',
        phone: user.phone || '010-0000-0000',
        role: user.role || 'user',
        balance: user.balance || 0,
        is_active: user.is_active ?? user.isActive ?? true,
        created_at: user.created_at || user.createdAt || new Date().toISOString().split('T')[0],
        last_login_at: user.last_login_at || user.lastLoginAt,
        region: user.region,
        age: user.age,
        gender: user.gender,
        work_type: user.work_type,
        has_business: user.has_business,
        business_number: user.business_number,
        // 레거시 호환용
        isActive: user.is_active ?? user.isActive ?? true,
        createdAt: user.created_at || user.createdAt || new Date().toISOString().split('T')[0],
        lastLoginAt: user.last_login_at || user.lastLoginAt,
        totalSpent: user.totalSpent || 0,
        depositHistory: user.depositHistory || [],
        programPermissions: extractedPerms,
        programs: user.programs || []
    };
} 