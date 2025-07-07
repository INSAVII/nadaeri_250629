import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/constants';
import TextButton from '../../components/ui/TextButton';
import Modal from '../../components/ui/Modal';
import Loading from '../../components/ui/Loading';
import SuccessMessage from '../../components/ui/SuccessMessage';
import ErrorMessage from '../../components/ui/ErrorMessage';


interface BankTransferRequest {
    id: number;
    user_id: string;
    depositor_name: string;
    amount: number;
    phone_number: string;
    note: string;
    status: 'pending' | 'confirmed' | 'rejected';
    created_at: string;
    confirmed_at?: string;
    confirmed_by?: string;
}

interface User {
    id: string;
    email: string;
    name: string;
    balance: number;
}

export default function BankTransferManager() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<BankTransferRequest[]>([]);
    const [users, setUsers] = useState<{ [key: string]: User }>({});
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<BankTransferRequest | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);

    // 한국 시간대로 변환하는 함수 (단순화된 형식)
    const formatKoreanTime = (dateString: string) => {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');

        // MM/DD HHhrs 형식으로 반환
        return `${month}/${day} ${hour}hrs`;
    };

    // CSV 다운로드 함수
    const downloadCSV = () => {
        if (requests.length === 0) {
            setError('다운로드할 데이터가 없습니다.');
            return;
        }

        try {
            // CSV 헤더
            const headers = [
                '신청일시',
                '사용자ID',
                '사용자명',
                '이메일',
                '현재잔액',
                '입금자명',
                '금액',
                '연락처',
                '메모',
                '상태',
                '확인일시',
                '확인자'
            ];

            // CSV 데이터 준비
            const csvData = requests.map(request => {
                const userInfo = users[request.user_id];
                return [
                    formatKoreanTime(request.created_at),
                    request.user_id,
                    userInfo?.name || '알 수 없음',
                    userInfo?.email || '알 수 없음',
                    userInfo?.balance?.toLocaleString() || '0',
                    request.depositor_name,
                    request.amount.toLocaleString(),
                    request.phone_number,
                    request.note || '',
                    request.status === 'pending' ? '대기중' :
                        request.status === 'confirmed' ? '확인됨' : '거부됨',
                    request.confirmed_at ? formatKoreanTime(request.confirmed_at) : '',
                    request.confirmed_by || ''
                ];
            });

            // CSV 문자열 생성
            const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            // BOM 추가 (한글 깨짐 방지)
            const BOM = '\uFEFF';
            const csvWithBOM = BOM + csvContent;

            // 파일명 생성 (현재 날짜 포함)
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const fileName = `무통장입금관리_${dateStr}.csv`;

            // CSV 파일 다운로드
            const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setMessage('CSV 파일이 다운로드되었습니다.');
        } catch (error) {
            console.error('CSV 다운로드 오류:', error);
            setError('CSV 파일 생성 중 오류가 발생했습니다.');
        }
    };

    // 입금 신청 목록 조회
    const fetchRequests = async () => {
        try {
            const response = await fetch(`${getApiUrl()}/api/deposits/bank-transfer-requests`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            } else {
                setError('입금 신청 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            setError('서버 연결 오류가 발생했습니다.');
        }
    };

    // 사용자 정보 조회
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${getApiUrl()}/api/deposits/users`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const userMap: { [key: string]: User } = {};
                data.forEach((user: User) => {
                    userMap[user.id] = user;
                });
                setUsers(userMap);
            }
        } catch (error) {
            console.error('사용자 정보 조회 실패:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchRequests(), fetchUsers()]);
            setLoading(false);
        };
        loadData();
    }, []);

    // 입금 확인 처리
    const handleConfirm = async () => {
        if (!selectedRequest) return;

        setProcessing(true);
        try {
            const response = await fetch(`${getApiUrl()}/api/deposits/bank-transfer-requests/${selectedRequest.id}/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    amount: selectedRequest.amount,
                    description: `무통장 입금 확인: ${selectedRequest.depositor_name}`
                })
            });

            if (response.ok) {
                setMessage('입금이 확인되었습니다. 사용자 예치금이 충전되었습니다.');
                setShowConfirmModal(false);
                setSelectedRequest(null);
                fetchRequests(); // 목록 새로고침
            } else {
                const errorData = await response.json();
                setError(errorData.detail || '입금 확인 처리에 실패했습니다.');
            }
        } catch (error) {
            setError('서버 연결 오류가 발생했습니다.');
        } finally {
            setProcessing(false);
        }
    };

    // 입금 거부 처리
    const handleReject = async () => {
        if (!selectedRequest) return;

        setProcessing(true);
        try {
            const response = await fetch(`${getApiUrl()}/api/deposits/bank-transfer-requests/${selectedRequest.id}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                setMessage('입금 신청이 거부되었습니다.');
                setShowRejectModal(false);
                setSelectedRequest(null);
                fetchRequests(); // 목록 새로고침
            } else {
                const errorData = await response.json();
                setError(errorData.detail || '입금 거부 처리에 실패했습니다.');
            }
        } catch (error) {
            setError('서버 연결 오류가 발생했습니다.');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">대기중</span>;
            case 'confirmed':
                return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">확인됨</span>;
            case 'rejected':
                return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">거부됨</span>;
            default:
                return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">{status}</span>;
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="qc-container py-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-light text-gray-800">무통장 입금 관리</h1>
                <div className="flex gap-2">
                    <TextButton
                        onClick={downloadCSV}
                        className="bg-green-600 text-white hover:bg-green-700"
                    >
                        📊 CSV 다운로드
                    </TextButton>
                    <TextButton
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                        새로고침
                    </TextButton>
                </div>
            </div>

            {message && <SuccessMessage message={message} onClose={() => setMessage('')} />}
            {error && <ErrorMessage message={error} onClose={() => setError('')} />}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    신청일시
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    사용자명
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    이메일
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    현재잔액
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    입금자명
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    금액
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    연락처
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    상태
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    작업
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                                        입금 신청이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((request) => (
                                    <tr key={request.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatKoreanTime(request.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="font-medium">{users[request.user_id]?.name || '알 수 없음'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="text-gray-600">{users[request.user_id]?.email || request.user_id}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="font-medium text-blue-600">
                                                {users[request.user_id]?.balance?.toLocaleString() || 0}원
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {request.depositor_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className="font-medium">{request.amount.toLocaleString()}원</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {request.phone_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {request.status === 'pending' && (
                                                <div className="flex space-x-2">
                                                    <TextButton
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setShowConfirmModal(true);
                                                        }}
                                                        className="bg-green-600 text-white hover:bg-green-700 text-xs px-3 py-1"
                                                    >
                                                        확인
                                                    </TextButton>
                                                    <TextButton
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setShowRejectModal(true);
                                                        }}
                                                        className="bg-red-600 text-white hover:bg-red-700 text-xs px-3 py-1"
                                                    >
                                                        거부
                                                    </TextButton>
                                                </div>
                                            )}
                                            {request.status === 'confirmed' && (
                                                <span className="text-green-600 text-xs">
                                                    {request.confirmed_at && formatKoreanTime(request.confirmed_at)}
                                                </span>
                                            )}
                                            {request.status === 'rejected' && (
                                                <span className="text-red-600 text-xs">
                                                    {request.confirmed_at && formatKoreanTime(request.confirmed_at)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 입금 확인 모달 */}
            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title="입금 확인"
            >
                <div className="p-6">
                    <p className="text-gray-700 mb-4">
                        다음 입금 신청을 확인하시겠습니까?
                    </p>
                    {selectedRequest && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">사용자:</span> {users[selectedRequest.user_id]?.name || selectedRequest.user_id}
                                </div>
                                <div>
                                    <span className="font-medium">입금자명:</span> {selectedRequest.depositor_name}
                                </div>
                                <div>
                                    <span className="font-medium">금액:</span> {selectedRequest.amount.toLocaleString()}원
                                </div>
                                <div>
                                    <span className="font-medium">연락처:</span> {selectedRequest.phone_number}
                                </div>
                                {selectedRequest.note && (
                                    <div className="col-span-2">
                                        <span className="font-medium">메모:</span> {selectedRequest.note}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end space-x-3">
                        <TextButton
                            onClick={() => setShowConfirmModal(false)}
                            className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                            disabled={processing}
                        >
                            취소
                        </TextButton>
                        <TextButton
                            onClick={handleConfirm}
                            className="bg-green-600 text-white hover:bg-green-700"
                            disabled={processing}
                        >
                            {processing ? '처리중...' : '확인'}
                        </TextButton>
                    </div>
                </div>
            </Modal>

            {/* 입금 거부 모달 */}
            <Modal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title="입금 거부"
            >
                <div className="p-6">
                    <p className="text-gray-700 mb-4">
                        다음 입금 신청을 거부하시겠습니까?
                    </p>
                    {selectedRequest && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">사용자:</span> {users[selectedRequest.user_id]?.name || selectedRequest.user_id}
                                </div>
                                <div>
                                    <span className="font-medium">입금자명:</span> {selectedRequest.depositor_name}
                                </div>
                                <div>
                                    <span className="font-medium">금액:</span> {selectedRequest.amount.toLocaleString()}원
                                </div>
                                <div>
                                    <span className="font-medium">연락처:</span> {selectedRequest.phone_number}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end space-x-3">
                        <TextButton
                            onClick={() => setShowRejectModal(false)}
                            className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                            disabled={processing}
                        >
                            취소
                        </TextButton>
                        <TextButton
                            onClick={handleReject}
                            className="bg-red-600 text-white hover:bg-red-700"
                            disabled={processing}
                        >
                            {processing ? '처리중...' : '거부'}
                        </TextButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
} 