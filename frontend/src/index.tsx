import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import { initializeSvgProtection } from './utils/svgUtils';

// SVG 보호 시스템 초기화
initializeSvgProtection();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// BrowserRouter로 변경하여 App 내부의 라우팅만 사용하도록 수정
root.render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
