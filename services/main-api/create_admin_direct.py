#!/usr/bin/env python3
"""
직접 DB 연결로 관리자 계정 생성 (환경변수 완전 우회)
"""

import sys
import os
from sqlalchemy import create_engine, Column, String, Float, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import func
import uuid
from datetime import datetime
import hashlib
import secrets

# SQLite 데이터베이스 직접 연결
DATABASE_URL = "sqlite:///./qclick.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 간단한 User 모델 정의 (환경변수 없이)
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)  # userId가 직접 id로 저장됨
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="user")
    balance = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """비밀번호 해시 생성"""
        salt = secrets.token_hex(16)
        hash_obj = hashlib.sha256()
        hash_obj.update((password + salt).encode())
        return f"{salt}${hash_obj.hexdigest()}"
    
    def verify_password(self, password: str) -> bool:
        """비밀번호 검증"""
        if not self.hashed_password or '$' not in self.hashed_password:
            return False
        salt, stored_hash = self.hashed_password.split('$', 1)
        hash_obj = hashlib.sha256()
        hash_obj.update((password + salt).encode())
        return hash_obj.hexdigest() == stored_hash

def create_admin_user():
    """관리자 계정을 생성합니다."""
    
    # 데이터베이스 세션 생성
    db = SessionLocal()
    
    try:
        # 기존 관리자 계정 확인
        existing_admin = db.query(User).filter(
            (User.email == "admin@qclick.com") | (User.id == "admin")
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
            id="admin",  # userId가 직접 id로 저장됨
            email="admin@qclick.com",
            hashed_password=User.get_password_hash("admin"),
            name="관리자",
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
        print(f"   - User ID: {admin_user.id}")
        print(f"   - Name: {admin_user.name}")
        print(f"   - Role: {admin_user.role}")
        print(f"   - Balance: {admin_user.balance:,}원")
        print(f"   - Active: {admin_user.is_active}")
        
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
    
    db = SessionLocal()
    
    try:
        users = db.query(User).all()
        
        print(f"\n📋 현재 등록된 사용자 목록 ({len(users)}명):")
        print("-" * 80)
        
        for user in users:
            print(f"ID: {user.id}")
            print(f"  - Email: {user.email}")
            print(f"  - User ID: {user.id}")
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

def test_admin_login():
    """관리자 로그인을 테스트합니다."""
    
    db = SessionLocal()
    
    try:
        admin_user = db.query(User).filter(User.id == "admin").first()
        if not admin_user:
            print("❌ 관리자 계정을 찾을 수 없습니다.")
            return False
        
        if admin_user.verify_password("admin"):
            print("✅ 관리자 로그인 테스트 성공!")
            print(f"   - User ID: {admin_user.id}")
            print(f"   - Email: {admin_user.email}")
            print(f"   - Role: {admin_user.role}")
            return True
        else:
            print("❌ 관리자 로그인 테스트 실패: 비밀번호가 일치하지 않습니다.")
            return False
            
    except Exception as e:
        print(f"❌ 로그인 테스트 중 오류 발생: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("직접 DB 연결 관리자 계정 생성 스크립트")
    print("=" * 60)
    
    # 관리자 계정 생성
    success = create_admin_user()
    
    if success:
        print(f"\n✅ 관리자 계정 생성 완료!")
        
        # 로그인 테스트
        print(f"\n🔍 관리자 로그인 테스트...")
        test_admin_login()
    else:
        print(f"\n⚠️ 관리자 계정 생성 실패 또는 이미 존재")
    
    # 모든 사용자 목록 조회
    list_all_users()
    
    print("\n" + "=" * 60) 