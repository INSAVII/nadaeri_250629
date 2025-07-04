from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 환경 변수 로드 (dotenv 사용하지 않음)
# load_dotenv()  # 주석 처리

# 데이터베이스 URL
# Railway 배포 환경에서는 DATABASE_URL 환경변수를 사용
# 로컬 개발 환경에서는 SQLite 사용
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./qclick.db")

# PostgreSQL 연결을 위한 추가 설정
if DATABASE_URL.startswith("postgresql://"):
    # Railway PostgreSQL 연결
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False
    )
    print(f"PostgreSQL 연결 설정 완료: {DATABASE_URL[:50]}...")
else:
    # SQLite 연결 (로컬 개발용) - 절대경로 사용
    db_file_path = DATABASE_URL.replace("sqlite:///", "")
    abs_db_path = os.path.abspath(db_file_path)
    
    # 절대경로로 DB URL 생성
    abs_db_url = f"sqlite:///{abs_db_path}"
    engine = create_engine(abs_db_url)
    
    print(f"SQLite 연결 설정 완료: {abs_db_url}")
    
    # DB 파일 절대경로 로깅 추가
    print("=" * 60)
    print(f"FastAPI가 사용하는 DB 파일 절대경로: {abs_db_path}")
    print(f"DB 파일 존재 여부: {os.path.exists(abs_db_path)}")
    print("=" * 60)

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
