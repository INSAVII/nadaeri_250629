from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# 데이터베이스 URL
# 환경 변수에서 DATABASE_URL을 가져오거나 기본값으로 SQLite 사용
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./qclick.db")

# PostgreSQL 연결을 위한 추가 설정
if DATABASE_URL.startswith("postgresql://"):
    # PostgreSQL 연결 풀 설정
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False
    )
else:
    # SQLite 연결
    engine = create_engine(DATABASE_URL)

# 세션 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 모델 기본 클래스
Base = declarative_base()

# 데이터베이스 세션 의존성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
