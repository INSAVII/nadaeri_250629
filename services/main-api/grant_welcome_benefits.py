#!/usr/bin/env python3
"""
신규 가입 혜택 부여 스크립트
기존 사용자들에게 예치금 10,000원과 무료 프로그램 권한을 부여합니다.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import Base, engine
from models.user import User

def grant_welcome_benefits():
    """기존 사용자들에게 신규 가입 혜택을 부여합니다."""
    
    # 데이터베이스 세션 생성
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("=== 신규 가입 혜택 부여 스크립트 ===")
        
        # 모든 사용자 조회
        users = db.query(User).all()
        
        print(f"총 사용자 수: {len(users)}")
        print()
        
        updated_count = 0
        
        for user in users:
            print(f"사용자: {user.name} ({user.email})")
            print(f"  - 현재 예치금: {user.balance}원")
            print(f"  - 현재 무료권한: {user.program_permissions_free}")
            
            # 혜택 부여 여부 확인
            needs_balance = user.balance < 10000
            needs_free_permission = not user.program_permissions_free
            
            if needs_balance or needs_free_permission:
                print(f"  - 혜택 부여 필요: 예치금={needs_balance}, 무료권한={needs_free_permission}")
                
                # 예치금 부여
                if needs_balance:
                    user.balance = 10000.0
                    print(f"  - 예치금 10,000원 지급 완료")
                
                # 무료 권한 부여
                if needs_free_permission:
                    user.program_permissions_free = True
                    print(f"  - 무료 프로그램 권한 부여 완료")
                
                updated_count += 1
            else:
                print(f"  - 이미 혜택이 부여됨")
            
            print()
        
        # 변경사항 커밋
        if updated_count > 0:
            db.commit()
            print(f"✅ 총 {updated_count}명의 사용자에게 혜택이 부여되었습니다.")
        else:
            print("ℹ️ 모든 사용자가 이미 혜택을 받고 있습니다.")
        
        # 최종 통계
        print("\n=== 최종 통계 ===")
        final_users = db.query(User).all()
        balance_10k_count = sum(1 for user in final_users if user.balance >= 10000)
        free_permission_count = sum(1 for user in final_users if user.program_permissions_free)
        
        print(f"예치금 10,000원 이상 보유자: {balance_10k_count}명")
        print(f"무료 프로그램 권한 보유자: {free_permission_count}명")
        
    except Exception as e:
        print(f"오류 발생: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    grant_welcome_benefits() 