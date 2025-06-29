import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{5,}$/.test(formData.password)) {
      setError('비밀번호는 영문, 숫자, 특수문자 조합 5자 이상이어야 합니다.');
      return;
    }

    if (!token) {
      setError('유효하지 않은 비밀번호 재설정 링크입니다.');
      return;
    }

    // TODO: 실제 비밀번호 재설정 API 호출
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
    } catch (err) {
      setError('비밀번호 재설정 중 오류가 발생했습니다.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="qc-container py-6">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-light mb-6">비밀번호 재설정 완료</h1>
            <div className="bg-green-50 border border-green-200 rounded p-6">
              <p className="text-green-700 font-light mb-4">
                비밀번호가 성공적으로 재설정되었습니다.
              </p>
              <p className="text-sm text-gray-600 font-light">
                새로운 비밀번호로 로그인해주세요.
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 text-white rounded px-6 py-2 text-sm font-light hover:bg-blue-700"
              >
                로그인하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="qc-container py-6">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-light mb-6">비밀번호 재설정</h1>
            <div className="bg-red-50 border border-red-200 rounded p-6">
              <p className="text-red-700 font-light mb-4">
                유효하지 않은 비밀번호 재설정 링크입니다.
              </p>
              <p className="text-sm text-gray-600 font-light">
                비밀번호 찾기를 다시 시도해주세요.
              </p>
            </div>
            <div className="mt-6">
              <Link to="/forgot-password" className="text-blue-600 hover:underline font-light">
                비밀번호 찾기
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
        <h1 className="text-2xl font-light mb-6 text-center">비밀번호 재설정</h1>

        <form onSubmit={handleSubmit} className="border rounded-lg p-6 space-y-4">
          <p className="text-sm text-gray-600 font-light mb-4">
            새로운 비밀번호를 입력해주세요.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-600 text-sm font-light">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-light mb-1">새 비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm font-light"
              placeholder="영문, 숫자, 특수문자 조합 5자 이상"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-light mb-1">새 비밀번호 확인</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm font-light"
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded py-2 text-sm font-light hover:bg-blue-700"
            >
              비밀번호 재설정
            </button>
          </div>

          <div className="text-center pt-4">
            <Link to="/login" className="text-blue-600 hover:underline text-sm font-light">
              로그인으로 돌아가기
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
