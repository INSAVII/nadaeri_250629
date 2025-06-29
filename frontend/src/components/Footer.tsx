'use client';

export default function Footer() {  return (
    <footer>
      <div className="container">
        <div className="grid grid-cols-1 grid-cols-3">
          <div>
            <h3 className="font-bold" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Qclick</h3>
            <p className="text-gray">
              효율적인 상품 정보 관리와 마케팅을 위한 최고의 솔루션 제공
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">서비스</h3>
            <ul className="space-y-2">
              <li>
                <a href="/qname" className="text-gray-300 hover:text-white transition-colors">
                  큐네임
                </a>
              </li>
              <li>
                <a href="/qcapture" className="text-gray-300 hover:text-white transition-colors">
                  큐캡쳐
                </a>
              </li>
              <li>
                <a href="/qtext" className="text-gray-300 hover:text-white transition-colors">
                  큐문자
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">고객 지원</h3>
            <ul className="space-y-2">
              <li>
                <a href="/notice" className="text-gray-300 hover:text-white transition-colors">
                  공지사항
                </a>
              </li>
              <li>
                <a href="/board" className="text-gray-300 hover:text-white transition-colors">
                  게시판
                </a>
              </li>
              <li>
                <p className="text-gray-300">고객센터: 010-5904-2213</p>
              </li>
              <li>
                <p className="text-gray-300">이메일: support@qclick.co.kr</p>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Qclick. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}