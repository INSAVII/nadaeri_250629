# -*- coding: utf-8 -*-
from fastapi import FastAPI, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import json
import uvicorn
from dotenv import load_dotenv

# 환경변수 로드 (안전하게)
try:
    load_dotenv()
    print("환경변수 로드 완료")
except Exception as e:
    print(f"환경변수 로드 실패 (기본값 사용): {e}")

# 프로덕션 보안 설정 임포트
try:
    from config.production_security import (
        setup_production_security,
        setup_production_logging,
        validate_production_env
    )
    # 환경 변수 검증
    validate_production_env()
    # 프로덕션 로깅 설정
    setup_production_logging()
    print("프로덕션 보안 설정 완료")
except Exception as e:
    print(f"프로덕션 보안 설정 실패 (기본 설정 사용): {e}")

# 로깅 시스템 초기화
try:
    from api.utils.logging import setup_logging
    logger = setup_logging()
except ImportError:
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

logger.info("서버 초기화 시작")

# API 라우터 임포트
from api.auth import router as auth_router
from api.payments import router as payments_router
from api.deposits import router as deposits_router
from api.promotions import router as promotions_router
from api.boards import router as boards_router
from api.programs import router as programs_router
from api.qtext import router as qtext_router

# 데이터베이스
from database import engine, get_db
from models import Base

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)
logger.info("데이터베이스 테이블 초기화 완료")

# 관리자 계정 자동 생성 (환경변수로 제어)
def create_admin_if_not_exists():
    """시작 시 관리자 계정이 없으면 자동으로 생성합니다."""

    # 환경변수로 관리자 계정 자동 생성 제어
    auto_create_admin = os.getenv("AUTO_CREATE_ADMIN", "true").lower() == "true"

    if not auto_create_admin:
        logger.info("AUTO_CREATE_ADMIN=false이므로 관리자 계정 자동 생성을 건너뜁니다.")
        return

    try:
        from models.user import User
        from sqlalchemy.orm import Session

        db = Session(engine)

        # 기존 관리자 계정 확인
        existing_admin = db.query(User).filter(
            (User.email == "admin@qclick.com") | (User.id == "admin")
        ).first()

        if not existing_admin:
            # 환경변수에서 관리자 정보 읽기
            admin_id = os.getenv("ADMIN_ID", "admin")
            admin_email = os.getenv("ADMIN_EMAIL", "admin@qclick.com")
            admin_password = os.getenv("ADMIN_PASSWORD", "admin")

            # 관리자 계정 생성
            admin_user = User(
                id=admin_id,
                email=admin_email,
                hashed_password=User.get_password_hash(admin_password),
                name="관리자",
                role="admin",
                balance=100000.0,
                is_active=True
            )

            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

            logger.info(f"✅ 관리자 계정 자동 생성 완료: {admin_user.id}")
        else:
            logger.info(f"✅ 관리자 계정 이미 존재: {existing_admin.id}")

        db.close()

    except Exception as e:
        logger.error(f"❌ 관리자 계정 생성 실패: {str(e)}")

# 관리자 계정 자동 생성 실행
create_admin_if_not_exists()

app = FastAPI(
    title="QClick Main API",
    description="QClick 메인 API 서버 (인증, 사용자 관리, 결제 등)",
    version="1.0.0"
)

# 프로덕션 보안 설정 적용
try:
    setup_production_security(app)
    logger.info("프로덕션 보안 미들웨어 적용 완료")
except Exception as e:
    logger.warning(f"프로덕션 보안 설정 실패, 기본 CORS 사용: {e}")
    # 기본 CORS 설정 (백업)
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3003,http://localhost:3001,http://localhost:3002,http://localhost:3004,http://localhost:3005").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info(f"기본 CORS 설정 완료: {cors_origins}")

# 정적 파일 설정 (디렉토리가 존재하는 경우에만)
import os
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")
else:
    logger.warning("static 디렉토리가 존재하지 않습니다. 정적 파일 서빙을 건너뜁니다.")

# API 라우터 등록
app.include_router(auth_router, prefix="/api/auth", tags=["인증"])
app.include_router(payments_router, prefix="/api/payments", tags=["결제"])
app.include_router(deposits_router, prefix="/api/deposits", tags=["예치금"])
app.include_router(promotions_router, prefix="/api/promotion", tags=["홍보문구"])
app.include_router(boards_router, tags=["게시판"])
app.include_router(programs_router, prefix="/api/programs", tags=["프로그램"])
app.include_router(qtext_router, tags=["QText"])

@app.get("/", tags=["루트"])
async def root():
    return {"message": "QClick 메인 API 서버에 오신 것을 환영합니다.", "port": "production", "version": "2.2", "timestamp": "2025-01-08"}

@app.get("/health", tags=["상태"])
async def health_check():
    return {"status": "ok", "message": "메인 API 서버가 정상 작동 중입니다.", "port": "production", "version": "2.2"}

# 서버 실행 (Railway 배포용)
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))  # Railway $PORT 환경변수를 정수로 변환
    host = os.getenv("HOST", "0.0.0.0")

    logger.info(f"서버 시작: {host}:{port}")
    # Railway 환경변수 우선 확인, 없으면 일반 ENVIRONMENT 변수 사용
    railway_env = os.getenv('RAILWAY_ENVIRONMENT')
    env = os.getenv('ENVIRONMENT', railway_env or 'development')
    logger.info(f"환경: {env}")
    logger.info(f"데이터베이스: {os.getenv('DATABASE_URL', 'sqlite:///./qclick.db')[:50]}...")
    logger.info(f"PORT 환경변수 원본: {os.getenv('PORT', '기본값8000')}")

    try:
        # reload=False로 설정하여 자동 재시작 비활성화
        # log_level을 warning으로 설정하여 INFO 레벨 경고 숨김
        uvicorn.run("main:app", host=host, port=port, log_level="warning", reload=False)
    except Exception as e:
        logger.error(f"서버 시작 실패: {str(e)}")
        raise
