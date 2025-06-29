'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/constants';

export default function BalanceDisplay() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  // 예치금 새로고침 함수
  const refreshBalance = async () => {
    if (!user) return;

    try {
      setIsRefreshing(true);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BALANCE}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('예치금 정보를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setBalance(data.balance);

    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">예치금 잔액</h2>
          <p className="text-gray-600 text-sm">현재 사용 가능한 예치금 잔액입니다.</p>
        </div>
        <button
          onClick={refreshBalance}
          className="flex items-center text-blue-600 hover:text-blue-800 focus:outline-none"
          disabled={isRefreshing}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{isRefreshing ? '새로고침 중...' : '최신 정보'}</span>
        </button>
      </div>

      <div className="mt-4">
        <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-700">현재 잔액</p>
            <p className="text-2xl font-bold text-blue-800">
              {balance !== null
                ? `${balance.toLocaleString()}원`
                : user?.balance
                  ? `${user.balance.toLocaleString()}원`
                  : '잔액 확인 필요'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-600">무통장 입금 계좌</p>
            <p className="text-sm font-medium text-blue-800">신한은행 123-456-789012</p>
            <p className="text-xs text-blue-600">(주)큐클릭</p>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <p>• 무통장 입금 후 관리자 확인 시 예치금이 충전됩니다.</p>
          <p>• 입금자명은 회원 이메일 아이디를 기재해 주세요.</p>
          <p>• 예치금은 서비스 이용 시 자동으로 차감됩니다.</p>
        </div>

        <div className="mt-4 flex space-x-2">
          <a
            href="/payments/charge"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            충전하기
          </a>
          <a
            href="/payments/history"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            충전 내역
          </a>
        </div>
      </div>
    </div>
  );
}
