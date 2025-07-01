import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// 관리자 드롭다운 메뉴 문제 디버깅용 컴포넌트
export default function AdminMenuDebugger() {
  const { user, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const info = {
        timestamp: new Date().toLocaleTimeString(),
        user: user ? {
          userId: user.userId,
          role: user.role,
          name: user.name
        } : null,
        isAuthenticated,
        isAdmin: user?.role === 'admin',
        domElements: {
          adminDropdown: document.querySelector('.admin-dropdown-menu') ? 'found' : 'not found',
          qtextMenuItem: document.querySelector('.qtext-admin-menu-item') ? 'found' : 'not found'
        }
      };
      setDebugInfo(info);
    }, 1000);

    return () => clearInterval(interval);
  }, [user, isAuthenticated]);

  // 개발 환경에서만 표시
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        maxWidth: '300px',
        zIndex: 10000
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
        🔍 Admin Menu Debug Info
      </div>
      <div>
        <strong>Time:</strong> {debugInfo.timestamp}
      </div>
      <div>
        <strong>Authenticated:</strong> {debugInfo.isAuthenticated ? '✅' : '❌'}
      </div>
      <div>
        <strong>User:</strong> {debugInfo.user ? `${debugInfo.user.name} (${debugInfo.user.userId})` : 'None'}
      </div>
      <div>
        <strong>Role:</strong> {debugInfo.user?.role || 'None'}
      </div>
      <div>
        <strong>Is Admin:</strong> {debugInfo.isAdmin ? '✅' : '❌'}
      </div>
      <div>
        <strong>Admin Dropdown:</strong> {debugInfo.domElements?.adminDropdown}
      </div>
      <div>
        <strong>QText Menu Item:</strong> {debugInfo.domElements?.qtextMenuItem}
      </div>
    </div>
  );
}
