#!/usr/bin/env python3
"""admin 계정의 role 정보를 확인하는 스크립트"""

from database import get_db
from models.user import User

def check_admin_user():
    db = next(get_db())
    try:
        admin = db.query(User).filter(User.id == 'admin').first()
        if admin:
            print('Admin 사용자 발견:')
            print(f'  ID: {admin.id}')
            print(f'  email: {admin.email}')
            print(f'  name: {admin.name}')
            print(f'  role: {admin.role}')
            print(f'  role type: {type(admin.role)}')
            print(f'  role equals admin: {admin.role == "admin"}')
            print(f'  is_active: {admin.is_active}')
            print(f'  balance: {admin.balance}')
            print(f'  is_admin property: {admin.is_admin}')
        else:
            print('Admin 사용자가 없습니다.')
    finally:
        db.close()

if __name__ == "__main__":
    check_admin_user()
