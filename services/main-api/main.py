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

# API 라우터 임포트 (큐네임, 큐문자 제외)
from api.auth import router as auth_router
from api.payments import router as payments_router
from api.deposits import router as deposits_router
#from api.manuals import router as manuals_router  # 삭제
from api.promotions import router as promotions_router
from api.boards import router as boards_router

# 데이터베이스
from database import engine, get_db
from models import Base

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)
logger.info("데이터베이스 테이블 초기화 완료")

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

# API 라우터 등록 (큐네임, 큐문자 제외)
app.include_router(auth_router, prefix="/api/auth", tags=["인증"])
app.include_router(payments_router, prefix="/api/payments", tags=["결제"])
app.include_router(deposits_router, prefix="/api/deposits", tags=["예치금"])
#app.include_router(manuals_router, prefix="/api/manuals", tags=["사용설명서"])  # 삭제
app.include_router(promotions_router, prefix="/api/promotion", tags=["홍보문구"])
app.include_router(boards_router, tags=["게시판"])

@app.get("/", tags=["루트"])
async def root():
    return {"message": "QClick 메인 API 서버에 오신 것을 환영합니다.", "port": "production"}

@app.get("/health", tags=["상태"])
async def health_check():
    return {"status": "ok", "message": "메인 API 서버가 정상 작동 중입니다.", "port": "production"}

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

@app.post("/debug/test-login", tags=["디버그"])
async def debug_login(
    username: str = Form(...), 
    password: str = Form(...), 
    db: Session = Depends(get_db)
):
    """디버깅용: 로그인을 테스트합니다."""
    try:
        from api.auth import authenticate_user
        user = authenticate_user(db, username, password)
        if user:
            return {
                "status": "success", 
                "message": "로그인 성공", 
                "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role}
            }
        else:
            return {"status": "error", "message": "로그인 실패: 사용자 인증 실패"}
    except Exception as e:
        return {"status": "error", "message": f"로그인 처리 중 오류 발생: {str(e)}"}

# 서버 실행 (Railway 배포용)
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"서버 시작: {host}:{port}")
    logger.info(f"환경: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"데이터베이스: {os.getenv('DATABASE_URL', 'sqlite:///./qclick.db')[:50]}...")
    
    try:
        uvicorn.run("main:app", host=host, port=port, log_level="info")
    except Exception as e:
        logger.error(f"서버 시작 실패: {str(e)}")
        raise
