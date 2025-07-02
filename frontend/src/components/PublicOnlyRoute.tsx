import React, { useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const redirectCountRef = useRef(0);
  const MAX_REDIRECTS = 2;

  // 디버깅 로그 (단순화)
  console.log('PublicOnlyRoute:', {
    isAuthenticated,
    user: user ? { userId: user.userId, role: user.role } : null,
    isLoading,
    redirectCount: redirectCountRef.current
  });

  // 로딩 중일 때는 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인된 경우 홈으로 리다이렉트 (무한루프 방지)
  if (isAuthenticated && redirectCountRef.current < MAX_REDIRECTS) {
    redirectCountRef.current += 1;
    console.log('PublicOnlyRoute: 이미 로그인됨, 홈으로 리다이렉트 (count:', redirectCountRef.current, ')');
    return <Navigate to="/" replace />;
  }

  // 무한루프 방지: 최대 리다이렉트 횟수 초과 시 현재 페이지 유지
  if (redirectCountRef.current >= MAX_REDIRECTS) {
    console.warn('PublicOnlyRoute: 최대 리다이렉트 횟수 초과, 현재 페이지 유지');
  }

  console.log('PublicOnlyRoute: 비로그인 상태, 공개 페이지 접근 허용');
  return <>{children}</>;
};

export default PublicOnlyRoute;
