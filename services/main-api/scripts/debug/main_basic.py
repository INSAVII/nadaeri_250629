# -*- coding: utf-8 -*-
import os

# 가장 기본적인 HTTP 서버 (FastAPI 없이)
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"message": "기본 서버 작동 중", "status": "ok"}
            self.wfile.write(json.dumps(response).encode())
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "healthy", "message": "서버 정상"}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"🚀 기본 HTTP 서버 시작: {host}:{port}")
    print(f"PORT 환경변수: {os.getenv('PORT', 'None')}")
    print(f"모든 환경변수: {dict(os.environ)}")
    
    try:
        server = HTTPServer((host, port), SimpleHandler)
        print(f"✅ 서버 바인딩 성공: {host}:{port}")
        print("서버 시작 중...")
        server.serve_forever()
    except Exception as e:
        print(f"❌ 서버 시작 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
