# -*- coding: utf-8 -*-
"""
Railway PostgreSQL 데이터베이스 테이블 강제 재생성 스크립트
기존 테이블을 삭제하고 새로운 스키마로 재생성합니다.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from models import Base
from models.user import User
from models.program import Program
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def recreate_database():
    """데이터베이스 테이블 재생성"""
    try:
        logger.info("기존 테이블 삭제 시작...")
        
        # 모든 테이블 삭제
        Base.metadata.drop_all(bind=engine)
        logger.info("기존 테이블 삭제 완료")
        
        # 새 테이블 생성
        logger.info("새 테이블 생성 시작...")
        Base.metadata.create_all(bind=engine)
        logger.info("새 테이블 생성 완료")
        
        logger.info("데이터베이스 재생성 성공!")
        return True
        
    except Exception as e:
        logger.error(f"데이터베이스 재생성 실패: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Railway PostgreSQL 데이터베이스 재생성 시작...")
    success = recreate_database()
    
    if success:
        print("✅ 데이터베이스 재생성 완료!")
        print("ℹ️  이제 admin 사용자를 다시 생성해야 합니다.")
    else:
        print("❌ 데이터베이스 재생성 실패!")
        sys.exit(1)
