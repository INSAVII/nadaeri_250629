#!/usr/bin/env python3
"""
프로그램 파일 상태 확인 스크립트
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import Base, engine
from models.program import ProgramFile, Program

def check_program_files():
    """프로그램 파일들의 상태를 확인합니다."""
    
    # 데이터베이스 세션 생성
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("=== 프로그램 파일 상태 확인 ===")
        
        # ProgramFile 테이블 조회
        program_files = db.query(ProgramFile).all()
        
        print(f"총 프로그램 파일 수: {len(program_files)}")
        print()
        
        for file in program_files:
            print(f"파일: {file.name}")
            print(f"  - ID: {file.id}")
            print(f"  - 파일명: {file.filename}")
            print(f"  - 라이센스 타입: {file.license_type}")
            print(f"  - 활성화 상태: {file.is_active}")
            print(f"  - 파일 크기: {file.file_size} bytes")
            print(f"  - 업로드 날짜: {file.upload_date}")
            print(f"  - 파일 경로: {file.file_path}")
            print(f"  - 파일 존재 여부: {os.path.exists(file.file_path) if file.file_path else 'N/A'}")
            print()
        
        # Program 테이블 조회
        programs = db.query(Program).all()
        
        print("=== 프로그램 테이블 상태 ===")
        print(f"총 프로그램 수: {len(programs)}")
        print()
        
        for program in programs:
            print(f"프로그램: {program.name}")
            print(f"  - ID: {program.id}")
            print(f"  - 타입: {program.type}")
            print(f"  - 라이센스 타입: {program.license_type}")
            print(f"  - 활성화 상태: {program.is_active}")
            print(f"  - 공개 상태: {program.is_public}")
            print()
        
        # 활성화된 파일만 조회
        active_files = db.query(ProgramFile).filter(ProgramFile.is_active == True).all()
        
        print("=== 활성화된 프로그램 파일 ===")
        print(f"활성화된 파일 수: {len(active_files)}")
        print()
        
        for file in active_files:
            print(f"✅ {file.name} ({file.license_type}) - {file.filename}")
        
    except Exception as e:
        print(f"오류 발생: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_program_files() 