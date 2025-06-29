'use client';

import { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/constants';

// AuthContext의 User 타입 재정의 (임시)
interface User {
  id: string;
  userId: string;
  email?: string;
  name: string;
  role: 'admin' | 'user';
  balance: number;
}

interface Transaction {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  reference_id: string;
  description: string;
  created_at: string;
}

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | undefined;
}

export default function TransactionHistoryModal({ isOpen, onClose, user, accessToken }: TransactionHistoryModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isOpen || !user || !accessToken) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRANSACTIONS}/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error('트랜잭션 내역을 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [isOpen, user, accessToken]);

  if (!isOpen || !user) return null;

  // 트랜잭션 타입에 따른 스타일 및 텍스트
  const getTransactionTypeStyle = (type: string) => {
    if (type === 'DEPOSIT') {
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        text: '입금'
      };
    } else if (type === 'WITHDRAW') {
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        text: '출금'
      };
    } else if (type === 'SERVICE_USAGE') {
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        text: '서비스 이용'
      };
    } else {
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        text: '기타'
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white w-full max-w-3xl mx-auto rounded-lg shadow-lg p-6">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            예치금 거래내역
          </h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 사용자 정보 */}
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">사용자:</span>
            <span className="font-medium">{user.name} ({user.email})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">현재 잔액:</span>
            <span className="text-lg font-bold text-blue-600">{user.balance.toLocaleString()}원</span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* 트랜잭션 목록 */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : transactions.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거래 타입
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    잔액
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => {
                  const typeStyle = getTransactionTypeStyle(transaction.transaction_type);
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(transaction.created_at).toLocaleString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${typeStyle.bgColor} ${typeStyle.textColor}`}>
                          {typeStyle.text}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className={`text-sm font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()}원
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.balance_after.toLocaleString()}원
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {transaction.description}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10 text-gray-500">
              거래 내역이 없습니다.
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
