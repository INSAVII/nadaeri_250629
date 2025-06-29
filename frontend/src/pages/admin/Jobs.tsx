import React from 'react';
import { Link } from 'react-router-dom';
import { TextButton } from '../../components/ui';

export default function AdminJobs() {  return (
    <div className="page-container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-light">작업 모니터링</h1>
        <Link to="/admin">
          <TextButton variant="secondary">관리자 대시보드</TextButton>
        </Link>
      </div>
      
      <div className="border rounded">
        <div className="border-b p-4 bg-gray-50">
          <div className="grid grid-cols-6 gap-4 text-sm font-light">
            <div>작업ID</div>
            <div>사용자</div>
            <div>서비스</div>
            <div>상태</div>
            <div>생성일</div>
            <div>완료일</div>
          </div>
        </div>
        
        <div className="divide-y">
          <div className="p-4 hover:bg-gray-50">
            <div className="grid grid-cols-6 gap-4 text-sm font-light">
              <div>JOB001</div>
              <div>user1@example.com</div>
              <div>Q캡쳐</div>
              <div><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">완료</span></div>
              <div>2024-06-15 14:30</div>
              <div>2024-06-15 14:32</div>
            </div>
          </div>
          
          <div className="p-4 hover:bg-gray-50">
            <div className="grid grid-cols-6 gap-4 text-sm font-light">
              <div>JOB002</div>
              <div>user2@example.com</div>
              <div>Q텍스트</div>
              <div><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">처리중</span></div>
              <div>2024-06-15 15:00</div>
              <div>-</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
