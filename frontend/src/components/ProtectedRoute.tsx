import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // 디버깅 로그
  console.log('ProtectedRoute:', {
    pathname: location.pathname,
    isAuthenticated,
    user: user ? { userId: user.userId, role: user.role } : null,
    isLoading,
    requireAdmin
  });

  // 로딩 중일 때는 로딩 화면 표시
  if (isLoading) {
    console.log('ProtectedRoute: 로딩 중...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    console.log('ProtectedRoute: 인증되지 않음, 로그인 페이지로 리다이렉트');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 관리자 권한이 필요한 페이지인데 일반 사용자인 경우
  if (requireAdmin && user?.role !== 'admin') {
    console.log('ProtectedRoute: 관리자 권한 부족, 관리자 홈으로 리다이렉트');
    return <Navigate to="/admin" replace />;
  }

  console.log('ProtectedRoute: 접근 허용');
  return <>{children}</>;
};

// 로그인한 사용자는 홈에서 대시보드로 리다이렉트
interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // 디버깅 로그 추가
  console.log('PublicOnlyRoute 상태:', {
    isAuthenticated,
    user: user ? { userId: user.userId, role: user.role } : null
  });  // 로그인된 경우 역할별로 리다이렉트
  if (isAuthenticated) {
    if (user?.role === 'admin') {
      console.log('PublicOnlyRoute: 관리자 로그인됨, 관리자 홈으로 리다이렉트');
      return <Navigate to="/admin" replace />;
    } else {
      console.log('PublicOnlyRoute: 일반 사용자 로그인됨, 홈으로 리다이렉트');
      return <Navigate to="/" replace />;
    }
  }

  console.log('PublicOnlyRoute: 비로그인 상태, 공개 페이지 접근 허용');
  return <>{children}</>;
};
