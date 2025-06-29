import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const PaymentHistory: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 실제 결제 내역 API 호출
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">결제 내역</h1>
              <p className="mt-1 text-sm text-gray-600">지금까지의 모든 결제 내역을 확인할 수 있습니다.</p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg">로딩 중...</div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">아직 결제 내역이 없습니다.</div>
                <p className="mt-2 text-sm text-gray-400">서비스를 이용하시면 결제 내역이 여기에 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
