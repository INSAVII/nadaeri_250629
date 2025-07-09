const express = require('express');
const path = require('path');
const app = express();

// CORS 설정 (필요한 경우)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 헬스체크 엔드포인트 (Railway용)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'qclick-frontend'
  });
});

// 정적 파일 서빙 (dist 폴더)
app.use(express.static(path.join(__dirname, 'dist')));

// API 프록시 (필요한 경우)
// app.use('/api', proxy('http://localhost:8000'));

// SPA를 위한 catch-all 핸들러
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 QClick Frontend Server running on port ${port}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'dist')}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
