import os
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from models.user import User

# DB 연결 문자열 (환경변수 또는 기본값)
DB_URL = os.getenv('DATABASE_URL', 'sqlite:///./qclick.db')

def fix_user_fields():
    engine = create_engine(DB_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        users = session.query(User).all()
        changed = False
        for user in users:
            updated = False
            if not user.name or user.name.strip() == '':
                user.name = f"{user.id} 사용자"
                updated = True
            if not user.email or user.email.strip() == '':
                user.email = f"{user.id}@example.com"
                updated = True
            if not user.role or user.role.strip() == '':
                user.role = 'user' if user.id != 'admin' else 'admin'
                updated = True
            if user.is_active is None:
                user.is_active = True
                updated = True
            if updated:
                print(f"[수정됨] {user.id} → name: {user.name}, email: {user.email}, role: {user.role}, is_active: {user.is_active}")
                changed = True
        if changed:
            session.commit()
            print('✅ 일부 계정의 빈 필드를 자동으로 채웠습니다.')
        else:
            print('모든 계정의 필수 필드가 이미 채워져 있습니다.')
    finally:
        session.close()

if __name__ == '__main__':
    fix_user_fields() 