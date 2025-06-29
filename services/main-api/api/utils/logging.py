"""
로깅 설정 및 유틸리티
"""
import logging
import os
from datetime import datetime
from pathlib import Path

def setup_logging():
    """로깅 시스템을 설정합니다"""
    
    # 로그 디렉토리 생성
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # 로그 레벨 설정
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    
    # 로거 설정
    logging.basicConfig(
        level=getattr(logging, log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            # 콘솔 출력
            logging.StreamHandler(),
            # 파일 출력
            logging.FileHandler(
                log_dir / f"qclick_{datetime.now().strftime('%Y%m%d')}.log",
                encoding='utf-8'
            )
        ]
    )
    
    # 특정 라이브러리 로그 레벨 조정
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    return logging.getLogger("qclick")

def get_logger(name: str = None):
    """모듈별 로거를 가져옵니다"""
    if name:
        return logging.getLogger(f"qclick.{name}")
    return logging.getLogger("qclick")
