#!/usr/bin/env python3
"""
관리자 계정 생성 스크립트
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal
from models.user import User
import uuid
from datetime import datetime

def create_admin_user():
    """관리자 계정을 생성합니다."""
    db = SessionLocal()
    
    try:
        # 기존 관리자 계정 확인
        existing_admin = db.query(User).filter(User.email == "admin@qclick.com").first()
        if existing_admin:
            print(f"✅ 관리자 계정이 이미 존재합니다: {existing_admin.email} (role: {existing_admin.role})")
            return existing_admin
        
        # 새 관리자 계정 생성
        admin_user = User(
            id=str(uuid.uuid4()),
            email="admin@qclick.com",
            hashed_password=User.get_password_hash("admin"),
            name="관리자",
            user_id="admin",
            balance=100000.0,
            role="admin",
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"✅ 관리자 계정이 성공적으로 생성되었습니다!")
        print(f"   이메일: {admin_user.email}")
        print(f"   비밀번호: admin")
        print(f"   역할: {admin_user.role}")
        print(f"   잔액: {admin_user.balance:,}원")
        
        return admin_user
        
    except Exception as e:
        print(f"❌ 관리자 계정 생성 중 오류 발생: {str(e)}")
        db.rollback()
        return None
    finally:
        db.close()

def main():
    print("🔧 관리자 계정 생성 시작...")
    
    # 데이터베이스 연결 확인
    try:
        from database import engine
        with engine.connect() as conn:
            print("✅ 데이터베이스 연결 성공")
    except Exception as e:
        print(f"❌ 데이터베이스 연결 실패: {str(e)}")
        return
    
    # 관리자 계정 생성
    admin = create_admin_user()
    
    if admin:
        print("\n🎉 관리자 계정 생성 완료!")
        print("이제 웹 UI에서 admin@qclick.com / admin으로 로그인할 수 있습니다.")
    else:
        print("\n❌ 관리자 계정 생성 실패!")

if __name__ == "__main__":
    main() 