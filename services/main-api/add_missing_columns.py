# -*- coding: utf-8 -*-
"""
PostgreSQL에 missing 컬럼들을 추가하는 스크립트
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_missing_columns():
    """missing 컬럼들을 추가"""
    try:
        with engine.connect() as conn:
            # users 테이블에 missing 컬럼들 추가
            missing_columns = [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS region VARCHAR", 
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS age VARCHAR",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS work_type VARCHAR",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS has_business BOOLEAN DEFAULT FALSE",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS business_number VARCHAR",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS program_permissions_free BOOLEAN DEFAULT FALSE",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS program_permissions_month1 BOOLEAN DEFAULT FALSE", 
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS program_permissions_month3 BOOLEAN DEFAULT FALSE"
            ]
            
            for sql in missing_columns:
                try:
                    conn.execute(text(sql))
                    logger.info(f"컬럼 추가 성공: {sql}")
                except Exception as e:
                    logger.warning(f"컬럼 추가 실패 (이미 존재할 수 있음): {e}")
            
            conn.commit()
            logger.info("Missing 컬럼 추가 완료!")
            return True
            
    except Exception as e:
        logger.error(f"컬럼 추가 실패: {e}")
        return False

if __name__ == "__main__":
    print("🔧 PostgreSQL missing 컬럼 추가 시작...")
    success = add_missing_columns()
    
    if success:
        print("✅ Missing 컬럼 추가 완료!")
    else:
        print("❌ Missing 컬럼 추가 실패!")
        sys.exit(1)
