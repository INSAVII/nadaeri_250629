import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// 관리자 드롭다운 메뉴 문제 디버깅용 컴포넌트
export default function AdminMenuDebugger() {
  const { user, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const debugInfo = user ? {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        isAuthenticated: true,
        timestamp: new Date().toISOString()
      } : {
        userId: 'None',
        name: 'None',
        email: 'None',
        role: 'None',
        balance: 0,
        isAuthenticated: false,
        timestamp: new Date().toISOString()
      };
      setDebugInfo(debugInfo);
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
        <strong>User:</strong> {debugInfo.name}
      </div>
      <div>
        <strong>Role:</strong> {debugInfo.role}
      </div>
      <div>
        <strong>Email:</strong> {debugInfo.email}
      </div>
      <div>
        <strong>Balance:</strong> {debugInfo.balance}
      </div>
    </div>
  );
}
