# -*- coding: utf-8 -*-
from fastapi import FastAPI
import os
import uvicorn

# 간단한 FastAPI 앱 생성 (최소 버전)
app = FastAPI(title="QClick Health Check Test")

@app.get("/")
async def root():
    return {"message": "서버가 정상 작동 중입니다.", "status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "서버 상태 양호"}

# 서버 실행
if __name__ == "__main__":
    # Railway PORT 환경변수 안전하게 처리
    try:
        port = int(os.getenv("PORT", 8000))
    except (ValueError, TypeError):
        port = 8000
    
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"🚀 서버 시작: {host}:{port}")
    print(f"PORT 환경변수 원본: {repr(os.getenv('PORT', '기본값8000'))}")
    print(f"변환된 포트: {port}")
    
    try:
        uvicorn.run(app, host=host, port=port, reload=False)
    except Exception as e:
        print(f"❌ 서버 시작 실패: {str(e)}")
        raise
