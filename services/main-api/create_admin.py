#!/usr/bin/env python3
"""
관리자 계정 생성 스크립트
"""

import sys
import os
from sqlalchemy.orm import Session
from database import engine, get_db
from models.user import User
from models.program import Program, UserProgram
import uuid
from datetime import datetime

def create_admin_user():
    """관리자 계정을 생성합니다."""
    
    # 데이터베이스 세션 생성
    db = Session(engine)
    
    try:
        # 기존 관리자 계정 확인
        existing_admin = db.query(User).filter(
            (User.email == "admin@qclick.com") | (User.user_id == "admin")
        ).first()
        
        if existing_admin:
            print(f"❌ 관리자 계정이 이미 존재합니다:")
            print(f"   - ID: {existing_admin.id}")
            print(f"   - Email: {existing_admin.email}")
            print(f"   - User ID: {existing_admin.user_id}")
            print(f"   - Role: {existing_admin.role}")
            return False
        
        # 관리자 계정 생성
        admin_user = User(
            email="admin@qclick.com",
            hashed_password=User.get_password_hash("admin"),
            name="관리자",
            user_id="admin",
            role="admin",
            balance=100000.0,  # 관리자는 10만원 잔액
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"✅ 관리자 계정이 성공적으로 생성되었습니다:")
        print(f"   - ID: {admin_user.id}")
        print(f"   - Email: {admin_user.email}")
        print(f"   - User ID: {admin_user.user_id}")
        print(f"   - Name: {admin_user.name}")
        print(f"   - Role: {admin_user.role}")
        print(f"   - Balance: {admin_user.balance:,}원")
        print(f"   - Active: {admin_user.is_active}")
        
        # 무료 프로그램 자동 활성화
        free_programs = db.query(Program).filter(Program.license_type == "free").all()
        if free_programs:
            for program in free_programs:
                user_program = UserProgram(
                    id=str(uuid.uuid4()),
                    user_id=admin_user.id,
                    program_id=program.id,
                    is_allowed=True,
                    download_count=0,
                    created_at=datetime.utcnow()
                )
                db.add(user_program)
            
            db.commit()
            print(f"   - 무료 프로그램 {len(free_programs)}개 자동 활성화")
        
        print(f"\n🔑 로그인 정보:")
        print(f"   - User ID: admin")
        print(f"   - Password: admin")
        print(f"   - Email: admin@qclick.com")
        
        return True
        
    except Exception as e:
        print(f"❌ 관리자 계정 생성 중 오류 발생: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

def list_all_users():
    """모든 사용자 목록을 조회합니다."""
    
    db = Session(engine)
    
    try:
        users = db.query(User).all()
        
        print(f"\n📋 현재 등록된 사용자 목록 ({len(users)}명):")
        print("-" * 80)
        
        for user in users:
            print(f"ID: {user.id}")
            print(f"  - Email: {user.email}")
            print(f"  - User ID: {user.user_id}")
            print(f"  - Name: {user.name}")
            print(f"  - Role: {user.role}")
            print(f"  - Balance: {user.balance:,}원")
            print(f"  - Active: {user.is_active}")
            print(f"  - Created: {user.created_at}")
            print("-" * 40)
            
    except Exception as e:
        print(f"❌ 사용자 목록 조회 중 오류 발생: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("관리자 계정 생성 스크립트")
    print("=" * 60)
    
    # 관리자 계정 생성
    success = create_admin_user()
    
    if success:
        print(f"\n✅ 관리자 계정 생성 완료!")
    else:
        print(f"\n⚠️ 관리자 계정 생성 실패 또는 이미 존재")
    
    # 모든 사용자 목록 조회
    list_all_users()
    
    print("\n" + "=" * 60) 