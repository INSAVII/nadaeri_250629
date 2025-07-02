import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const UserProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">사용자 프로필</h1>
              <p className="mt-1 text-sm text-gray-600">계정 정보를 확인하고 관리할 수 있습니다.</p>
            </div>

            {user && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">이메일</label>
                    <div className="mt-1 text-sm text-gray-900">{user.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">사용자명</label>
                    <div className="mt-1 text-sm text-gray-900">{user.email?.split('@')[0] || '정보 없음'}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">역할</label>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {user.role === 'admin' ? '관리자' : '일반 사용자'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">가입일</label>
                    <div className="mt-1 text-sm text-gray-900">정보 없음</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">예치금 잔액</label>
                    <div className="mt-1 text-sm text-gray-900">
                      <span className="text-green-600 font-semibold">
                        {user.balance?.toLocaleString() || '0'}원
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
