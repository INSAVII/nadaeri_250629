import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from logger_config import logger

class LoggingMiddleware(BaseHTTPMiddleware):
    """로깅 미들웨어"""
    
    async def dispatch(self, request: Request, call_next):
        # 요청 시작 시간
        start_time = time.time()
        
        # 요청 ID 생성
        request_id = str(uuid.uuid4())
        
        # 사용자 ID 추출 (헤더에서)
        user_id = request.headers.get("X-User-ID")
        
        # 요청 로깅
        logger.log_request(
            method=request.method,
            endpoint=str(request.url.path),
            user_id=user_id,
            request_id=request_id,
            query_params=dict(request.query_params),
            headers=dict(request.headers)
        )
        
        try:
            # 다음 미들웨어/엔드포인트 호출
            response = await call_next(request)
            
            # 응답 시간 계산
            response_time = time.time() - start_time
            
            # 응답 로깅
            logger.log_response(
                method=request.method,
                endpoint=str(request.url.path),
                status_code=response.status_code,
                response_time=response_time,
                user_id=user_id,
                request_id=request_id
            )
            
            # 응답 헤더에 요청 ID 추가
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # 에러 발생 시 로깅
            response_time = time.time() - start_time
            
            logger.log_error(
                error=e,
                context={
                    "method": request.method,
                    "endpoint": str(request.url.path),
                    "user_id": user_id,
                    "request_id": request_id
                },
                user_id=user_id
            )
            
            # 에러 응답 로깅
            logger.log_response(
                method=request.method,
                endpoint=str(request.url.path),
                status_code=500,
                response_time=response_time,
                user_id=user_id,
                request_id=request_id,
                error=str(e)
            )
            
            raise

class PerformanceMiddleware(BaseHTTPMiddleware):
    """성능 모니터링 미들웨어"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # 요청 처리
        response = await call_next(request)
        
        # 처리 시간 계산
        duration = time.time() - start_time
        
        # 성능 로깅 (느린 요청만)
        if duration > 1.0:  # 1초 이상 걸린 요청
            logger.log_performance(
                operation=f"{request.method} {request.url.path}",
                duration=duration,
                status_code=response.status_code
            )
        
        return response 