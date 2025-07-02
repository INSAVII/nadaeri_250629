import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.user import User
from database import Base

# 환경 변수 또는 기본값으로 DB URL 설정
DB_URL = os.getenv("DATABASE_URL", "sqlite:///../main-api/qclick.db")

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

ADMIN_USER_ID = "admin"
ADMIN_EMAIL = "admin@qclick.com"
ADMIN_PASSWORD = "admin"  # 실제 서비스에서는 강력한 비밀번호로 변경 필요
ADMIN_ROLE = "admin"


def ensure_admin():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        user = session.query(User).filter((User.id == ADMIN_USER_ID) | (User.email == ADMIN_EMAIL)).first()
        hashed_pw = User.get_password_hash(ADMIN_PASSWORD)
        if user:
            user.id = ADMIN_USER_ID
            user.email = ADMIN_EMAIL
            user.hashed_password = hashed_pw
            user.role = ADMIN_ROLE
            user.is_active = True
            print("[INFO] 기존 admin 계정이 갱신되었습니다.")
        else:
            user = User(
                id=ADMIN_USER_ID,
                email=ADMIN_EMAIL,
                hashed_password=hashed_pw,
                role=ADMIN_ROLE,
                is_active=True
            )
            session.add(user)
            print("[INFO] admin 계정이 새로 생성되었습니다.")
        session.commit()
        print("[SUCCESS] admin 계정이 정상적으로 보장되었습니다.")
    except Exception as e:
        print(f"[ERROR] {e}")
        session.rollback()
        sys.exit(1)
    finally:
        session.close()

if __name__ == "__main__":
    ensure_admin()
