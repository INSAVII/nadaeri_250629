import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, CMSUser, ensureUserDefaults } from '../../types/user';
import { getApiUrl } from '../../config/constants';

// 🆕 엑셀 다운로드 유틸리티 함수
const downloadExcel = (data: any[], filename: string) => {
    // CSV 형식으로 데이터 변환
    const headers = Object.keys(data[0] || {});
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // 값에 쉼표가 있으면 따옴표로 감싸기
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 다운로드 링크 생성
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

type CMSStats = {
    totalUsers: number;
    activeUsers: number;
    totalBalance: number;
    monthlyRevenue: number;
    newUsersThisMonth: number;
    averageBalance: number;
};

// API 응답 타입 정의
type APIUser = {
    id: string;
    username?: string;
    email: string;
    phone?: string;  // 전화번호 추가
    role: string;
    is_active: boolean;
    created_at: string;
    balance?: number;  // 예치금 정보 추가
    program_permissions_free?: boolean;
    program_permissions_month1?: boolean;
    program_permissions_month3?: boolean;
};

type APIResponse = {
    users: APIUser[];
    total: number;
    skip: number;
    limit: number;
};

// 새로운 사용자 목록 가져오기 함수 (예치금 관련 없이)
const fetchUsersBasic = async (token: string, page: number = 1, limit: number = 20, search?: string): Promise<{ users: CMSUser[], total: number }> => {
    try {
        let url = `${getApiUrl()}/api/auth/users?skip=${(page - 1) * limit}&limit=${limit}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: APIResponse = await response.json();
        console.log('CMS - 기본 사용자 API 응답:', data);

        // 기본 사용자 정보로 변환
        const convertedUsers: CMSUser[] = data.users.map((user: APIUser) => ({
            id: user.id,
            userId: user.id,
            name: user.username || user.email,
            email: user.email,
            phone: user.phone || '',  // API에서 받은 전화번호 사용
            role: (user.role === 'admin' ? 'admin' : 'user') as 'user' | 'admin',
            is_active: user.is_active,
            created_at: user.created_at,
            balance: user.balance || 0,  // API에서 받은 예치금 정보 사용
            programPermissions: {
                free: user.program_permissions_free || false,
                month1: user.program_permissions_month1 || false,
                month3: user.program_permissions_month3 || false
            }
        }));

        return {
            users: convertedUsers,
            total: data.total || convertedUsers.length
        };
    } catch (error) {
        console.error('사용자 목록 가져오기 실패:', error);
        return { users: [], total: 0 };
    }
};

const updateUserStatusAPI = async (token: string, userId: string, isActive: boolean): Promise<User> => {
    // const response = await fetch(`${getApiUrl()}/api/deposits/users/${userId}/status`, {
    //     method: 'PATCH',
    //     headers: {
    //         'Authorization': `Bearer ${token}`,
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({ isActive })
    // });
    // if (!response.ok) throw new Error('사용자 상태 변경에 실패했습니다');
    return await Promise.resolve({} as User);
};

export default function CMSPage() {
    const { user, isAuthenticated, isLoading, updateBalance, refreshUserData: refreshAuthUserData, logout } = useAuth();
    const navigate = useNavigate();

    // 🆕 영구적인 캐시 방지: 페이지 로드 시마다 캐시 무효화
    const cacheBuster = Date.now();
    const currentUrl = window.location.href;

    // URL에 캐시 무효화 파라미터가 없으면 추가
    if (!currentUrl.includes('cache_clear=')) {
        const separator = currentUrl.includes('?') ? '&' : '?';
        const newUrl = `${currentUrl}${separator}cache_clear=${cacheBuster}`;
        window.history.replaceState({}, '', newUrl);
    }

    // 🆕 메타 태그로 캐시 방지
    const metaTags = [
        { httpEquiv: 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
        { httpEquiv: 'Pragma', content: 'no-cache' },
        { httpEquiv: 'Expires', content: '0' }
    ];

    metaTags.forEach(tag => {
        let meta = document.querySelector(`meta[http-equiv="${tag.httpEquiv}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('http-equiv', tag.httpEquiv);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', tag.content);
    });

    // 🆕 강화된 캐시 방지: 개발 모드에서 자동 새로고침
    if (process.env.NODE_ENV === 'development') {
        const lastLoadTime = sessionStorage.getItem('cms_last_load');
        const currentTime = Date.now();

        // 3분마다 자동 새로고침 (개발 중에만)
        if (!lastLoadTime || (currentTime - parseInt(lastLoadTime)) > 3 * 60 * 1000) {
            sessionStorage.setItem('cms_last_load', currentTime.toString());

            // 캐시된 스크립트 감지
            const scripts = document.querySelectorAll('script[src]');
            const hasCachedScript = Array.from(scripts).some(script => {
                const src = script.getAttribute('src');
                return src && src.includes('parcel') && !src.includes('?');
            });

            if (hasCachedScript) {
                console.log('🔄 캐시된 스크립트 감지, 자동 새로고침 실행');
                window.location.reload();
                return;
            }
        }
    }

    console.log('🛡️ 영구적인 캐시 방지 설정 완료');

    const [users, setUsers] = useState<CMSUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'deposits' | 'analytics' | 'programs'>('overview');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [depositAmount, setDepositAmount] = useState<string>('');
    const [depositType, setDepositType] = useState<'add' | 'subtract'>('add');
    const [selectedSort, setSelectedSort] = useState<string>('balance-desc');
    const [stats, setStats] = useState<CMSStats>({
        totalUsers: 0,
        activeUsers: 0,
        totalBalance: 0,
        monthlyRevenue: 0,
        newUsersThisMonth: 0,
        averageBalance: 0
    });

    // ✅ 🆕 단순화된 프로그램 권한 관리 상태 (영구 저장)
    const [permanentProgramPermissions, setPermanentProgramPermissions] = useState<{ [userId: string]: { free: boolean, month1: boolean, month3: boolean } }>({});

    // 🆕 변경된 사용자 추적 (localStorage 저장용)
    const [changedUsers, setChangedUsers] = useState<Set<string>>(new Set());

    // 무한루프 방지를 위한 ref들
    const dataLoadedRef = useRef(false);
    const isInitializedRef = useRef(false);
    const effectRunCountRef = useRef(0);
    const isUpdatingRef = useRef(false);

    // ✅ 단순화된 초기화 - 관리자 권한 확인 후 데이터 로드
    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin' && user?.token) {
            console.log('CMS - 관리자 권한 확인됨, 데이터 로드 시작');
            loadData();
        }
    }, [isAuthenticated, user?.role, user?.token]);

    const loadData = async () => {
        if (!user?.token) {
            console.log('CMS - 사용자 토큰이 없어서 데이터 로드를 건너뜁니다.');
            return;
        }

        try {
            setLoading(true);
            console.log('CMS - 완전 독립적 초기화 완료');

            // 페이지네이션된 사용자 데이터 로드
            const result = await fetchUsersBasic(user.token, 1, 20);
            const apiUsers = result.users;
            console.log('CMS - API 응답 원본:', apiUsers);

            // 이미 올바른 CMSUser 타입으로 변환되어 있음
            setUsers(apiUsers);
            updateStats(apiUsers);

            // 🆕 데이터베이스의 실제 권한 상태로 초기화 + localStorage 변경사항 병합
            const dbPermissions: { [userId: string]: { free: boolean, month1: boolean, month3: boolean } } = {};

            // 데이터베이스에서 가져온 실제 권한 상태로 초기화
            apiUsers.forEach(user => {
                dbPermissions[user.id] = {
                    free: user.programPermissions?.free || false,
                    month1: user.programPermissions?.month1 || false,
                    month3: user.programPermissions?.month3 || false
                };
            });

            // localStorage에서 저장되지 않은 변경사항 복원 (DB 상태와 병합)
            const savedPermissions = localStorage.getItem('cms_program_permissions');
            if (savedPermissions) {
                const parsedPermissions = JSON.parse(savedPermissions);
                console.log('CMS - localStorage에서 권한 복원:', parsedPermissions);

                // localStorage의 변경사항을 DB 상태에 병합
                Object.keys(parsedPermissions).forEach(userId => {
                    if (dbPermissions[userId]) {
                        dbPermissions[userId] = {
                            ...dbPermissions[userId],
                            ...parsedPermissions[userId]
                        };
                    }
                });
            }

            setPermanentProgramPermissions(dbPermissions);
            console.log('CMS - 최종 권한 상태 (DB + localStorage 병합):', dbPermissions);

            console.log('CMS loadData 완료');
        } catch (error) {
            console.error('CMS - 데이터 로드 실패:', error);
            setError('데이터를 불러오는데 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
        } finally {
            setLoading(false);
        }
    };

    // 사용자 데이터 새로고침
    const refreshUserData = async () => {
        // 🚫 완전 비활성화: 데이터 새로고침 기능 차단
        console.log('🚫 데이터 새로고침 기능 완전 차단 (체크박스 상태 보존)');
        setError('데이터 새로고침이 비활성화되었습니다. 체크박스 상태를 보존합니다.');
        setTimeout(() => setError(null), 3000);
        return;
    };

    // 통계 업데이트 함수
    const updateStats = (userList: CMSUser[]) => {
        const totalBalance = userList.reduce((sum, u) => sum + u.balance, 0);
        const activeUsers = userList.filter(u => u.is_active !== false).length;
        const averageBalance = userList.length > 0 ? totalBalance / userList.length : 0;

        setStats({
            totalUsers: userList.length,
            activeUsers,
            totalBalance,
            monthlyRevenue: 0, // 실제 계산 로직 필요시 추가
            newUsersThisMonth: 0, // 실제 계산 로직 필요시 추가
            averageBalance
        });
    };

    const handleBulkDeposit = async () => {
        if (selectedUsers.length === 0) {
            setError('사용자를 선택해주세요.');
            return;
        }
        const amount = parseInt(depositAmount);
        if (isNaN(amount) || amount <= 0) {
            setError('올바른 금액을 입력해주세요.');
            return;
        }
        if (!user?.token) {
            setError('인증 토큰이 필요합니다.');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const updatedUsers = users.map(cmsUser => {
                if (selectedUsers.includes(cmsUser.id)) {
                    return cmsUser;
                }
                return cmsUser;
            });
            const updatedApiUsers = await Promise.all(updatedUsers.map(async (apiUser) => {
                if (selectedUsers.includes(apiUser.id)) {
                    const amountToChange = depositType === 'add' ? amount : -amount;
                    const requestBody = {
                        amount: amountToChange,
                        description: `관리자 ${depositType === 'add' ? '충전' : '차감'}: ${amount.toLocaleString()}원`
                    };
                    const response = await fetch(`${getApiUrl()}/api/deposits/users/${apiUser.id}/balance`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${user?.token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`예치금 업데이트에 실패했습니다: ${response.status} ${response.statusText} - ${errorText}`);
                    }
                    const result = await response.json();
                    if (result.success && result.data) {
                        if (updateBalance && apiUser.id === (user?.userId || user?.id)) {
                            await updateBalance(user, result.data.new_balance);
                        }
                        return { ...apiUser, balance: result.data.new_balance };
                    } else {
                        return apiUser;
                    }
                }
                return apiUser;
            }));
            setUsers(updatedApiUsers);
            updateStats(updatedApiUsers);
            setSuccessMessage(`${selectedUsers.length}명의 사용자에게 ${amount.toLocaleString()}원을 ${depositType === 'add' ? '충전' : '차감'}했습니다.`);
            setSelectedUsers([]);
            setDepositAmount('');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            let errorMessage = '예치금 처리 중 오류가 발생했습니다.';
            if (error instanceof Error) errorMessage = error.message;
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleUserStatusToggle = async (userId: string, currentStatus: boolean) => {
        try {
            if (!user?.token) {
                setError('인증 토큰이 필요합니다.');
                return;
            }

            // 실제 API 호출
            const response = await fetch(`${getApiUrl()}/api/deposits/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_active: !currentStatus })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`상태 변경 실패: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            const updatedUser = result.data;

            setUsers(prevUsers =>
                prevUsers.map(u =>
                    u.id === userId ? { ...u, is_active: updatedUser.is_active } : u
                )
            );
            setSuccessMessage('사용자 상태가 변경되었습니다.');
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (error) {
            console.error('사용자 상태 변경 실패:', error);
            setError('사용자 상태 변경 중 오류가 발생했습니다.');
            setTimeout(() => setError(null), 3000);
        }
    };

    const toggleUserSelect = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(user => user.id));
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === 'all' || user.role === selectedRole;
        const matchesStatus = selectedStatus === 'all' ||
            (selectedStatus === 'active' && user.is_active) ||
            (selectedStatus === 'inactive' && !user.is_active);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        switch (selectedSort) {
            case 'balance-desc':
                return b.balance - a.balance;
            case 'balance-asc':
                return a.balance - b.balance;
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'date-asc':
                return new Date(a.created_at || new Date()).getTime() - new Date(b.created_at || new Date()).getTime();
            case 'date-desc':
                return new Date(b.created_at || new Date()).getTime() - new Date(a.created_at || new Date()).getTime();
            default:
                return 0;
        }
    });

    // ✅ 체크박스 클릭 = UI 상태만 변경 (localStorage에 저장)
    const handleProgramCheckboxChange = (userId: string, programType: 'free' | 'month1' | 'month3', isChecked: boolean) => {
        console.log(`🔴 체크박스 클릭: ${userId} ${programType} = ${isChecked} (localStorage에 저장)`);

        // UI 상태 업데이트
        setPermanentProgramPermissions(prevStates => {
            const newStates = {
                ...prevStates,
                [userId]: {
                    ...prevStates[userId],
                    [programType]: isChecked
                }
            };

            // 🆕 간단한 localStorage 저장 (변경된 사용자 추적 없이)
            const currentSavedPermissions = localStorage.getItem('cms_program_permissions');
            const allPermissions = currentSavedPermissions ? JSON.parse(currentSavedPermissions) : {};
            allPermissions[userId] = newStates[userId];
            localStorage.setItem('cms_program_permissions', JSON.stringify(allPermissions));

            console.log('💾 localStorage에 저장:', {
                userId,
                permissions: allPermissions[userId]
            });

            return newStates;
        });
    };

    // ✅ 데이터베이스 상태 확인 함수 (디버깅용)
    const checkDatabaseState = () => {
        console.log('🔍 현재 UI 상태 vs 데이터베이스 상태:');
        users.forEach(user => {
            const uiState = permanentProgramPermissions[user.id];
            const dbState = user.programPermissions;
            const isMatch = JSON.stringify(uiState) === JSON.stringify(dbState);
            console.log(`사용자 ${user.id} (${user.name}):`, {
                UI: uiState,
                DB: dbState,
                일치: isMatch,
                상태: isMatch ? '✅ 동기화됨' : '❌ 불일치'
            });
        });

        // 선택된 사용자 정보도 표시
        if (selectedUsers.length > 0) {
            console.log('📋 선택된 사용자들:', selectedUsers.map(id => {
                const user = users.find(u => u.id === id);
                return `${user?.name} (${id})`;
            }));
        }

        // localStorage 상태도 확인
        const savedPermissions = localStorage.getItem('cms_program_permissions');
        console.log('💾 localStorage 상태:', savedPermissions ? JSON.parse(savedPermissions) : '없음');

        // 현재 permanentProgramPermissions 상태 확인
        console.log('🎯 현재 permanentProgramPermissions 상태:', permanentProgramPermissions);
    };

    // ✅ 단순화된 저장 버튼 = 데이터베이스 저장 + QCapture 페이지 즉시 업데이트
    const handleBulkProgramSave = async () => {
        console.log('🚨 handleBulkProgramSave 함수 시작 - 새 관리자 API 사용');
        console.log('🚨 현재 파일 버전: 2025-07-03 관리자 API 버전');

        if (selectedUsers.length === 0) {
            setError('사용자를 선택해주세요.');
            return;
        }

        if (!user?.token) {
            setError('인증 토큰이 필요합니다.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            let successCount = 0;
            let errorCount = 0;

            // 1. 데이터베이스에 권한 저장 (관리자용 일괄 API)
            console.log('🔍 저장 시작 - 선택된 사용자:', selectedUsers);
            console.log('🔍 현재 UI 상태:', permanentProgramPermissions);

            for (const userId of selectedUsers) {
                const permissions = permanentProgramPermissions[userId];
                console.log(`🔍 사용자 ${userId} 권한 데이터:`, permissions);

                if (!permissions) {
                    console.warn(`⚠️ 사용자 ${userId}의 권한 데이터가 없습니다.`);
                    continue;
                }

                try {
                    // 관리자용 API로 한 번에 저장
                    const requestBody = {
                        user_id: userId,
                        permissions: {
                            free: permissions.free || false,
                            month1: permissions.month1 || false,
                            month3: permissions.month3 || false
                        }
                    };

                    console.log(`🔍 관리자 API 요청 - 사용자: ${userId}`, requestBody);
                    console.log(`🔍 API URL: ${getApiUrl()}/api/auth/admin/update-user-program-permissions`);

                    const response = await fetch(`${getApiUrl()}/api/auth/admin/update-user-program-permissions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${user.token}`
                        },
                        body: JSON.stringify(requestBody)
                    });

                    console.log(`🔍 관리자 API 응답 - 사용자: ${userId}`, {
                        status: response.status,
                        statusText: response.statusText,
                        ok: response.ok
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`❌ 관리자 API 오류 - 사용자: ${userId}`, {
                            status: response.status,
                            statusText: response.statusText,
                            errorText
                        });
                        throw new Error(`권한 저장 실패: ${response.status} ${response.statusText}`);
                    }

                    const responseData = await response.json();
                    console.log(`✅ 관리자 API 성공 - 사용자: ${userId}`, responseData);
                    successCount++;
                } catch (error) {
                    console.error(`❌ 사용자 ${userId} 권한 저장 실패:`, error);
                    errorCount++;
                }
            }

            // 2. QCapture 페이지 즉시 업데이트 이벤트 전송
            const updatedUsers = selectedUsers.map(userId => ({
                userId,
                permissions: permanentProgramPermissions[userId] || { free: false, month1: false, month3: false }
            }));

            console.log('🔄 QCapture 페이지 업데이트 이벤트 전송:', updatedUsers);

            window.dispatchEvent(new CustomEvent('programPermissionSaved', {
                detail: {
                    type: 'bulk_save',
                    users: updatedUsers,
                    timestamp: Date.now()
                }
            }));

            // 3. 현재 사용자 권한이 변경된 경우 AuthContext 즉시 업데이트
            const currentUserId = user?.userId || user?.id;
            if (selectedUsers.includes(currentUserId) && refreshAuthUserData) {
                console.log('🔄 현재 사용자 권한 변경됨, AuthContext 즉시 업데이트');
                await refreshAuthUserData();
            }

            // 4. 🆕 저장 성공 후 localStorage에서 해당 사용자만 정리
            if (errorCount === 0) {
                setSuccessMessage(`✅ ${successCount}명의 사용자 프로그램 권한이 저장되었습니다. QCapture 페이지가 업데이트되었습니다.`);

                // localStorage에서 저장된 사용자만 정리 (나머지는 그대로 유지)
                const currentSavedPermissions = localStorage.getItem('cms_program_permissions');
                if (currentSavedPermissions) {
                    const allPermissions = JSON.parse(currentSavedPermissions);

                    // 저장된 사용자들의 localStorage 데이터만 제거
                    selectedUsers.forEach(userId => {
                        if (allPermissions[userId]) {
                            delete allPermissions[userId];
                            console.log(`🧹 localStorage에서 저장된 사용자 ${userId} 제거`);
                        }
                    });

                    // 남은 데이터가 있으면 업데이트, 없으면 삭제
                    if (Object.keys(allPermissions).length > 0) {
                        localStorage.setItem('cms_program_permissions', JSON.stringify(allPermissions));
                    } else {
                        localStorage.removeItem('cms_program_permissions');
                    }
                    console.log('🧹 localStorage 정리 완료 - 저장된 사용자만 제거됨');
                }
            } else {
                setSuccessMessage(`⚠️ ${successCount}명 성공, ${errorCount}명 실패. 일부 권한이 저장되지 않았습니다.`);
            }

            setSelectedUsers([]);
            setTimeout(() => setSuccessMessage(null), 5000);

        } catch (error) {
            console.error('권한 저장 중 오류:', error);
            setError('권한 저장 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
        } finally {
            setLoading(false);
        }
    };

    // 검색 기능
    // 🆕 회원관리 탭 엑셀 다운로드 함수
    const handleUsersExcelDownload = () => {
        if (selectedUsers.length === 0) {
            setError('다운로드할 사용자를 선택해주세요.');
            return;
        }

        const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
        const excelData = selectedUserData.map(user => ({
            '사용자 ID': user.id,
            '이름': user.name,
            '이메일': user.email,
            '전화번호': user.phone || '-',
            '역할': user.role === 'admin' ? '관리자' : '일반사용자',
            '상태': user.is_active ? '활성' : '비활성',
            '예치금': user.balance.toLocaleString() + '원',
            '가입일': new Date(user.created_at).toLocaleDateString('ko-KR'),
            '무료프로그램': user.programPermissions?.free ? '사용가능' : '사용불가',
            '1개월프로그램': user.programPermissions?.month1 ? '사용가능' : '사용불가',
            '3개월프로그램': user.programPermissions?.month3 ? '사용가능' : '사용불가'
        }));

        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        downloadExcel(excelData, `회원정보_${selectedUsers.length}명_${timestamp}`);
        setSuccessMessage(`${selectedUsers.length}명의 회원정보가 다운로드되었습니다.`);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    // 🆕 예치금관리 탭 엑셀 다운로드 함수
    const handleDepositsExcelDownload = () => {
        if (selectedUsers.length === 0) {
            setError('다운로드할 사용자를 선택해주세요.');
            return;
        }

        const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
        const excelData = selectedUserData.map(user => ({
            '사용자 ID': user.id,
            '이름': user.name,
            '이메일': user.email,
            '전화번호': user.phone || '-',
            '현재 예치금': user.balance.toLocaleString() + '원',
            '상태': user.is_active ? '활성' : '비활성',
            '가입일': new Date(user.created_at).toLocaleDateString('ko-KR'),
            '마지막 로그인': user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('ko-KR') : '-'
        }));

        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        downloadExcel(excelData, `예치금정보_${selectedUsers.length}명_${timestamp}`);
        setSuccessMessage(`${selectedUsers.length}명의 예치금정보가 다운로드되었습니다.`);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleSearch = async () => {
        if (!user?.token) return;

        try {
            setLoading(true);
            const result = await fetchUsersBasic(user.token, 1, 20, searchTerm);
            // 이미 올바른 CMSUser 타입으로 변환되어 있음
            setUsers(result.users);
            updateStats(result.users);
        } catch (error) {
            console.error('검색 실패:', error);
            setError('검색 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 검색어 변경 시 자동 검색 (디바운스 + 최소 길이 제한)
    useEffect(() => {
        const timer = setTimeout(() => {
            const trimmedSearch = searchTerm.trim();

            // 최소 2글자 이상이거나 검색어가 비어있을 때만 검색 실행
            if (trimmedSearch.length >= 2 || trimmedSearch.length === 0) {
                if (trimmedSearch) {
                    handleSearch();
                } else {
                    loadData(); // 검색어가 없으면 전체 데이터 로드
                }
            }
        }, 800); // 디바운스 시간을 800ms로 증가

        return () => clearTimeout(timer);
    }, [searchTerm]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">CMS 관리 시스템</h1>
                            <p className="mt-2 text-gray-600">회원 관리 및 예치금 관리</p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={refreshUserData}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                데이터 새로고침
                            </button>
                            <button
                                onClick={() => {
                                    // 캐시 클리어 및 강제 새로고침
                                    sessionStorage.clear();
                                    localStorage.removeItem('cms_program_permissions');
                                    window.location.reload();
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                title="캐시 클리어 및 강제 새로고침"
                            >
                                캐시 클리어
                            </button>
                        </div>
                    </div>
                </div>

                {/* 알림 메시지 */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}
                {successMessage && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-800">{successMessage}</p>
                    </div>
                )}

                {/* 탭 네비게이션 */}
                <div className="mb-6">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'overview', name: '개요' },
                            { id: 'users', name: '회원 관리' },
                            { id: 'deposits', name: '예치금 관리' },
                            { id: 'analytics', name: '분석' },
                            { id: 'programs', name: '프로그램 관리' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                data-tab-id={tab.id}
                            >
                                {tab.name || tab.id}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* 개요 탭 */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">총 회원수</dt>
                                            <dd className="text-lg font-medium text-gray-900">{stats.totalUsers.toLocaleString()}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">활성 회원</dt>
                                            <dd className="text-lg font-medium text-gray-900">{stats.activeUsers.toLocaleString()}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">총 예치금</dt>
                                            <dd className="text-lg font-medium text-gray-900">₩{stats.totalBalance.toLocaleString()}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">이번 달 신규</dt>
                                            <dd className="text-lg font-medium text-gray-900">{stats.newUsersThisMonth.toLocaleString()}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 회원 관리 탭 */}
                {activeTab === 'users' && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            {/* 검색 및 필터 */}
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    placeholder="이름 또는 이메일로 검색... (2글자 이상)"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">모든 역할</option>
                                    <option value="user">일반 사용자</option>
                                    <option value="admin">관리자</option>
                                </select>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">모든 상태</option>
                                    <option value="active">활성</option>
                                    <option value="inactive">비활성</option>
                                </select>
                                <select
                                    value={selectedSort}
                                    onChange={(e) => setSelectedSort(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="balance-desc">예치금 높은순</option>
                                    <option value="balance-asc">예치금 낮은순</option>
                                    <option value="name-asc">이름 오름차순</option>
                                    <option value="name-desc">이름 내림차순</option>
                                    <option value="date-asc">가입일 오름차순</option>
                                    <option value="date-desc">가입일 내림차순</option>
                                </select>
                            </div>

                            {/* 🆕 엑셀 다운로드 버튼 */}
                            <div className="mb-4 flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    선택된 사용자: {selectedUsers.length}명
                                </div>
                                <button
                                    onClick={handleUsersExcelDownload}
                                    disabled={selectedUsers.length === 0}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                    title="선택된 회원정보를 엑셀 파일로 다운로드"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>엑셀 다운로드</span>
                                </button>
                            </div>

                            {/* 사용자 테이블 */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.length === users.length && users.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전화번호</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예치금</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 로그인</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sortedUsers.map((user) => (
                                            <tr key={user.id} className={changedUsers.has(user.id) ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.includes(user.id)}
                                                        onChange={() => toggleUserSelect(user.id)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 font-mono">{user.id}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{user.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{user.phone || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">₩{user.balance.toLocaleString()}</div>
                                                    {user.totalSpent && (
                                                        <div className="text-sm text-gray-500">사용: ₩{user.totalSpent.toLocaleString()}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {user.is_active ? '활성' : '비활성'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(user.created_at || new Date()).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handleUserStatusToggle(user.id, user.is_active || false)}
                                                        className={`text-sm px-3 py-1 rounded-md ${user.is_active
                                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            }`}
                                                    >
                                                        {user.is_active ? '비활성화' : '활성화'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 예치금 관리 탭 */}
                {activeTab === 'deposits' && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">예치금 관리</h3>
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    placeholder="이름 또는 이메일로 검색..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">모든 역할</option>
                                    <option value="user">일반 사용자</option>
                                    <option value="admin">관리자</option>
                                </select>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">모든 상태</option>
                                    <option value="active">활성</option>
                                    <option value="inactive">비활성</option>
                                </select>
                                <select
                                    value={selectedSort}
                                    onChange={(e) => setSelectedSort(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="balance-desc">예치금 높은순</option>
                                    <option value="balance-asc">예치금 낮은순</option>
                                    <option value="name-asc">이름 오름차순</option>
                                    <option value="name-desc">이름 내림차순</option>
                                    <option value="date-asc">가입일 오름차순</option>
                                    <option value="date-desc">가입일 내림차순</option>
                                </select>
                            </div>
                            {/* 🆕 엑셀 다운로드 버튼 */}
                            <div className="mb-4 flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    선택된 사용자: {selectedUsers.length}명
                                </div>
                                <button
                                    onClick={handleDepositsExcelDownload}
                                    disabled={selectedUsers.length === 0}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                    title="선택된 예치금정보를 엑셀 파일로 다운로드"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>엑셀 다운로드</span>
                                </button>
                            </div>
                            <div className="overflow-x-auto mb-6">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.length === users.length && users.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전화번호</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예치금</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 로그인</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sortedUsers.map((user) => (
                                            <tr key={user.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.includes(user.id)}
                                                        onChange={() => toggleUserSelect(user.id)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 font-mono">{user.id}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{user.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{user.phone || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">₩{user.balance.toLocaleString()}</div>
                                                    {user.totalSpent && (
                                                        <div className="text-sm text-gray-500">사용: ₩{user.totalSpent.toLocaleString()}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {user.is_active ? '활성' : '비활성'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(user.created_at || new Date()).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="border-t pt-6">
                                <h4 className="text-md font-medium text-gray-900 mb-4">일괄 예치금 처리</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">선택된 사용자</label>
                                        <div className="text-sm text-gray-600">
                                            {selectedUsers.length}명 선택됨
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">금액</label>
                                        <input
                                            type="number"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            placeholder="금액을 입력하세요"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">처리 방식</label>
                                        <select
                                            value={depositType}
                                            onChange={(e) => setDepositType(e.target.value as 'add' | 'subtract')}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="add">충전</option>
                                            <option value="subtract">차감</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={handleBulkDeposit}
                                    disabled={selectedUsers.length === 0 || !depositAmount}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    일괄 처리
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 분석 탭 */}
                {activeTab === 'analytics' && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">사용자 분석</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mb-3">예치금 분포</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">평균 예치금</span>
                                            <span className="text-sm font-medium">₩{stats.averageBalance.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">최고 예치금</span>
                                            <span className="text-sm font-medium">
                                                ₩{Math.max(...users.map(u => u.balance)).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">최저 예치금</span>
                                            <span className="text-sm font-medium">
                                                ₩{Math.min(...users.map(u => u.balance)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mb-3">활성도 분석</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">활성 사용자 비율</span>
                                            <span className="text-sm font-medium">
                                                {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">이번 달 신규 가입</span>
                                            <span className="text-sm font-medium">{stats.newUsersThisMonth}명</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 프로그램 관리 탭 */}
                {activeTab === 'programs' && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">프로그램 권한 관리</h3>

                            {/* 검색 및 필터 */}
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    placeholder="이름 또는 이메일로 검색..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">모든 역할</option>
                                    <option value="user">일반 사용자</option>
                                    <option value="admin">관리자</option>
                                </select>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">모든 상태</option>
                                    <option value="active">활성</option>
                                    <option value="inactive">비활성</option>
                                </select>
                                <select
                                    value={selectedSort}
                                    onChange={(e) => setSelectedSort(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="balance-desc">예치금 높은순</option>
                                    <option value="balance-asc">예치금 낮은순</option>
                                    <option value="name-asc">이름 오름차순</option>
                                    <option value="name-desc">이름 내림차순</option>
                                    <option value="date-asc">가입일 오름차순</option>
                                    <option value="date-desc">가입일 내림차순</option>
                                </select>
                            </div>

                            {/* 프로그램 권한 테이블 */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.length === users.length && users.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">무료</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">1개월</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3개월</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sortedUsers.map((user) => (
                                            <tr key={user.id} className={changedUsers.has(user.id) ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.includes(user.id)}
                                                        onChange={() => toggleUserSelect(user.id)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 font-mono">{user.id}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{user.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={permanentProgramPermissions[user.id]?.free || false}
                                                        onChange={(e) => handleProgramCheckboxChange(user.id, 'free', e.target.checked)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={permanentProgramPermissions[user.id]?.month1 || false}
                                                        onChange={(e) => handleProgramCheckboxChange(user.id, 'month1', e.target.checked)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={permanentProgramPermissions[user.id]?.month3 || false}
                                                        onChange={(e) => handleProgramCheckboxChange(user.id, 'month3', e.target.checked)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {user.is_active ? '활성' : '비활성'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* 🆕 변경된 사용자 정보 표시 */}
                            {changedUsers.size > 0 && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <span className="text-yellow-800 font-medium">
                                                📝 변경된 사용자: {changedUsers.size}명
                                            </span>
                                            <span className="ml-2 text-sm text-yellow-600">
                                                (저장 버튼을 눌러 데이터베이스에 저장하세요)
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                console.log('🔄 변경된 사용자 목록:', Array.from(changedUsers));
                                                console.log('💾 localStorage 상태:', localStorage.getItem('cms_program_permissions'));
                                            }}
                                            className="text-sm text-yellow-600 hover:text-yellow-800 underline"
                                        >
                                            디버그 정보
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 버튼 그룹 */}
                            <div className="mt-6 flex justify-between items-center">
                                <button
                                    onClick={checkDatabaseState}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 font-medium"
                                >
                                    상태 확인 (콘솔)
                                </button>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-600">
                                        선택됨: {selectedUsers.length}명 | 저장 대기: {changedUsers.size}명
                                    </span>
                                    <button
                                        onClick={handleBulkProgramSave}
                                        disabled={selectedUsers.length === 0 || loading}
                                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                                    >
                                        {loading ? '저장 중...' : `선택된 ${selectedUsers.length}명 권한 저장`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}