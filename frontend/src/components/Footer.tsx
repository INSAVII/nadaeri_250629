'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="qc-container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-light text-black mb-4 text-lg">나대리que서비스</h3>
            <p className="font-light text-gray-600 text-sm leading-relaxed">
              효율적인 상품 정보 관리와 마케팅을 위한 최고의 솔루션 제공
            </p>
          </div>
          <div>
            <h3 className="text-sm font-light text-black mb-4">서비스</h3>
            <ul className="space-y-2">
              <li>
                <a href="/qname" className="font-light text-gray-600 hover:text-blue-700 transition-colors text-sm block">
                  큐네임=상품명짖기 카테번호 키워드 추출
                </a>
              </li>
              <li>
                <a href="/qcapture" className="font-light text-gray-600 hover:text-blue-700 transition-colors text-sm block">
                  큐캡쳐=상세페이지로부터 목록이미지 자동추출및저장
                </a>
              </li>
              <li>
                <a href="/qtext" className="font-light text-gray-600 hover:text-blue-700 transition-colors text-sm block">
                  큐문자=캡쳐 이미지로부터 문자 대량지우기
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-light text-black mb-4">사업자 정보</h3>
            <ul className="space-y-2 font-light text-gray-600 text-sm">
              <li>사업자 명: 인사비</li>
              <li>주소: 전북정읍시 감곡면 진흥길 232-7</li>
              <li>사업자번호: 404-90-75330</li>
              <li>이메일: insavi@naver.com</li>
              <li>관리자 전화: 010-5904-2213</li>
              <li>운영시간: 평일 10:00~18:00</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-300 mt-8 pt-6 text-center font-light text-gray-500 text-xs">
          <p>&copy; {new Date().getFullYear()} 나대리que서비스. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
