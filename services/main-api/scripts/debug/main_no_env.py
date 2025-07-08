#!/usr/bin/env python3
"""
환경변수 없이 백엔드 서버 실행
"""

import sys
import os
from fastapi import FastAPI, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn

# 환경변수 직접 설정 (환경변수 파일 로딩 우회)
os.environ.setdefault("DATABASE_URL", "sqlite:///./qclick.db")
os.environ.setdefault("PORT", "8000")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3003,http://localhost:3001,https://qclick-app.vercel.app")
os.environ.setdefault("SECRET_KEY", "your-secret-key-here-for-development")

# dotenv 모듈을 monkey patch하여 load_dotenv() 호출을 무시
import dotenv
def noop_load_dotenv(*args, **kwargs):
    pass
dotenv.load_dotenv = noop_load_dotenv

# 로깅 시스템 초기화
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 데이터베이스 (dotenv 로딩 우회 후)
from database import engine, get_db
import models

# 데이터베이스 테이블 생성
models.Base.metadata.create_all(bind=engine)
logger.info("데이터베이스 테이블 초기화 완료")

# API 라우터 임포트
from api.auth import router as auth_router
from api.payments import router as payments_router
from api.deposits import router as deposits_router
from api.manuals import router as manuals_router
from api.pricing import router as pricing_router
from api.simple_pricing import router as simple_pricing_router
from api.promotions import router as promotions_router
from api.boards import router as boards_router

app = FastAPI(
    title="QClick Main API", 
    description="QClick 메인 API 서버 (인증, 사용자 관리, 결제 등)",
    version="1.0.0"
)

# CORS 미들웨어 설정
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3003,http://localhost:3001,https://qclick-app.vercel.app").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"CORS 설정 완료: {cors_origins}")

# 정적 파일 설정
app.mount("/static", StaticFiles(directory="static"), name="static")

# API 라우터 등록
app.include_router(auth_router, prefix="/api/auth", tags=["인증"])
app.include_router(payments_router, prefix="/api/payments", tags=["결제"])
app.include_router(deposits_router, prefix="/api/deposits", tags=["예치금"])
app.include_router(manuals_router, prefix="/api/manuals", tags=["사용설명서"])
app.include_router(pricing_router, prefix="/api/pricing", tags=["가격"])
app.include_router(simple_pricing_router, prefix="/api", tags=["간단가격관리"])
app.include_router(promotions_router, prefix="/api/promotion", tags=["홍보문구"])
app.include_router(boards_router, tags=["게시판"])

@app.get("/", tags=["루트"])
async def root():
    return {"message": "QClick 메인 API 서버에 오신 것을 환영합니다.", "port": "development"}

@app.get("/health", tags=["상태"])
async def health_check():
    return {"status": "ok", "message": "메인 API 서버가 정상 작동 중입니다.", "port": "development"}

@app.get("/debug/users", tags=["디버그"])
async def debug_users(db: Session = Depends(get_db)):
    """디버깅용: 모든 사용자 목록을 조회합니다."""
    try:
        from models.user import User
        users = db.query(User).all()
        return {
            "status": "success", 
            "count": len(users), 
            "users": [{"id": user.id, "email": user.email, "name": user.name, "role": user.role} for user in users]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"서버 시작: {host}:{port}")
    logger.info(f"환경: development (환경변수 파일 없이)")
    logger.info(f"데이터베이스: {os.getenv('DATABASE_URL', 'sqlite:///./qclick.db')[:50]}...")
    
    try:
        uvicorn.run("main_no_env:app", host=host, port=port, log_level="info", reload=True)
    except Exception as e:
        logger.error(f"서버 시작 실패: {str(e)}")
        raise 