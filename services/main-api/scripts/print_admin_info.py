import os
import sys
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from models.user import User

# DB 연결 문자열 (환경변수 또는 기본값)
DB_URL = os.getenv('DATABASE_URL', 'sqlite:///../main-api.db')

def print_admin_info():
    engine = create_engine(DB_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        admin = session.query(User).filter(User.id == 'admin').first()
        if not admin:
            print('❌ admin 계정을 찾을 수 없습니다.')
            return
        print('✅ admin 계정 정보:')
        for col in admin.__table__.columns:
            print(f"{col.name}: {getattr(admin, col.name)}")
    finally:
        session.close()

if __name__ == '__main__':
    print_admin_info() 