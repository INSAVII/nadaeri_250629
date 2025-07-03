#!/usr/bin/env python3
"""
프로그램 초기화 스크립트
데이터베이스에 기본 프로그램들을 추가합니다.
"""

from database import engine
from models.program import Program
from sqlalchemy.orm import sessionmaker
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_programs():
    """기본 프로그램들을 데이터베이스에 추가합니다."""
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # 기존 프로그램 확인
        existing_programs = session.query(Program).all()
        existing_program_ids = {p.id for p in existing_programs}
        
        logger.info(f"기존 프로그램 수: {len(existing_programs)}")
        logger.info(f"기존 프로그램 ID: {existing_program_ids}")
        
        # 추가할 기본 프로그램들
        default_programs = [
            {
                'id': 'free',
                'name': '큐캡쳐 무료',
                'description': '무료 버전의 큐캡쳐 프로그램',
                'type': 'qcapture',
                'license_type': 'free',
                'price': 0.0,
                'is_active': True,
                'is_public': True
            },
            {
                'id': 'month1',
                'name': '큐캡쳐 1개월',
                'description': '1개월 라이센스 큐캡쳐 프로그램',
                'type': 'qcapture',
                'license_type': 'month1',
                'price': 10000.0,
                'is_active': True,
                'is_public': True
            },
            {
                'id': 'month3',
                'name': '큐캡쳐 3개월',
                'description': '3개월 라이센스 큐캡쳐 프로그램',
                'type': 'qcapture',
                'license_type': 'month3',
                'price': 25000.0,
                'is_active': True,
                'is_public': True
            }
        ]
        
        added_count = 0
        for program_data in default_programs:
            if program_data['id'] not in existing_program_ids:
                program = Program(**program_data)
                session.add(program)
                added_count += 1
                logger.info(f"프로그램 추가: {program_data['id']} - {program_data['name']}")
            else:
                logger.info(f"프로그램 이미 존재: {program_data['id']} - {program_data['name']}")
        
        if added_count > 0:
            session.commit()
            logger.info(f"총 {added_count}개의 프로그램이 추가되었습니다.")
        else:
            logger.info("추가할 프로그램이 없습니다.")
        
        # 최종 프로그램 목록 출력
        final_programs = session.query(Program).all()
        logger.info("=== 최종 프로그램 목록 ===")
        for p in final_programs:
            logger.info(f"ID: {p.id}, Name: {p.name}, Type: {p.type}, License: {p.license_type}, Active: {p.is_active}")
        
    except Exception as e:
        logger.error(f"프로그램 초기화 중 오류 발생: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    init_programs()
