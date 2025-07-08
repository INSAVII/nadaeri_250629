#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from database import engine
from models.user import User
from sqlalchemy.orm import sessionmaker

def check_users():
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        users = session.query(User).all()
        print(f"총 사용자 수: {len(users)}")
        
        if len(users) == 0:
            print("❌ 데이터베이스에 사용자가 없습니다!")
            return False
        
        print("\n=== 사용자 목록 ===")
        for i, user in enumerate(users[:10], 1):  # 최대 10명만 표시
            print(f"{i}. ID: {user.id}")
            print(f"   이메일: {user.email}")
            print(f"   이름: {user.name}")
            print(f"   역할: {user.role}")
            print(f"   활성: {user.is_active}")
            print(f"   프로그램 권한 - 무료: {user.program_permissions_free}, 1개월: {user.program_permissions_month1}, 3개월: {user.program_permissions_month3}")
            print()
        
        if len(users) > 10:
            print(f"... 그리고 {len(users) - 10}명 더")
        
        # 관리자 계정 확인
        admins = [u for u in users if u.role == 'admin']
        print(f"\n관리자 계정 수: {len(admins)}")
        for admin in admins:
            print(f"  - {admin.email} ({admin.name})")
        
        return True
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False
    finally:
        session.close()

if __name__ == "__main__":
    check_users() 