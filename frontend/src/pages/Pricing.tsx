import React from 'react';

export default function Pricing() {
  return (
    <div className="page-container py-6">
      <h1 className="text-2xl font-light mb-6 text-center">가격 안내</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded p-6 text-center">
          <h2 className="text-lg font-light mb-3">Q캡쳐</h2>
          <div className="text-2xl font-light text-blue-600 mb-4">100원<span className="text-sm text-gray-500">/건</span></div>
          <ul className="text-sm text-gray-600 font-light space-y-2">
            <li>• 고품질 이미지 캡쳐</li>
            <li>• 대량 처리 가능</li>
            <li>• 자동 저장</li>
          </ul>
        </div>
        
        <div className="border rounded p-6 text-center border-blue-300 bg-blue-50">
          <h2 className="text-lg font-light mb-3">Q텍스트</h2>
          <div className="text-2xl font-light text-blue-600 mb-4">200원<span className="text-sm text-gray-500">/건</span></div>
          <ul className="text-sm text-gray-600 font-light space-y-2">
            <li>• AI 텍스트 제거</li>
            <li>• 배경 복원</li>
            <li>• 고품질 결과물</li>
          </ul>
          <div className="mt-4">
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">인기</span>
          </div>
        </div>
        
        <div className="border rounded p-6 text-center">
          <h2 className="text-lg font-light mb-3">Q네임</h2>
          <div className="text-2xl font-light text-blue-600 mb-4">50원<span className="text-sm text-gray-500">/건</span></div>
          <ul className="text-sm text-gray-600 font-light space-y-2">
            <li>• SEO 최적화 상품명</li>
            <li>• 카테고리 키워드</li>
            <li>• 엑셀 일괄 처리</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <div className="bg-gray-50 rounded p-6">
          <h3 className="text-lg font-light mb-3">충전 안내</h3>
          <p className="text-sm text-gray-600 font-light">
            최소 충전 금액: 10,000원 | 충전 단위: 1,000원
          </p>
        </div>
      </div>
    </div>
  );
}
