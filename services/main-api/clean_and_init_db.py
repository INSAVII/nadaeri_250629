#!/usr/bin/env python3
"""
데이터베이스를 완전히 정리하고 다시 초기화하는 스크립트
"""

import os
import sys
import sqlite3
from sqlalchemy import text

# 프로젝트 루트를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base
from init_qcapture_programs import init_qcapture_programs

def clean_database():
    """데이터베이스를 완전히 정리"""
    
    print("🧹 데이터베이스 정리 시작...")
    
    # SQLite 데이터베이스 파일 경로
    db_path = "qclick.db"
    
    # 기존 데이터베이스 파일 삭제
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"🗑️ 기존 데이터베이스 파일 삭제: {db_path}")
    
    # 새로운 데이터베이스 생성
    with engine.connect() as conn:
        # 모든 테이블 삭제 (존재하는 경우)
        conn.execute(text("DROP TABLE IF EXISTS user_programs"))
        conn.execute(text("DROP TABLE IF EXISTS program_files"))
        conn.execute(text("DROP TABLE IF EXISTS programs"))
        conn.execute(text("DROP TABLE IF EXISTS transactions"))
        conn.execute(text("DROP TABLE IF EXISTS users"))
        conn.commit()
        print("🗑️ 기존 테이블 삭제 완료")
    
    # 테이블 재생성
    Base.metadata.create_all(bind=engine)
    print("✅ 새로운 테이블 생성 완료")
    
    return True

def main():
    """메인 실행 함수"""
    try:
        # 1. 데이터베이스 정리
        if not clean_database():
            print("❌ 데이터베이스 정리 실패")
            return False
        
        # 2. 큐캡쳐 프로그램 초기화
        if not init_qcapture_programs():
            print("❌ 큐캡쳐 프로그램 초기화 실패")
            return False
        
        print("\n🎉 데이터베이스 초기화가 성공적으로 완료되었습니다!")
        return True
        
    except Exception as e:
        print(f"❌ 데이터베이스 초기화 중 오류 발생: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1) 