#!/usr/bin/env python3
"""
프로그램 권한 상태 진단 스크립트
"""

from database import engine
from models.program import Program, UserProgram
from models.user import User
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

def check_program_permissions():
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("=== 프로그램 권한 상태 진단 ===\n")
        
        # 1. 프로그램 테이블 확인
        print("1. 프로그램 목록:")
        programs = session.query(Program).all()
        if programs:
            for p in programs:
                print(f"   - ID: {p.id}, Name: {p.name}, Type: {p.type}, License: {p.license_type}, Active: {p.is_active}")
        else:
            print("   ❌ 프로그램이 없습니다!")
        
        print()
        
        # 2. 사용자 목록 확인
        print("2. 사용자 목록:")
        users = session.query(User).all()
        if users:
            for u in users:
                print(f"   - ID: {u.id}, Email: {u.email}, Role: {u.role}, Active: {u.is_active}")
        else:
            print("   ❌ 사용자가 없습니다!")
        
        print()
        
        # 3. 사용자 프로그램 권한 확인
        print("3. 사용자 프로그램 권한:")
        user_programs = session.query(UserProgram).all()
        if user_programs:
            for up in user_programs:
                print(f"   - User: {up.user_id}, Program: {up.program_id}, Allowed: {up.is_allowed}, Expires: {up.expires_at}")
        else:
            print("   ❌ 사용자 프로그램 권한이 없습니다!")
        
        print()
        
        # 4. 특정 사용자의 권한 확인 (admin)
        print("4. admin 사용자의 프로그램 권한:")
        admin_programs = session.query(UserProgram).filter(UserProgram.user_id == "admin").all()
        if admin_programs:
            for ap in admin_programs:
                print(f"   - Program: {ap.program_id}, Allowed: {ap.is_allowed}, Expires: {ap.expires_at}")
        else:
            print("   ❌ admin 사용자의 프로그램 권한이 없습니다!")
        
        print()
        
        # 5. 테이블 구조 확인
        print("5. 테이블 구조 확인:")
        try:
            result = session.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            tables = [row[0] for row in result]
            print(f"   데이터베이스 테이블: {', '.join(tables)}")
        except Exception as e:
            print(f"   ❌ 테이블 구조 확인 실패: {e}")
        
    except Exception as e:
        print(f"❌ 진단 중 오류 발생: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    check_program_permissions() 