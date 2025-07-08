// 간단한 정적 파일 서버
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// 정적 파일 서빙을 위한 디렉토리 확인
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('Error: dist 폴더가 존재하지 않습니다!');
  console.error('npm run build 명령으로 먼저 빌드해주세요.');
  process.exit(1);
}

// 정적 파일 서빙
app.use(express.static(distPath));

// CORS 설정
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    return res.status(200).json({});
  }
  next();
});

// SPA를 위한 catch-all 핸들러
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`http://localhost:${port}`);
});
