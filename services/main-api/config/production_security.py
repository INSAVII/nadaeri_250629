"""
프로덕션 환경 보안 설정
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime

def setup_production_security(app: FastAPI):
    """프로덕션 환경 보안 설정"""
    
    # 1. 신뢰할 수 있는 호스트만 허용
    trusted_hosts = [
        "qclick.com",
        "*.qclick.com",
        "qclick.vercel.app",
        "api.qclick.com"
    ]
    
    if os.getenv("ENV") == "production":
        app.add_middleware(
            TrustedHostMiddleware, 
            allowed_hosts=trusted_hosts
        )
    
    # 2. CORS 설정 강화
    origins = []
    if os.getenv("ENV") == "production":
        origins = [
            "https://qclick.vercel.app",
            "https://qclick-admin.vercel.app",
            "https://api.qclick.com"
        ]
    else:
        # 개발 환경
        origins = [
            "http://localhost:3003",
            "http://localhost:3001", 
            "http://localhost:3002",
            "http://localhost:3003",
            "http://127.0.0.1:3003",
            "http://127.0.0.1:3003"
        ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600
    )
    
    # 3. 보안 헤더 추가
    @app.middleware("http")
    async def add_security_headers(request, call_next):
        response = await call_next(request)
        
        if os.getenv("ENV") == "production":
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response
    
    # 4. 에러 핸들링 강화
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        # 프로덕션에서는 상세한 오류 정보 숨김
        if os.getenv("ENV") == "production":
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "서버 오류가 발생했습니다.",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        else:
            # 개발 환경에서는 상세 오류 표시
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": str(exc),
                    "type": type(exc).__name__,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    # 5. 요청 크기 제한
    @app.middleware("http")
    async def limit_upload_size(request, call_next):
        if request.method == "POST":
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > 100 * 1024 * 1024:  # 100MB
                return JSONResponse(
                    status_code=413,
                    content={"success": False, "message": "파일 크기가 너무 큽니다."}
                )
        
        return await call_next(request)

def setup_production_logging():
    """프로덕션 로깅 설정"""
    
    log_level = os.getenv("LOG_LEVEL", "INFO")
    log_file = os.getenv("LOG_FILE", "logs/qclick_production.log")
    
    # 로그 디렉토리 생성
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler()
        ]
    )
    
    # 민감한 정보 로깅 방지
    class SensitiveFormatter(logging.Formatter):
        def format(self, record):
            message = super().format(record)
            # 비밀번호, 토큰 등 민감한 정보 마스킹
            sensitive_keys = ['password', 'token', 'secret', 'key']
            for key in sensitive_keys:
                if key in message.lower():
                    message = message.replace(record.getMessage(), "[MASKED]")
            return message
    
    # 프로덕션에서는 민감한 정보 마스킹
    if os.getenv("ENV") == "production":
        for handler in logging.getLogger().handlers:
            handler.setFormatter(SensitiveFormatter())

# 환경 변수 검증
def validate_production_env():
    """프로덕션 환경 변수 검증"""
    
    required_vars = [
        "SECRET_KEY",
        "JWT_SECRET", 
        "DATABASE_URL",
        "ADMIN_EMAIL",
        "ADMIN_PASSWORD"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars and os.getenv("ENV") == "production":
        raise ValueError(f"필수 환경 변수가 설정되지 않았습니다: {', '.join(missing_vars)}")

# 데이터베이스 백업 스케줄러 (선택사항)
def setup_database_backup():
    """데이터베이스 백업 설정"""
    
    if os.getenv("ENV") == "production":
        # 여기에 정기적인 DB 백업 로직 추가
        pass
