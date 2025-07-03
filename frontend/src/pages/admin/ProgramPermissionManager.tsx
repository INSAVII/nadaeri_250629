import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, CMSUser } from '../../types/user';
import { getApiUrl } from '../../config/constants';

// 타입 정의
interface ProgramPermissions {
    free: boolean;
    month1: boolean;
    month3: boolean;
}

interface UserWithPermissions extends CMSUser {
    programPermissions: ProgramPermissions;
}

interface ApiResponse {
    users: UserWithPermissions[];
    total: number;
}

// API 함수들
const fetchUsersWithPermissions = async (token: string): Promise<UserWithPermissions[]> => {
    try {
        const response = await fetch(`${getApiUrl()}/api/auth/users?skip=0&limit=100`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();

        return data.users.map(user => ({
            ...user,
            programPermissions: {
                free: user.program_permissions_free || false,
                month1: user.program_permissions_month1 || false,
                month3: user.program_permissions_month3 || false
            }
        }));
    } catch (error) {
        console.error('사용자 목록 가져오기 실패:', error);
        throw error;
    }
};

const updateUserPermissions = async (
    token: string,
    userId: string,
    permissions: ProgramPermissions
): Promise<void> => {
    try {
        const response = await fetch(`${getApiUrl()}/api/auth/admin/update-user-program-permissions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_id: userId,
                permissions
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`권한 업데이트 실패: ${response.status} ${response.statusText} - ${errorText}`);
        }
    } catch (error) {
        console.error('권한 업데이트 실패:', error);
        throw error;
    }
};

// 프로그램 권한 테이블 컴포넌트
interface ProgramPermissionTableProps {
    users: UserWithPermissions[];
    onPermissionChange: (userId: string, permissions: ProgramPermissions) => void;
    loading: boolean;
}

const ProgramPermissionTable: React.FC<ProgramPermissionTableProps> = ({
    users,
    onPermissionChange,
    loading
}) => {
    const handleCheckboxChange = (userId: string, programType: keyof ProgramPermissions, checked: boolean) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        const newPermissions = {
            ...user.programPermissions,
            [programType]: checked
        };

        onPermissionChange(userId, newPermissions);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                사용자가 없습니다.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            사용자 정보
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            무료
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            1개월
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            3개월
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상태
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                    <div className="text-xs text-gray-400 font-mono">ID: {user.id}</div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={user.programPermissions.free}
                                    onChange={(e) => handleCheckboxChange(user.id, 'free', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={user.programPermissions.month1}
                                    onChange={(e) => handleCheckboxChange(user.id, 'month1', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={user.programPermissions.month3}
                                    onChange={(e) => handleCheckboxChange(user.id, 'month3', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
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
    );
};

// 메인 컴포넌트
export default function ProgramPermissionManager() {
    const { user, isAuthenticated } = useAuth();
    const [users, setUsers] = useState<UserWithPermissions[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Map<string, ProgramPermissions>>(new Map());

    // 초기 데이터 로드
    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin' && user?.token) {
            loadUsers();
        }
    }, [isAuthenticated, user?.role, user?.token]);

    const loadUsers = async () => {
        if (!user?.token) return;

        try {
            setLoading(true);
            setError(null);

            const userList = await fetchUsersWithPermissions(user.token);
            setUsers(userList);
        } catch (error) {
            setError('사용자 목록을 불러오는데 실패했습니다.');
            console.error('사용자 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // 권한 변경 처리
    const handlePermissionChange = (userId: string, permissions: ProgramPermissions) => {
        // 로컬 상태 업데이트
        setUsers(prevUsers =>
            prevUsers.map(user =>
                user.id === userId
                    ? { ...user, programPermissions: permissions }
                    : user
            )
        );

        // 변경사항 추적
        setPendingChanges(prev => new Map(prev.set(userId, permissions)));
    };

    // 변경사항 저장
    const saveChanges = async () => {
        if (!user?.token || pendingChanges.size === 0) return;

        try {
            setLoading(true);
            setError(null);

            let successCount = 0;
            let errorCount = 0;

            // 각 변경사항을 순차적으로 저장
            for (const [userId, permissions] of pendingChanges) {
                try {
                    await updateUserPermissions(user.token, userId, permissions);
                    successCount++;
                } catch (error) {
                    console.error(`사용자 ${userId} 권한 저장 실패:`, error);
                    errorCount++;
                }
            }

            // QCapture 페이지 업데이트 이벤트 전송
            const updatedUsers = Array.from(pendingChanges.entries()).map(([userId, permissions]) => ({
                userId,
                permissions
            }));

            window.dispatchEvent(new CustomEvent('programPermissionSaved', {
                detail: {
                    type: 'bulk_save',
                    users: updatedUsers,
                    timestamp: Date.now()
                }
            }));

            // 성공 메시지 표시
            if (errorCount === 0) {
                setSuccessMessage(`✅ ${successCount}명의 사용자 권한이 성공적으로 저장되었습니다.`);
            } else {
                setSuccessMessage(`⚠️ ${successCount}명 성공, ${errorCount}명 실패. 일부 권한이 저장되지 않았습니다.`);
            }

            // 변경사항 초기화
            setPendingChanges(new Map());

            // 3초 후 메시지 제거
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (error) {
            setError('권한 저장 중 오류가 발생했습니다.');
            console.error('권한 저장 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // 권한 변경 취소
    const cancelChanges = () => {
        setPendingChanges(new Map());
        loadUsers(); // 원본 데이터로 복원
    };

    if (!isAuthenticated || user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">접근 권한이 없습니다</h2>
                    <p className="text-gray-600">관리자 권한이 필요합니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">프로그램 권한 관리</h1>
                            <p className="mt-2 text-gray-600">사용자별 프로그램 접근 권한을 관리합니다.</p>
                        </div>
                        <button
                            onClick={loadUsers}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            새로고침
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

                {/* 변경사항 알림 */}
                {pendingChanges.size > 0 && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="text-yellow-800 font-medium">
                                    📝 변경된 사용자: {pendingChanges.size}명
                                </span>
                                <span className="ml-2 text-sm text-yellow-600">
                                    (저장 버튼을 눌러 변경사항을 적용하세요)
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 메인 컨텐츠 */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <ProgramPermissionTable
                            users={users}
                            onPermissionChange={handlePermissionChange}
                            loading={loading}
                        />

                        {/* 액션 버튼 */}
                        {pendingChanges.size > 0 && (
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={cancelChanges}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    변경 취소
                                </button>
                                <button
                                    onClick={saveChanges}
                                    disabled={loading}
                                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? '저장 중...' : `${pendingChanges.size}명 권한 저장`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 