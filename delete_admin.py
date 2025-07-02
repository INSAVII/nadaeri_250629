#!/usr/bin/env python3
"""
admin 계정 삭제 스크립트
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# SQLite 데이터베이스 연결
DATABASE_URL = "sqlite:///services/main-api/qclick.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def delete_admin_accounts():
    """admin 관련 계정들을 삭제합니다."""
    
    session = Session()
    
    try:
        # admin 계정 삭제
        result = session.execute(text("DELETE FROM users WHERE id='admin' OR email='admin@qclick.com'"))
        session.commit()
        
        print(f"✅ admin 계정 삭제 완료: {result.rowcount}개 행이 삭제되었습니다.")
        
        # 현재 사용자 목록 확인
        users = session.execute(text("SELECT id, email, name FROM users")).fetchall()
        print(f"\n📋 현재 사용자 목록 ({len(users)}명):")
        for user in users:
            print(f"  - ID: {user[0]}, Email: {user[1]}, Name: {user[2]}")
            
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    print("=" * 50)
    print("admin 계정 삭제 스크립트")
    print("=" * 50)
    
    delete_admin_accounts()
    
    print("\n" + "=" * 50) 