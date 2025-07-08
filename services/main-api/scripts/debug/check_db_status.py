#!/usr/bin/env python3
"""
데이터베이스 상태 확인 스크립트
"""

from database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_database_status():
    """데이터베이스 상태 확인"""
    
    try:
        logger.info("=== 데이터베이스 상태 확인 ===")
        
        # 1. users 테이블 구조 확인
        logger.info("1. users 테이블 구조 확인:")
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = result.fetchall()
        
        if columns:
            for col in columns:
                logger.info(f"   - {col[1]} ({col[2]}) - Default: {col[4]}")
        else:
            logger.error("   ❌ users 테이블이 존재하지 않습니다!")
            return
        
        # 2. 프로그램 권한 컬럼 확인
        logger.info("\n2. 프로그램 권한 컬럼 확인:")
        program_columns = ['program_permissions_free', 'program_permissions_month1', 'program_permissions_month3']
        
        existing_columns = [col[1] for col in columns]
        missing_columns = []
        
        for col in program_columns:
            if col in existing_columns:
                logger.info(f"   ✅ {col} - 존재함")
            else:
                logger.info(f"   ❌ {col} - 없음")
                missing_columns.append(col)
        
        # 3. 사용자 데이터 확인
        logger.info("\n3. 사용자 데이터 확인:")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.fetchone()[0]
        logger.info(f"   - 총 사용자 수: {user_count}")
        
        if user_count > 0:
            with engine.connect() as conn:
                result = conn.execute(text("SELECT id, email, name, role FROM users LIMIT 5"))
                users = result.fetchall()
            for user in users:
                logger.info(f"   - {user[0]} ({user[1]}) - {user[2]} - {user[3]}")
        
        # 4. 마이그레이션 필요 여부 판단
        if missing_columns:
            logger.info(f"\n4. 마이그레이션 필요: {len(missing_columns)}개 컬럼 추가 필요")
            logger.info(f"   - 누락된 컬럼: {', '.join(missing_columns)}")
            return False
        else:
            logger.info("\n4. ✅ 모든 컬럼이 존재함 - 마이그레이션 불필요")
            return True
            
    except Exception as e:
        logger.error(f"데이터베이스 상태 확인 중 오류: {e}")
        return False

if __name__ == "__main__":
    check_database_status() 