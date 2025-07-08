const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// 서버 시작 전에 dist 디렉토리 확인
if (!fs.existsSync(DIST_DIR)) {
  console.error('Error: dist 디렉토리를 찾을 수 없습니다!');
  console.error('빌드를 먼저 실행해주세요: npm run build');
  process.exit(1);
}

// 가장 간단한 정적 파일 서버
http.createServer((req, res) => {
  // 기본 파일 경로
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // 파일 확장자 확인
  let extname = path.extname(filePath);
  let contentType = 'text/html';
  
  // SPA를 위한 처리: 파일이 없으면 index.html 제공
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }
  
  // 파일 읽기
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end(`Server Error: ${err.code}`);
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
}).listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
