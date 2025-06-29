import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    password: '',
    confirmText: '',
    reason: ''
  });
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!formData.password) {
      setError('현재 비밀번호를 입력해주세요.');
      return;
    }

    if (formData.confirmText !== '회원탈퇴') {
      setError('확인 문구를 정확히 입력해주세요.');
      return;
    }

    // TODO: 실제 회원탈퇴 API 호출
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      
      // 탈퇴 완료 후 로그아웃 및 홈으로 이동
      setTimeout(() => {
        logout();
        navigate('/', { 
          state: { message: '회원탈퇴가 완료되었습니다.' } 
        });
      }, 3000);
    } catch (err) {
      setError('회원탈퇴 처리 중 오류가 발생했습니다.');
    }
  };

  if (isSubmitted) {    return (
      <div className="qc-container py-6">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-light mb-6">회원탈퇴 완료</h1>
            <div className="bg-green-50 border border-green-200 rounded p-6">
              <p className="text-green-700 font-light mb-4">
                회원탈퇴가 성공적으로 처리되었습니다.
              </p>
              <p className="text-sm text-gray-600 font-light">
                그동안 서비스를 이용해주셔서 감사했습니다.
              </p>
              <p className="text-xs text-gray-500 font-light mt-2">
                3초 후 홈페이지로 이동합니다...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 사용자 처리
  if (!user) {    return (
      <div className="qc-container py-6">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-light mb-6">회원탈퇴</h1>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-6">
              <p className="text-yellow-700 font-light mb-4">
                로그인이 필요한 서비스입니다.
              </p>
            </div>
            <div className="mt-6">
              <Link to="/login" className="bg-blue-600 text-white rounded px-6 py-2 text-sm font-light hover:bg-blue-700">
                로그인하기
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
        <h1 className="text-2xl font-light mb-6 text-center">회원탈퇴</h1>
        
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <h3 className="text-red-800 font-light mb-2">⚠️ 회원탈퇴 안내</h3>
          <div className="text-sm text-red-700 font-light space-y-1">
            <p>• 탈퇴 시 모든 개인정보와 이용기록이 삭제됩니다</p>
            <p>• 예치금 잔액이 있는 경우 환불 처리됩니다</p>
            <p>• 탈퇴 후에는 동일한 정보로 재가입이 제한될 수 있습니다</p>
            <p>• 진행 중인 작업이 있다면 완료 후 탈퇴를 권장합니다</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="border rounded-lg p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-600 text-sm font-light">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-light mb-1">현재 비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm font-light"
              placeholder="본인 확인을 위해 현재 비밀번호를 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-light mb-1">
              확인 문구 입력 <span className="text-red-500">("회원탈퇴" 입력)</span>
            </label>
            <input
              type="text"
              name="confirmText"
              value={formData.confirmText}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm font-light"
              placeholder="회원탈퇴"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-light mb-1">탈퇴 사유 (선택사항)</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm font-light h-20 resize-none"
              placeholder="탈퇴 사유를 입력해주세요 (서비스 개선에 참고됩니다)"
            />
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              className="w-full bg-red-600 text-white rounded py-2 text-sm font-light hover:bg-red-700"
            >
              회원탈퇴 처리
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/mypage')}
              className="w-full bg-gray-300 text-gray-700 rounded py-2 text-sm font-light hover:bg-gray-400"
            >
              취소
            </button>
          </div>

          <div className="text-center pt-4">
            <Link to="/mypage" className="text-blue-600 hover:underline text-sm font-light">
              마이페이지로 돌아가기
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
