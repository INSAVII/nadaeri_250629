import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ServiceIcon } from '../components/ui';

interface UserBalance {
  balance: number;
  currency: string;
}

interface ServiceUsage {
  qcapture: number;
  qtext: number;
  qname: number;
  total: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<UserBalance>({ balance: 0, currency: 'KRW' });
  const [todayUsage, setTodayUsage] = useState<ServiceUsage>({
    qcapture: 0,
    qtext: 0,
    qname: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // TODO: API로 실제 잔액과 사용량 가져오기
      // 현재는 임시 데이터
      setBalance({ balance: 50000, currency: 'KRW' });
      setTodayUsage({
        qcapture: 15,
        qtext: 8,
        qname: 3,
        total: 26
      });
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  if (isLoading) {
    return (
      <div className="page-container py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">대시보드를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-6">
      {/* 환영 메시지 */}
      <div className="mb-8">
        <h1 className="text-2xl font-light mb-2">
          안녕하세요, <span className="font-medium text-blue-600">{user?.name}</span>님!
        </h1>        <p className="text-gray-600 font-light">
          나대리que 서비스를 이용해 보세요. 예치금으로 간편하게 서비스를 사용할 수 있습니다.
        </p>
      </div>

      {/* 잔액 및 충전 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-light mb-2">💰 현재 예치금</h2>
            <div className="text-3xl font-light text-blue-600 mb-2">
              {formatCurrency(balance.balance)} 원
            </div>
            <p className="text-sm text-gray-600 font-light">
              서비스 이용 시 자동으로 차감됩니다
            </p>
          </div>
          <Link
            to="/deposit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-light hover:bg-blue-700 transition-colors"
          >
            충전하기
          </Link>
        </div>
      </div>

      {/* 오늘 사용량 */}
      <div className="border rounded-lg p-6 mb-8">
        <h2 className="text-lg font-light mb-4">📊 오늘 사용량</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded p-4 text-center">
            <div className="text-2xl mb-2">📸</div>
            <div className="text-sm text-gray-600 font-light">큐캡쳐</div>
            <div className="text-xl font-light text-blue-600">{todayUsage.qcapture}회</div>
          </div>
          <div className="bg-gray-50 rounded p-4 text-center">
            <div className="text-2xl mb-2">📝</div>
            <div className="text-sm text-gray-600 font-light">큐텍스트</div>
            <div className="text-xl font-light text-green-600">{todayUsage.qtext}회</div>
          </div>
          <div className="bg-gray-50 rounded p-4 text-center">
            <div className="text-2xl mb-2">🏷️</div>
            <div className="text-sm text-gray-600 font-light">큐네임</div>
            <div className="text-xl font-light text-purple-600">{todayUsage.qname}회</div>
          </div>
          <div className="bg-gray-50 rounded p-4 text-center">
            <div className="text-2xl mb-2">📈</div>
            <div className="text-sm text-gray-600 font-light">총 사용량</div>
            <div className="text-xl font-light text-gray-800">{todayUsage.total}회</div>
          </div>
        </div>
      </div>

      {/* 서비스 바로가기 */}
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-light mb-4">🚀 서비스 이용하기</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">          {/* 큐캡쳐 */}
          <Link
            to={user?.role === 'admin' ? '/admin/qcapture' : '/app/qcapture'}
            className="block border rounded-lg p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center mb-4">
              <div className="text-blue-600 mr-3">
                <ServiceIcon type="qcapture" size="lg" />
              </div>
              <h3 className="text-lg font-light">큐캡쳐</h3>
            </div>
            <p className="text-sm text-gray-600 font-light mb-3">
              상품 페이지에서 고품질 이미지를 빠르게 추출하는 캡쳐 서비스
            </p>
            <div className="text-xs text-blue-600 font-light">
              100원/회 • 잔액: {formatCurrency(balance.balance)}원
            </div>
          </Link>

          {/* 큐텍스트 */}
          <Link
            to={user?.role === 'admin' ? '/admin/qtext' : '/app/qtext'}
            className="block border rounded-lg p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center mb-4">
              <div className="text-green-600 mr-3">
                <ServiceIcon type="qtext" size="lg" />
              </div>
              <h3 className="text-lg font-light">큐텍스트</h3>
            </div>
            <p className="text-sm text-gray-600 font-light mb-3">
              이미지에서 텍스트를 자동으로 인식하고 추출하는 OCR 서비스
            </p>
            <div className="text-xs text-green-600 font-light">
              150원/회 • 잔액: {formatCurrency(balance.balance)}원
            </div>
          </Link>

          {/* 큐네임 */}
          <Link
            to={user?.role === 'admin' ? '/admin/qname' : '/app/qname'}
            className="block border rounded-lg p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center mb-4">
              <div className="text-purple-600 mr-3">
                <ServiceIcon type="qname" size="lg" />
              </div>
              <h3 className="text-lg font-light">큐네임</h3>
            </div>
            <p className="text-sm text-gray-600 font-light mb-3">
              상품명을 자동으로 생성하고 최적화하는 네이밍 서비스
            </p>
            <div className="text-xs text-purple-600 font-light">
              200원/회 • 잔액: {formatCurrency(balance.balance)}원
            </div>
          </Link>
        </div>
      </div>      {/* 빠른 링크 */}
      <div className="mt-8 text-center">
        <div className="flex justify-center space-x-6 text-sm">
          <Link to="/app/mypage" className="text-blue-600 hover:underline font-light">
            마이페이지
          </Link>
          <Link to="/app/pricing" className="text-blue-600 hover:underline font-light">
            요금제 보기
          </Link>
          <Link to="/app/manuals" className="text-blue-600 hover:underline font-light">
            사용 가이드
          </Link>
        </div>
      </div>
    </div>
  );
}
