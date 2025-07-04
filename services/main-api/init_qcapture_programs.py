#!/usr/bin/env python3
"""
큐캡쳐 프로그램들을 데이터베이스에 초기화하는 스크립트
실제 배포를 위해 프로그램 정보를 데이터베이스에 저장합니다.
"""

import os
import sys
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

# 프로젝트 루트를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db, engine
from models.program import Program, ProgramFile, Base

def init_qcapture_programs():
    """큐캡쳐 프로그램들을 데이터베이스에 초기화"""
    
    # 데이터베이스 테이블 생성
    Base.metadata.create_all(bind=engine)
    
    db = next(get_db())
    
    try:
        print("🔄 큐캡쳐 프로그램 초기화 시작...")
        
        # 기존 프로그램들 삭제 (재초기화)
        existing_programs = db.query(Program).filter(Program.type == "qcapture").all()
        for program in existing_programs:
            db.delete(program)
        
        existing_files = db.query(ProgramFile).filter(ProgramFile.name.like("%큐캡쳐%")).all()
        for file in existing_files:
            db.delete(file)
        
        print(f"🧹 기존 프로그램 {len(existing_programs)}개, 파일 {len(existing_files)}개 삭제됨")
        
        # 1. 무료 프로그램
        free_program = Program(
            id="qcapture_free",
            name="큐캡쳐 무료",
            description="큐캡쳐 무료 버전 - 기본 기능 제공",
            type="qcapture",
            license_type="free",
            price=0.0,
            is_active=True,
            is_public=True,
            created_at=datetime.utcnow(),
            created_by="admin"
        )
        db.add(free_program)
        
        # 2. 1개월 프로그램
        month1_program = Program(
            id="qcapture_month1",
            name="큐캡쳐 1개월",
            description="큐캡쳐 1개월 버전 - 고급 기능 포함",
            type="qcapture",
            license_type="month1",
            price=5000.0,
            is_active=True,
            is_public=True,
            created_at=datetime.utcnow(),
            created_by="admin"
        )
        db.add(month1_program)
        
        # 3. 3개월 프로그램
        month3_program = Program(
            id="qcapture_month3",
            name="큐캡쳐 3개월",
            description="큐캡쳐 3개월 버전 - 모든 기능 포함",
            type="qcapture",
            license_type="month3",
            price=12000.0,
            is_active=True,
            is_public=True,
            created_at=datetime.utcnow(),
            created_by="admin"
        )
        db.add(month3_program)
        
        # 프로그램 파일 정보도 추가 (실제 파일이 업로드되면 업데이트됨)
        uploads_dir = "uploads/programs"
        os.makedirs(uploads_dir, exist_ok=True)
        
        # 무료 프로그램 파일 정보
        free_file = ProgramFile(
            id=str(uuid.uuid4()),
            name="큐캡쳐 무료",
            filename="qcapture_free_v1.0.exe",
            file_path=os.path.join(uploads_dir, "qcapture_free_v1.0.exe"),
            file_size=0,  # 실제 파일이 업로드되면 업데이트
            license_type="free",
            is_active=True,
            content_type="application/octet-stream"
        )
        db.add(free_file)
        
        # 1개월 프로그램 파일 정보
        month1_file = ProgramFile(
            id=str(uuid.uuid4()),
            name="큐캡쳐 1개월",
            filename="qcapture_1month_v2.1.exe",
            file_path=os.path.join(uploads_dir, "qcapture_1month_v2.1.exe"),
            file_size=0,  # 실제 파일이 업로드되면 업데이트
            license_type="month1",
            is_active=True,
            content_type="application/octet-stream"
        )
        db.add(month1_file)
        
        # 3개월 프로그램 파일 정보
        month3_file = ProgramFile(
            id=str(uuid.uuid4()),
            name="큐캡쳐 3개월",
            filename="qcapture_3month_v3.0.exe",
            file_path=os.path.join(uploads_dir, "qcapture_3month_v3.0.exe"),
            file_size=0,  # 실제 파일이 업로드되면 업데이트
            license_type="month3",
            is_active=True,
            content_type="application/octet-stream"
        )
        db.add(month3_file)
        
        db.commit()
        
        print("✅ 큐캡쳐 프로그램 초기화 완료!")
        print(f"📦 생성된 프로그램:")
        print(f"   - 무료: {free_program.name} (ID: {free_program.id})")
        print(f"   - 1개월: {month1_program.name} (ID: {month1_program.id})")
        print(f"   - 3개월: {month3_program.name} (ID: {month3_program.id})")
        print(f"📁 업로드 디렉토리: {uploads_dir}")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ 큐캡쳐 프로그램 초기화 실패: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = init_qcapture_programs()
    if success:
        print("\n🎉 큐캡쳐 프로그램 초기화가 성공적으로 완료되었습니다!")
        print("💡 다음 단계:")
        print("   1. 관리자 페이지에서 실제 프로그램 파일을 업로드하세요")
        print("   2. 사용자에게 프로그램 권한을 부여하세요")
        print("   3. 다운로드 기능을 테스트하세요")
    else:
        print("\n❌ 큐캡쳐 프로그램 초기화에 실패했습니다.")
        sys.exit(1) 