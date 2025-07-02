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

// 실제 API 연동 함수들
const fetchUsersFromAPI = async (token: string): Promise<User[]> => {
    console.log('CMS - API 호출 시작:', `/api/deposits/users?skip=0&limit=100`);
    console.log('CMS - 토큰:', token ? `${token.substring(0, 20)}...` : '토큰 없음');

    const response = await fetch(`${getApiUrl()}/api/deposits/users?skip=0&limit=100`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    console.log('CMS - API 응답 상태:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('CMS - API 오류:', errorText);
        throw new Error(`사용자 목록을 불러오지 못했습니다: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('CMS - API 응답 데이터:', data);
    return data;
};



const updateUserStatusAPI = async (token: string, userId: string, isActive: boolean): Promise<User> => {
    const response = await fetch(`${getApiUrl()}/api/deposits/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
    });
    if (!response.ok) throw new Error('사용자 상태 변경에 실패했습니다');
    return await response.json();
};

const updateUserRoleAPI = async (token: string, userId: string, role: string): Promise<User> => {
    const response = await fetch(`${getApiUrl()}/api/deposits/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
    });
    if (!response.ok) throw new Error('사용자 역할 변경에 실패했습니다');
    return await response.json();
};

export default function CMSPage() {
    const { user, isAuthenticated, isLoading, updateBalance } = useAuth();
    const navigate = useNavigate();
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
    const [programPermissions, setProgramPermissions] = useState<{ [userId: string]: { free: boolean, month1: boolean, month3: boolean } }>({});

    // 무한루프 방지를 위한 ref들
    const dataLoadedRef = useRef(false);
    const isInitializedRef = useRef(false);
    const effectRunCountRef = useRef(0);
    const isUpdatingRef = useRef(false);

    // 완전히 독립적인 초기화 - 한 번만 실행
    useEffect(() => {
        if (dataLoadedRef.current) {
            console.log('CMS - 이미 데이터 로드됨, 중복 실행 방지');
            return;
        }

        // 추가 안전장치: 컴포넌트가 마운트된 후에만 실행
        const timer = setTimeout(() => {
            if (!dataLoadedRef.current) {
                console.log('CMS - 완전 독립적 초기화 시작');
                dataLoadedRef.current = true;
                loadData();
                console.log('CMS - 완전 독립적 초기화 완료');
            }
        }, 100); // 100ms 지연으로 안정성 확보

        return () => {
            clearTimeout(timer);
        };
    }, []); // 빈 의존성 배열 - 한 번만 실행

    const loadData = async () => {
        // 상태 디버깅용 로그 추가
        console.log('CMS DEBUG - user:', user);
        console.log('CMS DEBUG - isAuthenticated:', isAuthenticated);

        // 무한루프 방지: 이미 업데이트 중인지 확인
        if (isUpdatingRef.current) {
            console.log('CMS - 이미 데이터 로드 중, 중복 호출 차단');
            return;
        }

        try {
            console.log('CMS loadData 시작');
            isUpdatingRef.current = true;
            setLoading(true);
            setError(null);

            // 권한 체크
            if (!isAuthenticated || user?.role !== 'admin') {
                console.log('관리자 권한 없음');
                setError('관리자 권한이 필요합니다.');
                setLoading(false);
                return;
            }

            // 토큰 체크
            if (!user?.token) {
                console.log('인증 토큰 없음');
                setError('인증 토큰이 필요합니다.');
                setLoading(false);
                return;
            }

            // 실제 API 호출
            const apiUsers = await fetchUsersFromAPI(user.token);
            console.log('CMS - API 응답 원본:', apiUsers);

            const convertedUsers: CMSUser[] = apiUsers.map(apiUser => {
                // 백엔드 API 응답을 프론트엔드 User 타입으로 변환
                const convertedUser = {
                    id: apiUser.id,
                    userId: apiUser.id, // 백엔드에서는 id가 사용자 ID
                    name: apiUser.name,
                    email: apiUser.email,
                    role: apiUser.role,
                    balance: apiUser.balance,
                    is_active: apiUser.is_active, // 백엔드: is_active -> 프론트엔드: is_active
                    created_at: apiUser.created_at || new Date().toISOString().split('T')[0], // 백엔드: created_at -> 프론트엔드: created_at
                    programs: apiUser.programs || [],
                    // 프로그램 권한을 programs 배열에서 추출
                    programPermissions: {
                        free: apiUser.programs?.some(p => p.program_name === 'free' && p.is_allowed) || false,
                        month1: apiUser.programs?.some(p => p.program_name === 'month1' && p.is_allowed) || false,
                        month3: apiUser.programs?.some(p => p.program_name === 'month3' && p.is_allowed) || false
                    }
                };

                console.log('CMS - 변환된 사용자:', convertedUser);
                return convertedUser as CMSUser;
            });
            setUsers(convertedUsers);

            const mockStats: CMSStats = {
                totalUsers: convertedUsers.length,
                activeUsers: convertedUsers.filter(u => u.is_active).length,
                totalBalance: convertedUsers.reduce((sum, u) => sum + u.balance, 0),
                monthlyRevenue: 0,
                newUsersThisMonth: 0,
                averageBalance: convertedUsers.reduce((sum, u) => sum + u.balance, 0) / convertedUsers.length
            };
            setStats(mockStats);

            console.log('CMS loadData 완료');
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            // 업데이트 완료 후 플래그 해제 (지연 실행)
            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 100);
        }
    };

    // 사용자 데이터 새로고침
    const refreshUserData = async () => {
        try {
            if (!user?.token) {
                setError('인증 토큰이 필요합니다.');
                return;
            }

            const apiUsers = await fetchUsersFromAPI(user.token);
            const convertedUsers: CMSUser[] = apiUsers.map(apiUser =>
                ensureUserDefaults(apiUser) as CMSUser
            );
            setUsers(convertedUsers);
            setStats({
                totalUsers: convertedUsers.length,
                activeUsers: convertedUsers.filter(u => u.is_active).length,
                totalBalance: convertedUsers.reduce((sum, u) => sum + u.balance, 0),
                monthlyRevenue: 0,
                newUsersThisMonth: 0,
                averageBalance: convertedUsers.reduce((sum, u) => sum + u.balance, 0) / convertedUsers.length
            });
            setSuccessMessage('사용자 데이터가 새로고침되었습니다.');
        } catch (error) {
            console.error('사용자 데이터 새로고침 실패:', error);
            setError('사용자 데이터 새로고침에 실패했습니다.');
        }
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

            // 현재 표시된 사용자 목록을 그대로 사용 (예치금 계산은 API 호출 시에만)
            const updatedUsers = users.map(cmsUser => {
                if (selectedUsers.includes(cmsUser.id)) {
                    console.log(`CMS - 사용자 ${cmsUser.id} 예치금 업데이트 대상 선택`);
                    return cmsUser; // 원본 정보 그대로 유지
                }
                return cmsUser;
            });

            // 실제 API 업데이트 - 예치금 전용 API 사용
            console.log('CMS - 예치금 업데이트 시작:', {
                selectedUsers,
                amount,
                depositType,
                apiUrl: getApiUrl()
            });

            const updatedApiUsers = await Promise.all(updatedUsers.map(async (apiUser) => {
                if (selectedUsers.includes(apiUser.id)) {
                    console.log(`CMS - 사용자 ${apiUser.id} 예치금 업데이트 시작`);

                    // 입력된 금액을 그대로 사용 (API에서 현재 잔액에 추가/차감)
                    const amountToChange = depositType === 'add' ? amount : -amount;

                    console.log(`CMS - 사용자 ${apiUser.id} 예치금 계산 상세:`, {
                        currentBalance: apiUser.balance || 0,
                        amountToChange,
                        depositType,
                        inputAmount: amount
                    });

                    // 예치금 전용 API 호출 (deposits API 사용)
                    const requestBody = {
                        amount: amountToChange, // 실제 변경할 금액
                        description: `관리자 ${depositType === 'add' ? '충전' : '차감'}: ${amount.toLocaleString()}원`
                    };

                    console.log('CMS - API 요청 정보:', {
                        url: `/api/deposits/users/${apiUser.id}/balance`,
                        method: 'PATCH',
                        body: requestBody,
                        token: user?.token ? '토큰 있음' : '토큰 없음'
                    });

                    const response = await fetch(`${getApiUrl()}/api/deposits/users/${apiUser.id}/balance`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${user?.token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });

                    console.log('CMS - API 응답 정보:', {
                        status: response.status,
                        statusText: response.statusText,
                        ok: response.ok
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('CMS - 예치금 업데이트 API 오류:', {
                            status: response.status,
                            statusText: response.statusText,
                            errorText,
                            requestBody,
                            userId: apiUser.id,
                            url: `/api/deposits/users/${apiUser.id}/balance`,
                            method: 'PATCH'
                        });
                        throw new Error(`예치금 업데이트에 실패했습니다: ${response.status} ${response.statusText} - ${errorText}`);
                    }

                    const result = await response.json();
                    console.log('CMS - 예치금 업데이트 API 성공:', result);
                    console.log('CMS - 응답 구조 확인:', {
                        success: result.success,
                        hasData: !!result.data,
                        dataKeys: result.data ? Object.keys(result.data) : 'no data',
                        newBalance: result.data?.new_balance,
                        oldBalance: result.data?.old_balance
                    });

                    // 성공 응답에서 새로운 잔액을 사용하여 사용자 정보 업데이트
                    if (result.success && result.data) {
                        console.log(`CMS - 예치금 업데이트 성공, 새로운 잔액: ${result.data.new_balance}`);

                        // 🎯 새로운 단순 방식: 현재 로그인한 사용자인 경우만 즉시 업데이트
                        const currentUserIdForEvent = user?.userId || user?.id;
                        if (user && currentUserIdForEvent && apiUser.id === currentUserIdForEvent) {
                            console.log('💰 CMS - 현재 로그인 사용자 예치금 변경, 즉시 업데이트');
                            console.log('💰 CMS - updateBalance 호출 전 사용자 상태:', {
                                userId: user.userId,
                                role: user.role,
                                isAdmin: user.role === 'admin',
                                oldBalance: user.balance,
                                newBalance: result.data.new_balance,
                                userObject: user
                            });

                            // AuthContext의 updateBalance 사용 (role 보존하며 예치금만 업데이트)
                            if (updateBalance) {
                                await updateBalance(user, result.data.new_balance);
                                console.log('💰 CMS - updateBalance 호출 후 완료, 업데이트된 잔액:', result.data.new_balance);
                            }
                        } else {
                            console.log('💰 CMS - 다른 사용자 예치금 변경, 페이지 새로고침 안내');
                        }

                        // 원본 사용자 정보에 새로운 잔액만 업데이트 (UI 반영용)
                        const updatedUser = {
                            ...apiUser,
                            balance: result.data.new_balance
                        };
                        console.log(`CMS - 사용자 ${apiUser.id} 잔액 업데이트:`, updatedUser);
                        return updatedUser;
                    } else {
                        console.warn(`CMS - 예치금 업데이트 응답 형식 오류:`, result);
                        // 응답 형식이 예상과 다르면 원본 정보 반환
                        return apiUser;
                    }

                }
                return apiUser;
            }));

            // User 타입으로 변환하여 상태 업데이트
            const convertedUsers: CMSUser[] = updatedApiUsers.map(apiUser =>
                ensureUserDefaults(apiUser) as CMSUser
            );
            setUsers(convertedUsers);

            // 통계 업데이트
            updateStats(updatedApiUsers);

            // 예치금 업데이트 완료 로그
            console.log('CMS - 예치금 업데이트 완료:', {
                selectedUsers,
                totalUpdated: selectedUsers.length,
                action: depositType === 'add' ? '충전' : '차감',
                amount: amount.toLocaleString()
            });

            const actionText = depositType === 'add' ? '충전' : '차감';
            setSuccessMessage(`${selectedUsers.length}명의 사용자에게 ${amount.toLocaleString()}원을 ${actionText}했습니다.`);
            setSelectedUsers([]);
            setDepositAmount('');

            // 디버깅: 최종 결과 로그
            console.log('🎉 CMS - 예치금 일괄 처리 완료:', {
                processedUsers: selectedUsers.length,
                action: actionText,
                amount: amount.toLocaleString(),
                finalUsersState: convertedUsers.map(u => ({ id: u.id, name: u.name, balance: u.balance }))
            });

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('예치금 처리 중 오류:', error);

            // 더 자세한 에러 메시지 제공
            let errorMessage = '예치금 처리 중 오류가 발생했습니다.';
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            setError(errorMessage);

            // 백엔드 서버 연결 상태 확인
            try {
                const healthCheck = await fetch(`/health`);
                if (!healthCheck.ok) {
                    setError('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
                }
            } catch (healthError) {
                setError('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
            }
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
            const updatedUser = await updateUserStatusAPI(user.token, userId, !currentStatus);

            // User 타입으로 변환하여 상태 업데이트
            const convertedUser: CMSUser = ensureUserDefaults(updatedUser) as CMSUser;
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId ? convertedUser : user
                )
            );
            setStats({
                ...stats,
                activeUsers: updatedUser.is_active ? stats.activeUsers + 1 : stats.activeUsers - 1
            });

            setSuccessMessage('사용자 상태가 변경되었습니다.');
        } catch (error) {
            console.error('사용자 상태 변경 실패:', error);
            setError('사용자 상태 변경 중 오류가 발생했습니다.');
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

    const handleProgramPermissionChange = (userId: string, permission: 'free' | 'month1' | 'month3', value: boolean) => {
        // 프로그램 권한 변경 중 플래그 설정 (무한루프 방지)
        sessionStorage.setItem('PROGRAM_PERMISSION_CHANGING', 'true');

        // 1. 현재 users 상태 업데이트
        setUsers(prevUsers =>
            prevUsers.map(user =>
                user.id === userId
                    ? {
                        ...user,
                        programPermissions: {
                            free: user.programPermissions?.free || false,
                            month1: user.programPermissions?.month1 || false,
                            month3: user.programPermissions?.month3 || false,
                            [permission]: value
                        }
                    }
                    : user
            )
        );

        // 5. 성공 메시지 표시
        setSuccessMessage(`${permission} 프로그램 권한이 ${value ? '활성화' : '비활성화'}되었습니다.`);
        setTimeout(() => setSuccessMessage(null), 2000);

        // 6. 프로그램 권한 변경 완료 후 플래그 해제 (500ms 후)
        setTimeout(() => {
            sessionStorage.removeItem('PROGRAM_PERMISSION_CHANGING');
            console.log('CMS - 프로그램 권한 변경 완료, 플래그 해제');
        }, 500);
    };

    const handleBulkProgramPermission = async (permission: 'free' | 'month1' | 'month3', value: string) => {
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

            // 실제 API 호출
            const apiUsers = await fetchUsersFromAPI(user.token);
            const updatedUsers = apiUsers.map(user => {
                if (selectedUsers.includes(user.id)) {
                    return {
                        ...user,
                        programPermissions: {
                            ...user.programPermissions,
                            [permission]: value === 'true'
                        }
                    };
                }
                return user;
            });

            // 실제 API 업데이트
            const updatedApiUsers = await Promise.all(updatedUsers.map(async (user) => {
                if (selectedUsers.includes(user.id)) {
                    const updatedUser = await updateUserRoleAPI(user.token!, user.id, value === 'true' ? 'admin' : 'user');
                    return updatedUser;
                }
                return user;
            }));

            // User 타입으로 변환하여 상태 업데이트
            const convertedUsers: CMSUser[] = updatedApiUsers.map(apiUser => {
                const userWithDefaults = ensureUserDefaults(apiUser);
                return {
                    ...userWithDefaults,
                    programPermissions: {
                        free: userWithDefaults.programPermissions?.free || false,
                        month1: userWithDefaults.programPermissions?.month1 || false,
                        month3: userWithDefaults.programPermissions?.month3 || false
                    }
                } as CMSUser;
            });
            setUsers(convertedUsers);

            // 통계 업데이트
            updateStats(updatedApiUsers);

            setSuccessMessage(`${selectedUsers.length}명의 사용자에게 ${permission} 프로그램 권한을 ${value === 'true' ? '부여' : '해제'}했습니다.`);
            setSelectedUsers([]);

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('프로그램 권한 처리 중 오류:', error);
            setError('프로그램 권한 처리 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkProgramSave = async () => {
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

            // 실제 API 호출
            const apiUsers = await fetchUsersFromAPI(user.token);
            const updatedUsers = apiUsers.map(user => {
                if (selectedUsers.includes(user.id)) {
                    // 현재 users 상태에서 해당 사용자의 programPermissions를 가져옴
                    const currentUser = users.find(u => u.id === user.id);
                    return {
                        ...user,
                        programPermissions: currentUser?.programPermissions || user.programPermissions
                    };
                }
                return user;
            });

            // 실제 API 업데이트
            const updatedApiUsers = await Promise.all(updatedUsers.map(async (user) => {
                if (selectedUsers.includes(user.id)) {
                    const updatedUser = await updateUserRoleAPI(user.token!, user.id, 'admin');
                    return updatedUser;
                }
                return user;
            }));

            // User 타입으로 변환하여 상태 업데이트
            const convertedUsers: CMSUser[] = updatedApiUsers.map(apiUser =>
                ensureUserDefaults(apiUser) as CMSUser
            );
            setUsers(convertedUsers);

            // 통계 업데이트
            updateStats(updatedApiUsers);

            setSuccessMessage('선택된 사용자의 프로그램 권한이 일괄 저장되었습니다.');
            setSelectedUsers([]);

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('프로그램 권한 저장 중 오류:', error);
            setError('프로그램 권한 저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

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
                            >
                                {tab.name}
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
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예치금</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 로그인</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
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

                            {/* 사용자 테이블 */}
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

                            {/* 일괄 예치금 관리 */}
                            <div className="border-t pt-6">
                                <h4 className="text-md font-medium text-gray-900 mb-4">일괄 예치금 관리</h4>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">작업 유형</label>
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

                            {/* 일괄 프로그램 권한 관리 */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h4 className="text-md font-medium text-gray-900 mb-4">일괄 프로그램 권한 관리</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">선택된 사용자</label>
                                        <div className="text-sm text-gray-600">
                                            {selectedUsers.length}명 선택됨
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">프로그램</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            onChange={(e) => {
                                                const [permission, value] = e.target.value.split(':');
                                                if (permission && value) {
                                                    handleBulkProgramPermission(permission as 'free' | 'month1' | 'month3', value);
                                                }
                                            }}
                                        >
                                            <option value="">프로그램 선택</option>
                                            <option value="free:true">무료 버전 활성화</option>
                                            <option value="free:false">무료 버전 비활성화</option>
                                            <option value="month1:true">1개월 버전 활성화</option>
                                            <option value="month1:false">1개월 버전 비활성화</option>
                                            <option value="month3:true">3개월 버전 활성화</option>
                                            <option value="month3:false">3개월 버전 비활성화</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">작업</label>
                                        <button
                                            onClick={handleBulkProgramSave}
                                            disabled={selectedUsers.length === 0}
                                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            일괄 저장
                                        </button>
                                    </div>
                                </div>
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
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">무료</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">1개월</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3개월</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
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
                                                    <input
                                                        type="checkbox"
                                                        checked={user.programPermissions?.free || false}
                                                        onChange={(e) => handleProgramPermissionChange(user.id, 'free', e.target.checked)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={user.programPermissions?.month1 || false}
                                                        onChange={(e) => handleProgramPermissionChange(user.id, 'month1', e.target.checked)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={user.programPermissions?.month3 || false}
                                                        onChange={(e) => handleProgramPermissionChange(user.id, 'month3', e.target.checked)}
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
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 