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
        {/* CMS 관리 시스템 */}
        <div className="border rounded p-4 hover:bg-gray-50 transition-colors">
          <h2 className="text-lg font-light mb-2">🏢 CMS 관리 시스템</h2>
          <p className="text-sm text-gray-600 font-light mb-4">
            회원관리와 예치금관리를 통합한 완전한 CMS
          </p>
          <Link to="/admin/cms">
            <TextButton variant="primary">CMS 관리</TextButton>
          </Link>
        </div>

        {/* 프로그램 관리 */}
        <div className="border rounded p-4 hover:bg-gray-50 transition-colors">
          <h2 className="text-lg font-light mb-2">💾 프로그램 관리</h2>
          <p className="text-sm text-gray-600 font-light mb-4">
            QCapture 프로그램을 관리하고 설정할 수 있습니다.
          </p>
          <Link to="/admin/programs">
            <TextButton variant="primary">프로그램 관리</TextButton>
          </Link>
        </div>

        {/* 작업 모니터링 */}
        <div className="border rounded p-4 hover:bg-gray-50 transition-colors">
          <h2 className="text-lg font-light mb-2">📊 작업 모니터링</h2>
          <p className="text-sm text-gray-600 font-light mb-4">
            현재 처리 중인 작업과 완료된 작업 모니터링
          </p>
          <Link to="/admin/jobs">
            <TextButton variant="primary">작업 모니터링</TextButton>
          </Link>
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
