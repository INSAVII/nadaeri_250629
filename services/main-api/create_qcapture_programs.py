#!/usr/bin/env python3
"""
큐캡쳐 프로그램들을 데이터베이스에 생성하는 스크립트
실제 배포를 위해 프로그램 정보를 데이터베이스에 저장합니다.
"""

import os
import sys
import uuid
from datetime import datetime

# 프로젝트 루트를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db, engine
from models.program import Program, Base

def create_qcapture_programs():
    """큐캡쳐 프로그램들을 데이터베이스에 생성"""
    
    # 데이터베이스 테이블 생성
    Base.metadata.create_all(bind=engine)
    
    db = next(get_db())
    
    try:
        print("🔄 큐캡쳐 프로그램 생성 시작...")
        
        # 큐캡쳐 프로그램들 정의
        qcapture_programs = [
            {
                'id': 'qcapture_free',
                'name': '큐캡쳐 (무료)',
                'description': '큐캡쳐 무료 버전',
                'type': 'qcapture',
                'license_type': 'free',
                'price': 0,
                'download_count': 0
            },
            {
                'id': 'qcapture_month1',
                'name': '큐캡쳐 (1개월)',
                'description': '큐캡쳐 1개월 라이센스',
                'type': 'qcapture',
                'license_type': 'month1',
                'price': 5000,
                'download_count': 0
            },
            {
                'id': 'qcapture_month3',
                'name': '큐캡쳐 (3개월)',
                'description': '큐캡쳐 3개월 라이센스',
                'type': 'qcapture',
                'license_type': 'month3',
                'price': 12000,
                'download_count': 0
            }
        ]
        
        # 각 프로그램 생성 또는 업데이트
        for program_data in qcapture_programs:
            existing_program = db.query(Program).filter(Program.id == program_data['id']).first()
            
            if existing_program:
                print(f"✅ 기존 프로그램 업데이트: {program_data['name']}")
                # 기존 프로그램 정보 업데이트
                existing_program.name = program_data['name']
                existing_program.description = program_data['description']
                existing_program.type = program_data['type']
                existing_program.license_type = program_data['license_type']
                existing_program.price = program_data['price']
            else:
                print(f"🆕 새 프로그램 생성: {program_data['name']}")
                # 새 프로그램 생성
                new_program = Program(
                    id=program_data['id'],
                    name=program_data['name'],
                    description=program_data['description'],
                    type=program_data['type'],
                    license_type=program_data['license_type'],
                    price=program_data['price'],
                    download_count=program_data['download_count'],
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.add(new_program)
        
        db.commit()
        print("✅ 큐캡쳐 프로그램 생성 완료!")
        
        # 생성된 프로그램들 확인
        programs = db.query(Program).filter(Program.type == 'qcapture').all()
        print(f"📋 데이터베이스에 저장된 큐캡쳐 프로그램들:")
        for program in programs:
            print(f"  - {program.id}: {program.name} (가격: {program.price:,}원)")
        
    except Exception as e:
        db.rollback()
        print(f"❌ 큐캡쳐 프로그램 생성 중 오류: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_qcapture_programs() 