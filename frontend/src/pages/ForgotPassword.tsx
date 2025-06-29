import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 이메일 유효성 검사
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('유효한 이메일 주소를 입력해주세요.');
      return;
    }

    // TODO: 실제 비밀번호 찾기 API 호출
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
    } catch (err) {
      setError('비밀번호 찾기 요청 중 오류가 발생했습니다.');
    }
  };

  if (isSubmitted) {    return (
      <div className="qc-container py-6">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-light mb-6">비밀번호 찾기</h1>
            <div className="bg-green-50 border border-green-200 rounded p-6">
              <p className="text-green-700 font-light mb-4">
                비밀번호 재설정 링크가 이메일로 전송되었습니다.
              </p>
              <p className="text-sm text-gray-600 font-light">
                이메일을 확인하여 비밀번호를 재설정해주세요.
              </p>
            </div>
            <div className="mt-6">
              <Link to="/login" className="text-blue-600 hover:underline font-light">
                로그인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="qc-container py-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-light mb-6 text-center">비밀번호 찾기</h1>
        
        <form onSubmit={handleSubmit} className="border rounded-lg p-6 space-y-4">
          <p className="text-sm text-gray-600 font-light mb-4">
            가입 시 사용한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-600 text-sm font-light">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-light mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm font-light"
              placeholder="가입 시 사용한 이메일을 입력하세요"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded py-2 text-sm font-light hover:bg-blue-700"
            >
              비밀번호 재설정 링크 보내기
            </button>
          </div>

          <div className="text-center pt-4 space-y-2">
            <Link to="/login" className="text-blue-600 hover:underline text-sm font-light">
              로그인으로 돌아가기
            </Link>
            <br />
            <Link to="/signup" className="text-blue-600 hover:underline text-sm font-light">
              회원가입
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
