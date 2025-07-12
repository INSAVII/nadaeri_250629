const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정
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

// 헬스 체크 엔드포인트 (정적 파일 서빙보다 먼저)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'QClick Frontend Server running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// 정적 파일 서빙 (실제 파일 존재 여부 확인)
app.use((req, res, next) => {
  const filePath = path.join(__dirname, 'dist', req.path);

  // 파일이 존재하는지 확인
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);

    // MIME 타입 설정
    if (ext === '.js') {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (ext === '.css') {
      res.setHeader('Content-Type', 'text/css');
    } else if (ext === '.html') {
      res.setHeader('Content-Type', 'text/html');
    }

    // 파일 전송
    res.sendFile(filePath);
  } else {
    // 파일이 없으면 404 반환 (index.html로 리다이렉트하지 않음)
    res.status(404).json({
      error: 'File not found',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
});

// SPA 라우팅 - 나머지 모든 요청을 index.html로
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: 'Build files not found',
      message: 'Please run npm run build first',
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 QClick Frontend Server running on port', PORT);
  console.log('📁 Serving static files from:', path.join(__dirname, 'dist'));
  console.log('🔗 Health check available at: http://localhost:' + PORT + '/health');

  // 빌드 파일 확인
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    console.log('✅ Build directory exists');
    const files = fs.readdirSync(distPath);
    console.log('📄 Build files:', files);
  } else {
    console.log('❌ Build directory not found');
  }
});
