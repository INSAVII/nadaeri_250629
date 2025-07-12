import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import { AuthProvider } from './context/AuthContext';
import { PriceProvider } from './context/PriceContext';

// 🎯 1단계: 단순화된 App 컴포넌트 - 기본 UI만 테스트
const App: React.FC = () => {
  return (
    <AuthProvider>
      <PriceProvider>
        <Router>
          <div className="App" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f9fafb'
          }}>
            <Header />
            <main style={{ flex: 1, padding: '20px' }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                {/* 1단계: 기본 페이지만 활성화 */}
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </PriceProvider>
    </AuthProvider>
  );
};

export default App;
