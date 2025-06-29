'use client';

import { useState } from 'react';
import { User } from '../types/user';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdateBalance: (amount: number, type: 'deposit' | 'withdraw', description: string) => Promise<void>;
}

export default function DepositModal({ isOpen, onClose, user, onUpdateBalance }: DepositModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 입력값 검증
    if (amount <= 0) {
      setError('금액은 0보다 커야 합니다.');
      return;
    }

    if (!description.trim()) {
      setError('설명을 입력해주세요.');
      return;
    }

    // 출금 시 잔액 검증
    if (transactionType === 'withdraw' && amount > user.balance) {
      setError('출금 금액이 현재 잔액보다 클 수 없습니다.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      await onUpdateBalance(amount, transactionType, description);
      // 성공 시 모달 닫기
      handleClose();
    } catch (error) {
      setError((error as Error).message || '예치금 변경 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // 모달 상태 초기화
    setAmount(0);
    setDescription('');
    setTransactionType('deposit');
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 빈 문자열이거나 숫자만 허용
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value === '' ? 0 : parseInt(value, 10));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white w-full max-w-md mx-auto rounded-lg shadow-lg p-6">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            예치금 관리
          </h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={handleClose}
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

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              거래 유형
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600"
                  name="transactionType"
                  checked={transactionType === 'deposit'}
                  onChange={() => setTransactionType('deposit')}
                />
                <span className="ml-2 text-gray-700">입금</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-red-600"
                  name="transactionType"
                  checked={transactionType === 'withdraw'}
                  onChange={() => setTransactionType('withdraw')}
                />
                <span className="ml-2 text-gray-700">출금</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              금액
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                id="amount"
                className="block w-full pr-12 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                value={amount || ''}
                onChange={handleAmountChange}
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">원</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              id="description"
              rows={2}
              className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="예치금 변경 사유를 입력하세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
              onClick={handleClose}
              disabled={isProcessing}
            >
              취소
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none ${transactionType === 'deposit'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-red-600 hover:bg-red-700'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  처리 중...
                </>
              ) : (
                `${transactionType === 'deposit' ? '입금' : '출금'} 실행`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
