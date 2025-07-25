// CMS 프로그램 관리 탭 백업 파일
// 원본: frontend/src/pages/admin/CMS.tsx의 프로그램 관리 탭 부분
// 백업 날짜: 2025-01-03

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, CMSUser, ensureUserDefaults } from '../../types/user';
import { getApiUrl } from '../../config/constants';

type CMSStats = {
    totalUsers: number;
    activeUsers: number;
    totalBalance: number;
    monthlyRevenue: number;
    newUsersThisMonth: number;
    averageBalance: number;
};

// 새로운 사용자 목록 가져오기 함수 (예치금 관련 없이)
const fetchUsersBasic = async (token: string, page: number = 1, limit: number = 20, search?: string) => {
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

        const data = await response.json();
        console.log('CMS - 기본 사용자 API 응답:', data);

        // 기본 사용자 정보로 변환
        const convertedUsers: CMSUser[] = data.users.map((user: any) => ({
            id: user.id,
            userId: user.id,
            name: user.username || user.email,
            email: user.email,
            phone: '',
            role: user.role,
            is_active: user.is_active,
            created_at: user.created_at,
            balance: 0,
            deposit_status: 'none',
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
    return await Promise.resolve({} as User);
};

export default function CMSPageBackup() {
    const { user, isAuthenticated, isLoading, updateBalance, refreshUserData: refreshAuthUserData, logout } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<CMSUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'programs'>('programs');
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
            const convertedUsers: CMSUser[] = apiUsers.map(apiUser => ({
                id: apiUser.id,
                userId: apiUser.id,
                name: apiUser.username || apiUser.email,
                email: apiUser.email,
                phone: '',
                role: apiUser.role,
                is_active: apiUser.is_active,
                created_at: apiUser.created_at,
                balance: apiUser.balance,
                deposit_status: apiUser.deposit_status,
                programPermissions: apiUser.program_permissions
            }));
            setUsers(convertedUsers);
            updateStats(convertedUsers);

            // localStorage에서 저장되지 않은 변경사항 복원
            const savedPermissions = localStorage.getItem('cms_program_permissions');
            if (savedPermissions) {
                const parsedPermissions = JSON.parse(savedPermissions);
                setPermanentProgramPermissions(parsedPermissions);
                console.log('CMS - localStorage에서 권한 복원:', parsedPermissions);
            }

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
    const updateStats = (userList: User[]) => {
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

    // 사용자 선택 토글
    const toggleUserSelect = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // 전체 선택 토글
    const toggleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(user => user.id));
        }
    };

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

    // 필터링된 사용자 목록
    const filteredUsers = users.filter(user => {
        const matchesSearch = searchTerm === '' ||
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = selectedRole === 'all' || user.role === selectedRole;
        const matchesStatus = selectedStatus === 'all' ||
            (selectedStatus === 'active' && user.is_active) ||
            (selectedStatus === 'inactive' && !user.is_active);

        return matchesSearch && matchesRole && matchesStatus;
    });

    // 정렬된 사용자 목록
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
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case 'date-desc':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            default:
                return 0;
        }
    });

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
                        <button
                            onClick={refreshUserData}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            데이터 새로고침
                        </button>
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
                <div className="border-b border-gray-200 mb-8">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'overview', name: '개요' },
                            { id: 'users', name: '회원 관리' },
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
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

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
