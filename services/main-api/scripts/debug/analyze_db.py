#!/usr/bin/env python3
"""현재 DB 상태를 상세히 분석하는 스크립트"""

from database import get_db
from models.user import User

def analyze_db_state():
    db = next(get_db())
    try:
        print('=== DB 연결 상태 ===')
        all_users = db.query(User).all()
        print(f'총 사용자 수: {len(all_users)}')
        
        print('\n=== 모든 사용자 목록 ===')
        for user in all_users:
            print(f'ID: {user.id}, 이름: {user.name}, 역할: "{user.role}", 활성: {user.is_active}, 잔액: {user.balance}')
        
        print('\n=== admin 계정 상세 분석 ===')
        admin = db.query(User).filter(User.id == 'admin').first()
        if admin:
            print(f'ID: {admin.id}')
            print(f'email: {admin.email}')
            print(f'name: {admin.name}')
            print(f'role: "{admin.role}"')
            print(f'role type: {type(admin.role)}')
            print(f'role length: {len(admin.role) if admin.role else None}')
            print(f'role repr: {repr(admin.role)}')
            print(f'role == "admin": {admin.role == "admin"}')
            print(f'role == "user": {admin.role == "user"}')
            print(f'balance: {admin.balance}')
            print(f'is_active: {admin.is_active}')
            print(f'hashed_password exists: {bool(admin.hashed_password)}')
            print(f'is_admin property: {admin.is_admin}')
        else:
            print('ERROR: admin 계정이 DB에 없습니다!')
            
    finally:
        db.close()

if __name__ == "__main__":
    analyze_db_state()
