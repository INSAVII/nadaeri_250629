#!/usr/bin/env python3
"""
프로그램 권한 상태 확인 스크립트
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import Base, engine
from models.user import User

def check_program_permissions():
    """사용자들의 프로그램 권한 상태를 확인합니다."""
    
    # 데이터베이스 세션 생성
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("=== 프로그램 권한 상태 확인 ===")
        
        # 모든 사용자 조회
        users = db.query(User).all()
        
        print(f"총 사용자 수: {len(users)}")
        print()
        
        for user in users:
            print(f"사용자: {user.name} ({user.email})")
            print(f"  - 무료 권한: {user.program_permissions_free}")
            print(f"  - 1개월 권한: {user.program_permissions_month1}")
            print(f"  - 3개월 권한: {user.program_permissions_month3}")
            print()
        
        # 권한별 통계
        free_count = sum(1 for user in users if user.program_permissions_free)
        month1_count = sum(1 for user in users if user.program_permissions_month1)
        month3_count = sum(1 for user in users if user.program_permissions_month3)
        
        print("=== 권한별 통계 ===")
        print(f"무료 권한 보유자: {free_count}명")
        print(f"1개월 권한 보유자: {month1_count}명")
        print(f"3개월 권한 보유자: {month3_count}명")
        
    except Exception as e:
        print(f"오류 발생: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_program_permissions() 