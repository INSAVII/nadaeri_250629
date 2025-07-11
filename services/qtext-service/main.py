# -*- coding: utf-8 -*-
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("큐문자 서비스 시작")

app = FastAPI(title="QText Service", version="1.0.0")

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("큐문자 서비스 CORS 설정 완료")

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "QText Service is running",
        "service": "qtext-service",
        "version": "1.0.0",
        "status": "ready"
    }

@app.get("/health")
async def health():
    """헬스 체크 엔드포인트"""
    return {
        "status": "healthy",
        "service": "qtext-service",
        "timestamp": "2024-01-01T00:00:00Z"
    }

@app.get("/info")
async def info():
    """서비스 정보 엔드포인트"""
    return {
        "service": "qtext-service",
        "description": "이미지 텍스트 제거 서비스",
        "version": "1.0.0",
        "status": "ready"
    }

# 서버 실행 (Railway 배포용)
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
