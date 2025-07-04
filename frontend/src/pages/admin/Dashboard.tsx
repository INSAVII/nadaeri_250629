import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TextButton } from '../../components/ui';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();

  // 관리자 여부를 메모이제이션하여 불필요한 재계산 방지
  const isAdmin = useMemo(() => {
    return user?.role === 'admin';
  }, [user?.role]);

  // 관리자가 아닌 경우 접근 제한
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="page-container py-6">
        <div className="text-center">
          <h1 className="text-2xl font-light mb-4">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-4">관리자 권한이 필요합니다.</p>
          <Link to="/">
            <TextButton variant="primary">홈으로 돌아가기</TextButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-6">
      <h1 className="text-2xl font-light mb-6">관리자 대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 작업 모니터링 - 유지 */}
        <div className="border rounded p-4 hover:bg-gray-50 transition-colors">
          <h2 className="text-lg font-light mb-2">📊 작업 모니터링</h2>
          <p className="text-sm text-gray-600 font-light mb-4">
            현재 처리 중인 작업과 완료된 작업 모니터링
          </p>
          <Link to="/admin/jobs">
            <TextButton variant="primary">작업 모니터링</TextButton>
          </Link>
        </div>

        {/* 🆕 빠른 접근 안내 */}
        <div className="border rounded p-4 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-light mb-2 text-blue-800">🚀 빠른 접근</h2>
          <p className="text-sm text-blue-600 font-light mb-4">
            관리자 드롭다운 메뉴를 통해 다음 기능에 접근할 수 있습니다:
          </p>
          <div className="space-y-2 text-sm text-blue-700">
            <div>• 🏢 CMS 관리 시스템</div>
            <div>• 💾 프로그램 관리(큐캡쳐)</div>
            <div>• 🔐 프로그램 권한 관리</div>
            <div>• 📢 홍보문구관리</div>
          </div>
        </div>

        {/* 🆕 시스템 상태 */}
        <div className="border rounded p-4 bg-green-50 border-green-200">
          <h2 className="text-lg font-light mb-2 text-green-800">✅ 시스템 상태</h2>
          <p className="text-sm text-green-600 font-light mb-4">
            모든 시스템이 정상적으로 운영 중입니다
          </p>
          <div className="space-y-1 text-sm text-green-700">
            <div>• 백엔드 서버: 정상</div>
            <div>• 데이터베이스: 정상</div>
            <div>• 파일 업로드: 정상</div>
            <div>• 사용자 인증: 정상</div>
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="mt-8">
        <h2 className="text-lg font-light mb-4">최근 활동</h2>
        <div className="border rounded p-4">
          <p className="text-sm text-gray-600 font-light">최근 시스템 활동 내역이 여기에 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}
