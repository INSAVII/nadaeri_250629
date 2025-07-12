import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import { initializeSvgProtection } from './utils/svgUtils';

// 환경 변수 로딩 확인
console.log('🔧 환경 변수 로딩 확인:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_QNAME_API_URL: process.env.REACT_APP_QNAME_API_URL,
  REACT_APP_QTEXT_API_URL: process.env.REACT_APP_QTEXT_API_URL
});

// SVG 보호 시스템 초기화
try {
  initializeSvgProtection();
  console.log('✅ SVG 보호 시스템 초기화 완료');
} catch (error) {
  console.warn('⚠️ SVG 보호 시스템 초기화 실패:', error);
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// 백화면 방지: React.StrictMode 제거하고 안정적인 렌더링
root.render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}
  >
    <App />
  </BrowserRouter>
);
