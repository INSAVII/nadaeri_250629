import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DeleteAccount from './pages/DeleteAccount';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import PaymentHistory from './pages/PaymentHistory';
import Pricing from './pages/Pricing';
import Board from './pages/Board2';
import BoardAPI from './pages/BoardAPI';
import QCapture from './pages/QCapture';
import QText from './pages/QText';
import QTextProcess from './pages/QTextProcess';
import QName from './pages/QName';
import PromotionManager from './pages/PromotionManager';
import AdminDashboard from './pages/admin/Dashboard';
import CMS from './pages/admin/CMS';
import AdminPrograms from './pages/admin/Programs';
import AdminJobs from './pages/admin/Jobs';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PriceProvider } from './context/PriceContext';
import AdminMenuDebugger from './components/AdminMenuDebugger';

// Public pages
import PublicOnlyRoute from './components/PublicOnlyRoute';
import { ProtectedRoute } from './components/ProtectedRoute';

// Mock data initialization component
const MockDataInitializer: React.FC = () => {
  const { forceAdminLogin } = useAuth();

  const initializeMockData = () => {
    // localStorage 초기화
    localStorage.clear();
    sessionStorage.clear();

    // 브라우저 캐시 삭제
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // 쿠키 삭제
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });

    console.log('모든 캐시 및 저장 데이터 초기화 완료');
    window.location.reload(); // 페이지 새로고침
  };

  const forceClearAll = () => {
    // 모든 저장 데이터 삭제
    localStorage.clear();
    sessionStorage.clear();

    // 브라우저 캐시 삭제
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // IndexedDB 삭제
    if ('indexedDB' in window) {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      });
    }

    // 쿠키 삭제
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });

    console.log('🔄 모든 데이터 강제 초기화 완료');
    alert('모든 캐시와 저장 데이터가 삭제되었습니다. 페이지가 새로고침됩니다.');
    window.location.reload();
  };

  // 개발 환경에서만 표시
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-400 rounded-lg p-4 shadow-lg">
      <h3 className="text-sm font-bold text-yellow-800 mb-2">개발자 도구</h3>
      <div className="space-y-2">
        <button
          onClick={initializeMockData}
          className="w-full px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
        >
          캐시 초기화
        </button>
        <button
          onClick={forceClearAll}
          className="w-full px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
        >
          🔄 강제 초기화
        </button>
        <button
          onClick={forceAdminLogin}
          className="w-full px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
        >
          관리자 로그인
        </button>
      </div>
    </div>
  );
};

// Cache clear component
const CacheClearPage: React.FC = () => {
  const [message, setMessage] = React.useState('');
  const [log, setLog] = React.useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const clearAllCache = () => {
    addLog('캐시 삭제 시작...');

    try {
      // Service Worker 캐시 삭제
      if ('caches' in window) {
        caches.keys().then(function (names) {
          for (let name of names) {
            caches.delete(name);
            addLog('Service Worker 캐시 삭제: ' + name);
          }
        });
      }

      // IndexedDB 삭제
      if ('indexedDB' in window) {
        indexedDB.databases().then(function (databases) {
          databases.forEach(function (database) {
            if (database.name) {
              indexedDB.deleteDatabase(database.name);
              addLog('IndexedDB 삭제: ' + database.name);
            }
          });
        });
      }

      // 로컬 스토리지 삭제
      localStorage.clear();
      addLog('로컬 스토리지 삭제 완료');

      // 세션 스토리지 삭제
      sessionStorage.clear();
      addLog('세션 스토리지 삭제 완료');

      // 쿠키 삭제
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      addLog('쿠키 삭제 완료');

      setMessage('✅ 모든 캐시가 성공적으로 삭제되었습니다!');
      addLog('캐시 삭제 완료');
    } catch (error) {
      addLog('오류 발생: ' + (error as Error).message);
      setMessage('❌ 캐시 삭제 중 오류가 발생했습니다: ' + (error as Error).message);
    }
  };

  const clearLocalStorage = () => {
    addLog('로컬 스토리지 삭제 시작...');

    try {
      // 특정 키들 삭제
      const keysToRemove = [
        'user',
        'mockUsers',
        'ACTIVE_PROGRAMS',
        'USER_DATA',
        'AUTH_TOKEN',
        'PROGRAM_PERMISSION_CHANGING'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        addLog('로컬 스토리지 키 삭제: ' + key);
      });

      // 전체 삭제
      localStorage.clear();
      sessionStorage.clear();

      addLog('로컬/세션 스토리지 완전 삭제 완료');
      setMessage('✅ 로컬 스토리지가 성공적으로 삭제되었습니다!');
    } catch (error) {
      addLog('오류 발생: ' + (error as Error).message);
      setMessage('❌ 로컬 스토리지 삭제 중 오류가 발생했습니다: ' + (error as Error).message);
    }
  };

  const hardRefresh = () => {
    addLog('강제 새로고침 실행...');
    window.location.reload();
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '50px auto',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          color: '#333',
          textAlign: 'center',
          marginBottom: '30px'
        }}>🚨 무한루프 해결 - 캐시 완전 삭제</h1>

        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          color: '#856404',
          padding: '15px',
          borderRadius: '5px',
          margin: '20px 0'
        }}>
          <strong>⚠️ 주의사항:</strong> 이 페이지는 무한루프 문제를 해결하기 위한 긴급 복구 도구입니다.
          모든 브라우저 캐시와 로컬 스토리지가 삭제됩니다.
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          margin: '10px 0',
          borderRadius: '5px',
          borderLeft: '4px solid #007bff'
        }}>
          <h3>1단계: 브라우저 캐시 삭제</h3>
          <p>다음 버튼을 클릭하여 모든 캐시를 삭제하세요:</p>
          <button
            onClick={clearAllCache}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '10px 5px',
              fontSize: '16px'
            }}
          >
            🗑️ 모든 캐시 삭제
          </button>
          <button
            onClick={clearLocalStorage}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '10px 5px',
              fontSize: '16px'
            }}
          >
            💾 로컬 스토리지 삭제
          </button>
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          margin: '10px 0',
          borderRadius: '5px',
          borderLeft: '4px solid #007bff'
        }}>
          <h3>2단계: 페이지 새로고침</h3>
          <p>캐시 삭제 후 페이지를 새로고침하세요:</p>
          <button
            onClick={hardRefresh}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '10px 5px',
              fontSize: '16px'
            }}
          >
            🔄 강제 새로고침
          </button>
        </div>

        {message && (
          <div style={{
            background: message.includes('✅') ? '#d4edda' : '#f8d7da',
            color: message.includes('✅') ? '#155724' : '#721c24',
            padding: '15px',
            borderRadius: '5px',
            margin: '20px 0',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {log.length > 0 && (
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            padding: '15px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '14px',
            maxHeight: '300px',
            overflowY: 'auto',
            margin: '20px 0'
          }}>
            <h4>실행 로그:</h4>
            {log.map((entry, index) => (
              <div key={index}>{entry}</div>
            ))}
          </div>
        )}

        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          color: '#856404',
          padding: '15px',
          borderRadius: '5px',
          margin: '20px 0'
        }}>
          <h3>🔧 추가 해결 방법:</h3>
          <ul>
            <li>브라우저 개발자 도구 열기 (F12)</li>
            <li>Application 탭 → Storage → Clear storage</li>
            <li>Network 탭 → Disable cache 체크</li>
            <li>시크릿/프라이빗 모드에서 테스트</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Force cache clear component
const ForceCacheClearPage: React.FC = () => {
  const [message, setMessage] = React.useState('');
  const [log, setLog] = React.useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const forceClearCache = () => {
    addLog('강제 캐시 삭제 시작...');

    try {
      // Service Worker 캐시 삭제
      if ('caches' in window) {
        caches.keys().then(function (names) {
          for (let name of names) {
            caches.delete(name);
            addLog('Service Worker 캐시 삭제: ' + name);
          }
        });
      }

      // IndexedDB 삭제
      if ('indexedDB' in window) {
        indexedDB.databases().then(function (databases) {
          databases.forEach(function (database) {
            if (database.name) {
              indexedDB.deleteDatabase(database.name);
              addLog('IndexedDB 삭제: ' + database.name);
            }
          });
        });
      }

      // 로컬 스토리지 삭제
      localStorage.clear();
      addLog('로컬 스토리지 삭제 완료');

      // 세션 스토리지 삭제
      sessionStorage.clear();
      addLog('세션 스토리지 삭제 완료');

      // 쿠키 삭제
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      addLog('쿠키 삭제 완료');

      setMessage('✅ 모든 캐시가 성공적으로 삭제되었습니다!');
      addLog('캐시 삭제 완료');
    } catch (error) {
      addLog('오류 발생: ' + (error as Error).message);
      setMessage('❌ 캐시 삭제 중 오류가 발생했습니다: ' + (error as Error).message);
    }
  };

  const hardRefresh = () => {
    addLog('강제 새로고침 실행...');
    window.location.reload();
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '50px auto',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          color: '#333',
          textAlign: 'center',
          marginBottom: '30px'
        }}>🚨 무한루프 해결 - 강제 캐시 삭제</h1>

        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          color: '#856404',
          padding: '15px',
          borderRadius: '5px',
          margin: '20px 0'
        }}>
          <strong>⚠️ 주의사항:</strong> 이 페이지는 무한루프 문제를 해결하기 위한 긴급 복구 도구입니다.
          모든 브라우저 캐시와 로컬 스토리지가 삭제됩니다.
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          margin: '10px 0',
          borderRadius: '5px',
          borderLeft: '4px solid #007bff'
        }}>
          <h3>1단계: 브라우저 캐시 삭제</h3>
          <p>다음 버튼을 클릭하여 모든 캐시를 삭제하세요:</p>
          <button
            onClick={forceClearCache}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '10px 5px',
              fontSize: '16px'
            }}
          >
            🗑️ 모든 캐시 삭제
          </button>
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          margin: '10px 0',
          borderRadius: '5px',
          borderLeft: '4px solid #007bff'
        }}>
          <h3>2단계: 페이지 새로고침</h3>
          <p>캐시 삭제 후 페이지를 새로고침하세요:</p>
          <button
            onClick={hardRefresh}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '10px 5px',
              fontSize: '16px'
            }}
          >
            🔄 강제 새로고침
          </button>
        </div>

        {message && (
          <div style={{
            background: message.includes('✅') ? '#d4edda' : '#f8d7da',
            color: message.includes('✅') ? '#155724' : '#721c24',
            padding: '15px',
            borderRadius: '5px',
            margin: '20px 0',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {log.length > 0 && (
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            padding: '15px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '14px',
            maxHeight: '300px',
            overflowY: 'auto',
            margin: '20px 0'
          }}>
            <h4>실행 로그:</h4>
            {log.map((entry, index) => (
              <div key={index}>{entry}</div>
            ))}
          </div>
        )}

        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          color: '#856404',
          padding: '15px',
          borderRadius: '5px',
          margin: '20px 0'
        }}>
          <h3>🔧 추가 해결 방법:</h3>
          <ul>
            <li>브라우저 개발자 도구 열기 (F12)</li>
            <li>Application 탭 → Storage → Clear storage</li>
            <li>Network 탭 → Disable cache 체크</li>
            <li>시크릿/프라이빗 모드에서 테스트</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// 강화된 캐시 삭제 컴포넌트
const EnhancedCacheClearPage: React.FC = () => {
  const [message, setMessage] = React.useState('');
  const [log, setLog] = React.useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const clearAllCache = () => {
    addLog('강화된 캐시 삭제 시작...');

    try {
      // Service Worker 캐시 삭제
      if ('caches' in window) {
        caches.keys().then(function (names) {
          for (let name of names) {
            caches.delete(name);
            addLog('Service Worker 캐시 삭제: ' + name);
          }
        });
      }

      // IndexedDB 삭제
      if ('indexedDB' in window) {
        indexedDB.databases().then(function (databases) {
          databases.forEach(function (database) {
            if (database.name) {
              indexedDB.deleteDatabase(database.name);
              addLog('IndexedDB 삭제: ' + database.name);
            }
          });
        });
      }

      // 로컬 스토리지 완전 삭제
      localStorage.clear();
      addLog('로컬 스토리지 완전 삭제 완료');

      // 세션 스토리지 완전 삭제
      sessionStorage.clear();
      addLog('세션 스토리지 완전 삭제 완료');

      // 쿠키 완전 삭제
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      addLog('쿠키 완전 삭제 완료');

      // 브라우저 히스토리 정리
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '/');
        addLog('브라우저 히스토리 정리 완료');
      }

      setMessage('✅ 모든 캐시가 성공적으로 삭제되었습니다!');
      addLog('강화된 캐시 삭제 완료');
    } catch (error) {
      addLog('오류 발생: ' + (error as Error).message);
      setMessage('❌ 캐시 삭제 중 오류가 발생했습니다: ' + (error as Error).message);
    }
  };

  const clearLocalStorage = () => {
    addLog('강화된 로컬 스토리지 삭제 시작...');

    try {
      // 모든 가능한 키들 삭제
      const keysToRemove = [
        // 기본 키들
        'user',
        'mockUsers',
        'USER_DATA',
        'AUTH_TOKEN',
        'authToken',
        'currentUser',
        'authUser',

        // 추가 키들
        'ACTIVE_PROGRAMS',
        'PROGRAM_PERMISSION_CHANGING',
        'QTEXT_USAGE_CONTENT',
        'qtextUsageContent',
        'userData',
        'user_data',
        'auth_data',
        'authData',
        'loginData',
        'login_data',
        'sessionData',
        'session_data',
        'token',
        'accessToken',
        'refreshToken',
        'rememberedUserId',
        'remembered_user_id',
        'lastLogin',
        'last_login',
        'userPreferences',
        'user_preferences',
        'appState',
        'app_state',
        'reduxState',
        'redux_state',
        'persist:root',
        'persist:auth',
        'persist:user'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        addLog('로컬 스토리지 키 삭제: ' + key);
      });

      // 전체 삭제로 확실히 정리
      localStorage.clear();
      sessionStorage.clear();

      addLog('강화된 로컬/세션 스토리지 완전 삭제 완료');
      setMessage('✅ 강화된 로컬 스토리지가 성공적으로 삭제되었습니다!');
    } catch (error) {
      addLog('오류 발생: ' + (error as Error).message);
      setMessage('❌ 로컬 스토리지 삭제 중 오류가 발생했습니다: ' + (error as Error).message);
    }
  };

  const hardRefresh = () => {
    addLog('강제 새로고침 실행...');
    window.location.reload();
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '50px auto',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          color: '#333',
          textAlign: 'center',
          marginBottom: '30px'
        }}>🚨 로그인 무한루프 해결 - 강화된 캐시 삭제</h1>

        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          color: '#856404',
          padding: '15px',
          borderRadius: '5px',
          margin: '20px 0'
        }}>
          <strong>⚠️ 주의사항:</strong> 이 페이지는 로그인 무한루프 문제를 해결하기 위한 긴급 복구 도구입니다.
          모든 브라우저 캐시와 로컬 스토리지가 삭제됩니다.
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          margin: '10px 0',
          borderRadius: '5px',
          borderLeft: '4px solid #007bff'
        }}>
          <h3>1단계: 브라우저 캐시 삭제</h3>
          <p>다음 버튼을 클릭하여 모든 캐시를 삭제하세요:</p>
          <button
            onClick={clearAllCache}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '10px 5px',
              fontSize: '16px'
            }}
          >
            🗑️ 모든 캐시 삭제
          </button>
          <button
            onClick={clearLocalStorage}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '10px 5px',
              fontSize: '16px'
            }}
          >
            💾 로컬 스토리지 삭제
          </button>
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          margin: '10px 0',
          borderRadius: '5px',
          borderLeft: '4px solid #007bff'
        }}>
          <h3>2단계: 페이지 새로고침</h3>
          <p>캐시 삭제 후 페이지를 새로고침하세요:</p>
          <button
            onClick={hardRefresh}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '10px 5px',
              fontSize: '16px'
            }}
          >
            🔄 강제 새로고침
          </button>
        </div>

        {message && (
          <div style={{
            background: message.includes('✅') ? '#d4edda' : '#f8d7da',
            color: message.includes('✅') ? '#155724' : '#721c24',
            padding: '15px',
            borderRadius: '5px',
            margin: '20px 0',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {log.length > 0 && (
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            padding: '15px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '14px',
            maxHeight: '300px',
            overflowY: 'auto',
            margin: '20px 0'
          }}>
            <h4>실행 로그:</h4>
            {log.map((entry, index) => (
              <div key={index}>{entry}</div>
            ))}
          </div>
        )}

        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          color: '#856404',
          padding: '15px',
          borderRadius: '5px',
          margin: '20px 0'
        }}>
          <h3>🔧 추가 해결 방법:</h3>
          <ul>
            <li>브라우저 개발자 도구 열기 (F12)</li>
            <li>Application 탭 → Storage → Clear storage</li>
            <li>Network 탭 → Disable cache 체크</li>
            <li>시크릿/프라이빗 모드에서 테스트</li>
            <li>브라우저 재시작</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Debug component for testing routes
const DebugPage: React.FC<{ title: string }> = ({ title }) => {
  const location = useLocation();

  return (
    <div style={{
      padding: '2rem',
      margin: '2rem',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      backgroundColor: '#f3f4f6'
    }}>
      <h2 style={{ color: '#1f2937', marginBottom: '1rem' }}>🔧 디버그: {title}</h2>
      <p style={{ color: '#6b7280' }}>현재 경로: <strong>{location.pathname}</strong></p>
      <p style={{ color: '#6b7280' }}>이 페이지는 라우팅 테스트용입니다.</p>
    </div>
  );
};

// Catch-all component for unmatched routes
const NotFound: React.FC = () => {
  const location = useLocation();

  return (
    <div style={{
      padding: '2rem',
      margin: '2rem',
      border: '2px solid #ef4444',
      borderRadius: '8px',
      backgroundColor: '#fef2f2'
    }}>
      <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>❌ 페이지를 찾을 수 없습니다</h2>
      <p style={{ color: '#7f1d1d' }}>요청한 경로: <strong>{location.pathname}</strong></p>
      <p style={{ color: '#7f1d1d' }}>존재하지 않는 페이지입니다.</p>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <PriceProvider>
        <div className="App min-h-screen bg-gray-50">
          <Header />
          <main className="flex-1">
            <Routes>
              {/* Public routes - accessible without login */}
              <Route
                path="/"
                element={<Home />}
              />
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicOnlyRoute>
                    <ForgotPassword />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicOnlyRoute>
                    <Signup />
                  </PublicOnlyRoute>
                }
              />

              {/* Mock data initialization route */}
              <Route
                path="/init_mock_data"
                element={<MockDataInitializer />}
              />

              {/* Cache clear route */}
              <Route
                path="/clear-cache"
                element={<CacheClearPage />}
              />

              {/* Force cache clear route */}
              <Route
                path="/force-clear-cache"
                element={<ForceCacheClearPage />}
              />

              {/* Enhanced cache clear route */}
              <Route
                path="/enhanced-cache-clear"
                element={<EnhancedCacheClearPage />}
              />

              {/* App routes - protected, require login */}
              <Route
                path="/app/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/payment-history"
                element={
                  <ProtectedRoute>
                    <PaymentHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/pricing"
                element={
                  <ProtectedRoute>
                    <Pricing />
                  </ProtectedRoute>
                }
              />

              {/* Service routes for regular users */}
              <Route
                path="/app/qcapture"
                element={
                  <ProtectedRoute>
                    <QCapture />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/qtext"
                element={
                  <ProtectedRoute>
                    <QText />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/qname"
                element={
                  <ProtectedRoute>
                    <QName />
                  </ProtectedRoute>
                }
              />

              {/* Direct service routes for easier access */}
              <Route
                path="/qcapture"
                element={
                  <ProtectedRoute>
                    <QCapture />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qtext"
                element={
                  <ProtectedRoute>
                    <QText />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qtext/process"
                element={
                  <ProtectedRoute>
                    <QTextProcess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qname"
                element={
                  <ProtectedRoute>
                    <QName />
                  </ProtectedRoute>
                }
              />

              {/* Board route - accessible to logged in users */}
              <Route
                path="/board"
                element={
                  <ProtectedRoute>
                    <BoardAPI />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/board-legacy"
                element={
                  <ProtectedRoute>
                    <Board />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes - protected, require admin role */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cms"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <CMS />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/jobs"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/programs"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPrograms />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/promotion-manager"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <PromotionManager />
                  </ProtectedRoute>
                }
              />

              {/* Admin service routes - same components as user routes but under /admin */}
              <Route
                path="/admin/qcapture"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <QCapture />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/qname"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <QName />
                  </ProtectedRoute>
                }
              />

              {/* Legacy route redirects */}
              <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
              <Route path="/payment-history" element={<Navigate to="/app/payment-history" replace />} />
              <Route path="/pricing" element={<Navigate to="/app/pricing" replace />} />

              {/* 기존 회원관리/예치금관리 페이지를 CMS로 리다이렉트 */}
              <Route path="/admin/users" element={<Navigate to="/admin/cms" replace />} />
              <Route path="/admin/deposits" element={<Navigate to="/admin/cms" replace />} />

              {/* Catch-all route for unmatched paths */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
        {/* 개발 환경에서만 디버깅 정보 표시 */}
        <AdminMenuDebugger />
      </PriceProvider>
    </AuthProvider>
  );
};

export default App;
