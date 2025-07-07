'use client';

export default function Footer() {
  return (
    <footer>
      <div className="qc-container">
        <div className="grid grid-cols-1 grid-cols-3">
          <div>
            <h3 className="font-light text-black" style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>나대리que서비스</h3>
            <p className="font-light text-black" style={{ fontSize: '0.95rem' }}>
              효율적인 상품 정보 관리와 마케팅을 위한 최고의 솔루션 제공
            </p>
          </div>
          <div>
            <h3 className="text-sm font-light text-black mb-4">서비스</h3>
            <ul className="space-y-2">
              <li>
                <a href="/qname" className="font-light text-black hover:text-blue-700 transition-colors text-sm">
                  큐네임=상품명짖기 카테번호 키워드 추출
                </a>
              </li>
              <li>
                <a href="/qcapture" className="font-light text-black hover:text-blue-700 transition-colors text-sm">
                  큐캡쳐=상세페이지로부터 목록이미지 자동추출및저장
                </a>
              </li>
              <li>
                <a href="/qtext" className="font-light text-black hover:text-blue-700 transition-colors text-sm">
                  큐문자=캡쳐 이미지로부터 문자 대량지우기
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-light text-black mb-4">사업자 정보</h3>
            <ul className="space-y-2 font-light text-black text-sm">
              <li>사업자 명: 인사비</li>
              <li>주소: 전북정읍시 감곡면 진흥길 232-7</li>
              <li>사업자번호: 404-90-75330</li>
              <li>이메일: insavi@naver.com</li>
              <li>관리자 전화: 010-5904-2213</li>
              <li>운영시간: 평일 10:00~18:00</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-300 mt-8 pt-6 text-center font-light text-black text-xs">
          <p>&copy; {new Date().getFullYear()} 나대리que서비스. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}