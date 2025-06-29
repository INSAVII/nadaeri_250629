"""
공통 에러 처리 및 응답 유틸리티
"""
from fastapi import HTTPException, status
from pydantic import BaseModel
from typing import Optional, Any, Dict
import logging

logger = logging.getLogger(__name__)

class ErrorResponse(BaseModel):
    """표준 에러 응답 모델"""
    success: bool = False
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None

class SuccessResponse(BaseModel):
    """표준 성공 응답 모델"""
    success: bool = True
    message: str
    data: Optional[Any] = None

def create_error_response(
    error_code: str,
    message: str,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    details: Optional[Dict[str, Any]] = None
) -> HTTPException:
    """표준 에러 응답을 생성합니다"""
    logger.error(f"Error {error_code}: {message}")
    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error_code": error_code,
            "message": message,
            "details": details or {}
        }
    )

def create_success_response(
    message: str,
    data: Optional[Any] = None
) -> SuccessResponse:
    """표준 성공 응답을 생성합니다"""
    return SuccessResponse(
        message=message,
        data=data
    )

# 공통 에러 코드 상수
class ErrorCodes:
    # 인증 관련
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    INVALID_TOKEN = "INVALID_TOKEN"
    
    # 사용자 관련
    USER_NOT_FOUND = "USER_NOT_FOUND"
    USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    
    # 프로그램 관련
    PROGRAM_NOT_FOUND = "PROGRAM_NOT_FOUND"
    PROGRAM_ACCESS_DENIED = "PROGRAM_ACCESS_DENIED"
    
    # 파일 관련
    FILE_NOT_FOUND = "FILE_NOT_FOUND"
    FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR"
    INVALID_FILE_FORMAT = "INVALID_FILE_FORMAT"
    
    # 데이터베이스 관련
    DATABASE_ERROR = "DATABASE_ERROR"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    
    # 일반적인 에러
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    BAD_REQUEST = "BAD_REQUEST"
