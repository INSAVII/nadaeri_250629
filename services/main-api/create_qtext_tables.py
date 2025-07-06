#!/usr/bin/env python3
"""
QText 관련 테이블 생성 스크립트
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

# 데이터베이스 URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./qclick.db")

def create_qtext_tables():
    """QText 관련 테이블을 생성합니다."""
    try:
        print("🔧 QText 테이블 생성 시작...")
        
        # 데이터베이스 엔진 생성
        engine = create_engine(DATABASE_URL)
        
        # 세션 생성
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # QText 작업 테이블 생성
        create_qtext_jobs_table = """
        CREATE TABLE IF NOT EXISTS qtext_jobs (
            id VARCHAR PRIMARY KEY,
            user_id VARCHAR NOT NULL,
            file_count INTEGER NOT NULL DEFAULT 0,
            unit_price FLOAT NOT NULL DEFAULT 30.0,
            total_amount FLOAT NOT NULL DEFAULT 0.0,
            status VARCHAR NOT NULL DEFAULT 'processing',
            original_files TEXT,
            processed_files TEXT,
            result_file_path VARCHAR,
            error_message TEXT,
            processing_started_at DATETIME,
            processing_completed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
        """
        
        # 인덱스 생성
        create_indexes = [
            "CREATE INDEX IF NOT EXISTS idx_qtext_jobs_user_id ON qtext_jobs (user_id);",
            "CREATE INDEX IF NOT EXISTS idx_qtext_jobs_status ON qtext_jobs (status);",
            "CREATE INDEX IF NOT EXISTS idx_qtext_jobs_created_at ON qtext_jobs (created_at);",
            "CREATE INDEX IF NOT EXISTS idx_qtext_jobs_processing_started_at ON qtext_jobs (processing_started_at);"
        ]
        
        # 테이블 생성
        print("📋 qtext_jobs 테이블 생성 중...")
        db.execute(text(create_qtext_jobs_table))
        
        # 인덱스 생성
        print("🔍 인덱스 생성 중...")
        for index_sql in create_indexes:
            db.execute(text(index_sql))
        
        # 변경사항 커밋
        db.commit()
        print("✅ QText 테이블 생성 완료!")
        
        # 테이블 정보 확인
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='qtext_jobs';"))
        if result.fetchone():
            print("✅ qtext_jobs 테이블이 성공적으로 생성되었습니다.")
            
            # 컬럼 정보 확인
            columns_result = db.execute(text("PRAGMA table_info(qtext_jobs);"))
            columns = columns_result.fetchall()
            print(f"📊 테이블 컬럼 수: {len(columns)}")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
        else:
            print("❌ qtext_jobs 테이블 생성에 실패했습니다.")
            return False
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ QText 테이블 생성 중 오류 발생: {str(e)}")
        if 'db' in locals():
            db.rollback()
            db.close()
        return False

def verify_qtext_tables():
    """QText 테이블이 올바르게 생성되었는지 확인합니다."""
    try:
        print("🔍 QText 테이블 검증 중...")
        
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # 테이블 존재 확인
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='qtext_jobs';"))
        if not result.fetchone():
            print("❌ qtext_jobs 테이블이 존재하지 않습니다.")
            return False
        
        # 필수 컬럼 확인
        required_columns = [
            'id', 'user_id', 'file_count', 'unit_price', 'total_amount', 
            'status', 'created_at', 'updated_at'
        ]
        
        columns_result = db.execute(text("PRAGMA table_info(qtext_jobs);"))
        existing_columns = [col[1] for col in columns_result.fetchall()]
        
        missing_columns = [col for col in required_columns if col not in existing_columns]
        if missing_columns:
            print(f"❌ 필수 컬럼이 누락되었습니다: {missing_columns}")
            return False
        
        print("✅ QText 테이블 검증 완료!")
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ QText 테이블 검증 중 오류 발생: {str(e)}")
        if 'db' in locals():
            db.close()
        return False

if __name__ == "__main__":
    print("🚀 QText 테이블 생성 스크립트 시작")
    print(f"📊 데이터베이스: {DATABASE_URL}")
    
    # 테이블 생성
    if create_qtext_tables():
        # 테이블 검증
        if verify_qtext_tables():
            print("🎉 QText 테이블 생성 및 검증이 완료되었습니다!")
            sys.exit(0)
        else:
            print("❌ QText 테이블 검증에 실패했습니다.")
            sys.exit(1)
    else:
        print("❌ QText 테이블 생성에 실패했습니다.")
        sys.exit(1) 