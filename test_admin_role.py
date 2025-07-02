#!/usr/bin/env python3
import sys
import os

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), 'services', 'main-api'))

from database import get_db
from models.user import User

def test_admin_role():
    try:
        db = next(get_db())
        
        # 모든 admin 사용자 조회
        admin_users = db.query(User).filter(User.role == 'admin').all()
        print(f"Admin users count: {len(admin_users)}")
        
        for user in admin_users:
            print(f"ID: {user.id}")
            print(f"Email: {user.email}")
            print(f"Role: {user.role}")
            print(f"Is Admin (property): {user.is_admin}")
            print(f"Is Active: {user.is_active}")
            print("-" * 50)
        
        # 모든 사용자 조회 (role 확인)
        all_users = db.query(User).all()
        print(f"\nAll users count: {len(all_users)}")
        
        for user in all_users:
            print(f"ID: {user.id}, Email: {user.email}, Role: {user.role}, Is Admin: {user.is_admin}")
        
        db.close()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_admin_role() 