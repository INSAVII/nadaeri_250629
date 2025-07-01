#!/usr/bin/env python3
"""
관리자 비밀번호 수정 스크립트 (환경변수 없이 실행)
"""

import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models.user import User
import uuid
from datetime import datetime

# 환경변수 직접 설정 (환경변수 파일 로딩 우회)
os.environ.setdefault("DATABASE_URL", "sqlite:///./qclick.db")

# dotenv 모듈을 monkey patch하여 load_dotenv() 호출을 무시
import dotenv
def noop_load_dotenv(*args, **kwargs):
    pass
dotenv.load_dotenv = noop_load_dotenv

# SQLite 데이터베이스 연결 (로컬 개발용)
DATABASE_URL = "sqlite:///./qclick.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def fix_admin_password():
    """관리자 계정의 비밀번호를 수정합니다."""
    
    # 데이터베이스 세션 생성
    db = SessionLocal()
    
    try:
        # 기존 관리자 계정 찾기
        admin_user = db.query(User).filter(
            (User.email == "admin@qclick.com") | (User.user_id == "admin")
        ).first()
        
        if not admin_user:
            print("❌ 관리자 계정을 찾을 수 없습니다.")
            return False
        
        print(f"✅ 관리자 계정을 찾았습니다:")
        print(f"   - ID: {admin_user.id}")
        print(f"   - Email: {admin_user.email}")
        print(f"   - User ID: {admin_user.user_id}")
        print(f"   - Role: {admin_user.role}")
        
        # 비밀번호 해시 업데이트
        admin_user.hashed_password = User.get_password_hash("admin")
        
        db.commit()
        
        print(f"✅ 관리자 비밀번호가 성공적으로 수정되었습니다!")
        print(f"\n🔑 로그인 정보:")
        print(f"   - User ID: admin")
        print(f"   - Password: admin")
        print(f"   - Email: admin@qclick.com")
        
        return True
        
    except Exception as e:
        print(f"❌ 관리자 비밀번호 수정 중 오류 발생: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

def list_all_users():
    """모든 사용자 목록을 조회합니다."""
    
    db = SessionLocal()
    
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
    print("관리자 비밀번호 수정 스크립트")
    print("=" * 60)
    
    # 관리자 비밀번호 수정
    success = fix_admin_password()
    
    if success:
        print(f"\n✅ 관리자 비밀번호 수정 완료!")
    else:
        print(f"\n❌ 관리자 비밀번호 수정 실패")
    
    # 모든 사용자 목록 조회
    list_all_users()
    
    print("\n" + "=" * 60) 