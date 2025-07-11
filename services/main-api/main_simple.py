# -*- coding: utf-8 -*-
from fastapi import FastAPI
import os
import uvicorn
import logging
from datetime import datetime

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 시작 로그
print("🚀 QClick Main API Simple Version 시작")
print(f"Python 버전: {sys.version}")
print(f"현재 작업 디렉토리: {os.getcwd()}")
print(f"환경변수 PORT: {repr(os.getenv('PORT', '설정되지 않음'))}")

# 간단한 FastAPI 앱 생성 (최소 버전)
app = FastAPI(title="QClick Health Check Test")

@app.get("/")
async def root():
    logger.info("루트 엔드포인트 호출됨")
    return {
        "message": "서버가 정상 작동 중입니다.",
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "service": "qclick-main-api"
    }

@app.get("/health")
async def health_check():
    logger.info("헬스체크 엔드포인트 호출됨")
    return {
        "status": "healthy",
        "message": "서버 상태 양호",
        "timestamp": datetime.now().isoformat(),
        "service": "qclick-main-api",
        "version": "simple-1.0"
    }

# 서버 실행
if __name__ == "__main__":
    # Railway PORT 환경변수 안전하게 처리
    try:
        port = int(os.getenv("PORT", 8000))
        logger.info(f"PORT 환경변수에서 포트 읽음: {port}")
    except (ValueError, TypeError) as e:
        port = 8000
        logger.warning(f"PORT 환경변수 파싱 실패, 기본값 사용: {e}")

    host = os.getenv("HOST", "0.0.0.0")

    logger.info(f"🚀 서버 시작: {host}:{port}")
    logger.info(f"PORT 환경변수 원본: {repr(os.getenv('PORT', '기본값8000'))}")
    logger.info(f"변환된 포트: {port}")
    logger.info(f"서비스 환경: {os.getenv('ENVIRONMENT', 'development')}")

    try:
        uvicorn.run(
            app,
            host=host,
            port=port,
            reload=False,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"❌ 서버 시작 실패: {str(e)}")
        raise
