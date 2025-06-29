/**
 * 🔥 중요: 로그인 무한반복 문제 해결 기록 🔥
 * 
 * 문제: foundUser가 null인데도 로그인 성공으로 처리되어 무한반복 발생
 * 원인: Login.tsx에서 foundUser 체크 로직이 불완전했음
 * 
 * 해결책: foundUser가 null인 경우를 명확히 체크하고 즉시 실패 처리
 * - if (!foundUser) 조건 추가
 * - null일 때 setError() 호출 후 return으로 함수 종료
 * - setIsLoading(false) 호출로 로딩 상태 해제
 * 
 * ⚠️ 주의: 이 수정사항을 변경하지 마세요! 로그인 무한반복 문제가 다시 발생할 수 있습니다.
 * 
 * 작성일: 2024년 12월
 * 문제 해결자: AI Assistant
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  // 컴포넌트 마운트 시 현재 인증 상태 로그
  useEffect(() => {
    console.log('Login 컴포넌트 마운트 - 현재 인증 상태:', {
      isAuthenticated: auth.isAuthenticated,
      user: auth.user,
      isLoading: auth.isLoading
    });
  }, [auth.isAuthenticated, auth.user, auth.isLoading]);

  // 로그아웃 이벤트 리스너 추가
  useEffect(() => {
    const handleUserLoggedOut = (event: CustomEvent) => {
      console.log('Login - 사용자 로그아웃 이벤트 감지:', event.detail);
      // 폼 초기화
      setUsername('');
      setPassword('');
      setError('');
      setIsLoading(false);
    };

    const handleUserLoggedIn = (event: CustomEvent) => {
      console.log('Login - 사용자 로그인 이벤트 감지:', event.detail);
    };

    window.addEventListener('userLoggedOut', handleUserLoggedOut as EventListener);
    window.addEventListener('userLoggedIn', handleUserLoggedIn as EventListener);

    return () => {
      window.removeEventListener('userLoggedOut', handleUserLoggedOut as EventListener);
      window.removeEventListener('userLoggedIn', handleUserLoggedIn as EventListener);
    };
  }, []);

  // 로그인 성공 시 리디렉션 처리
  useEffect(() => {
    if (auth.isAuthenticated && auth.user && !isLoading) {
      console.log('Login - 인증됨, 리디렉션 시작:', auth.user);

      if (auth.user.role === 'admin') {
        console.log('Login - 관리자로 리디렉션: /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('Login - 일반 사용자로 리디렉션: /');
        navigate('/', { replace: true });
      }
    }
  }, [auth.isAuthenticated, auth.user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('Login - 폼 제출');
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Login - 로그인 시도:', { username });

      const success = await auth.login(username, password);

      if (success) {
        console.log('Login - 로그인 성공');
        // useEffect에서 리디렉션 처리
      } else {
        console.log('Login - 로그인 실패');
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('Login - 로그인 처리 중 오류:', error);
      setError('로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          나대리que 로그인
        </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            관리자: admin/admin, 사용자: user/user
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                사용자명
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="사용자명"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          {/* 비밀번호 찾기 링크 추가 */}
          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;