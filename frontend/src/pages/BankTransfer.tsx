import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config/constants';

interface BankTransferForm {
    userId: string;
    depositorName: string;
    amount: number;
    phoneNumber: string;
    note: string;
}

export default function BankTransfer() {
    const { user, isAuthenticated } = useAuth();
    const [formData, setFormData] = useState<BankTransferForm>({
        userId: user?.userId || user?.id || '',
        depositorName: '',
        amount: 0,
        phoneNumber: '',
        note: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    // 무통장 입금 정보
    const BANK_INFO = {
        bankName: "농협은행",
        accountNumber: "312-0038-5739-21",
        accountHolder: "최호진",
        phoneNumber: "010-5904-2213"
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 로그인한 사용자의 경우 자동으로 userId 설정
        if (isAuthenticated && user) {
            formData.userId = user.userId || user.id || '';
        }

        // userId 검증
        if (!formData.userId) {
            setMessage('사용자 ID가 필요합니다.');
            return;
        }

        if (!formData.depositorName || !formData.amount || !formData.phoneNumber) {
            setMessage('모든 필수 항목을 입력해주세요.');
            return;
        }

        if (formData.amount < 1000) {
            setMessage('최소 입금 금액은 1,000원입니다.');
            return;
        }

        setIsSubmitting(true);
        setMessage('입금 신청을 처리 중입니다...');

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            // 로그인한 사용자의 경우 토큰 추가 (필수)
            if (isAuthenticated && user?.token) {
                headers['Authorization'] = `Bearer ${user.token}`;
            } else {
                setMessage('❌ 로그인이 필요합니다. 무통장 입금 신청을 위해서는 회원가입 후 로그인이 필요합니다.');
                return;
            }

            const response = await fetch(`${getApiUrl()}/api/deposits/bank-transfer-request`, {
                method: 'POST',
                headers,
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                setMessage('✅ 입금 신청이 완료되었습니다. 입금 후 관리자 확인 시 예치금이 충전됩니다.');

                // 폼 초기화
                setFormData(prev => ({
                    ...prev,
                    depositorName: '',
                    amount: 0,
                    phoneNumber: '',
                    note: ''
                }));
            } else {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                setMessage(`❌ 입금 신청 실패: ${errorData.detail || response.statusText}`);
            }
        } catch (error) {
            console.error('입금 신청 오류:', error);
            setMessage('❌ 입금 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setMessage('계좌번호가 클립보드에 복사되었습니다.');
            setTimeout(() => setMessage(''), 2000);
        });
    };

    return (
        <div className="page-container py-6">
            <div className="max-w-2xl mx-auto">
                {/* 헤더 */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-light text-gray-800 mb-2">💰 무통장 입금 신청</h1>
                    <p className="text-gray-600">입금 정보를 입력하시면 관리자에게 알림이 발송됩니다.</p>

                    {/* 로그인 상태 표시 */}
                    {isAuthenticated ? (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                            ✅ 로그인된 사용자: {user?.name || user?.userId} ({user?.userId || user?.id})
                        </div>
                    ) : (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            ❌ 로그인이 필요합니다. 무통장 입금 신청을 위해서는 회원가입 후 로그인이 필요합니다.
                            <div className="mt-2">
                                <a href="/signup" className="text-blue-600 hover:text-blue-800 underline">회원가입하기</a> |
                                <a href="/login" className="text-blue-600 hover:text-blue-800 underline ml-2">로그인하기</a>
                            </div>
                        </div>
                    )}
                </div>

                {/* 메시지 표시 */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
                        message.includes('❌') ? 'bg-red-50 text-red-800 border border-red-200' :
                            'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                        {message}
                    </div>
                )}

                <div className="space-y-6">
                    {/* 입금 계좌 정보 */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-medium text-gray-800 mb-4">🏦 입금 계좌 정보</h2>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded border">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">은행</span>
                                    <span className="text-sm text-gray-600">{BANK_INFO.bankName}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">계좌번호</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600 font-mono">{BANK_INFO.accountNumber}</span>
                                        <button
                                            onClick={() => copyToClipboard(BANK_INFO.accountNumber)}
                                            className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
                                        >
                                            복사
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">예금주</span>
                                    <span className="text-sm text-gray-600">{BANK_INFO.accountHolder}</span>
                                </div>
                            </div>

                            <div className="bg-yellow-50 p-4 rounded border">
                                <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ 입금 시 주의사항</h3>
                                <ul className="text-xs text-yellow-700 space-y-1">
                                    <li>• 입금자명을 정확히 입력해주세요</li>
                                    <li>• 입금 후 관리자 확인 시 예치금이 충전됩니다</li>
                                    <li>• 확인은 평일 09:00~18:00에 처리됩니다</li>
                                    <li>• 긴급 문의: {BANK_INFO.phoneNumber}</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* 입금 신청 폼 */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-medium text-gray-800 mb-4">📝 입금 신청서</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* 사용자 ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    사용자 ID *
                                </label>
                                <input
                                    type="text"
                                    name="userId"
                                    value={formData.userId}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isAuthenticated ? 'bg-gray-100' : ''
                                        }`}
                                    readOnly={isAuthenticated}
                                    placeholder={isAuthenticated ? '' : '사용자 ID를 입력하세요'}
                                    required
                                />
                                {isAuthenticated && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        로그인된 사용자 ID가 자동으로 설정됩니다.
                                    </p>
                                )}
                            </div>

                            {/* 입금자명 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    입금자명 *
                                </label>
                                <input
                                    type="text"
                                    name="depositorName"
                                    value={formData.depositorName}
                                    onChange={handleInputChange}
                                    placeholder="실제 입금하실 분의 이름"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* 입금 금액 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    입금 금액 *
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount || ''}
                                    onChange={handleInputChange}
                                    placeholder="1000"
                                    min="1000"
                                    step="1000"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">최소 1,000원부터 가능</p>
                            </div>

                            {/* 연락처 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    연락처 *
                                </label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="010-1234-5678"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* 메모 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    메모 (선택)
                                </label>
                                <textarea
                                    name="note"
                                    value={formData.note}
                                    onChange={handleInputChange}
                                    placeholder="추가로 전달하고 싶은 내용이 있으시면 입력해주세요"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* 제출 버튼 */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${isSubmitting
                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                {isSubmitting ? '처리 중...' : '입금 신청하기'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* 추가 안내사항 */}
                <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-medium text-blue-800 mb-3">📞 문의 및 안내</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                        <div>
                            <p><strong>관리자 전화:</strong> {BANK_INFO.phoneNumber}</p>
                            <p><strong>운영시간:</strong> 평일 09:00 ~ 18:00</p>
                        </div>
                        <div>
                            <p><strong>카카오톡 문의:</strong> 채널에서 실시간 상담</p>
                            <p><strong>처리시간:</strong> 입금 확인 후 즉시 처리</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 