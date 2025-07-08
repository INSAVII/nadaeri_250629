// 간단한 정적 파일 서버
const express = require('express');
const path = require('path');
const app = express();

// 정적 파일 서빙
app.use(express.static('dist'));

// SPA를 위한 catch-all 핸들러
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
