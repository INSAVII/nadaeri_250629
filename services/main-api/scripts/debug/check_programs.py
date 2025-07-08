#!/usr/bin/env python3
"""
현재 데이터베이스에 저장된 프로그램들을 확인하는 스크립트
"""

import os
import sys

# 프로젝트 루트를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from models.program import Program

def check_programs():
    """데이터베이스에 저장된 프로그램들 확인"""
    
    db = next(get_db())
    
    try:
        print("🔍 데이터베이스에 저장된 프로그램들 확인 중...")
        
        # 모든 프로그램 조회
        all_programs = db.query(Program).all()
        
        if not all_programs:
            print("❌ 데이터베이스에 저장된 프로그램이 없습니다.")
            return
        
        print(f"✅ 총 {len(all_programs)}개의 프로그램이 저장되어 있습니다:")
        print("-" * 80)
        
        for program in all_programs:
            print(f"ID: {program.id}")
            print(f"이름: {program.name}")
            print(f"타입: {program.type}")
            print(f"라이센스 타입: {getattr(program, 'license_type', 'N/A')}")
            print(f"가격: {getattr(program, 'price', 'N/A')}")
            print(f"다운로드 횟수: {getattr(program, 'download_count', 'N/A')}")
            print("-" * 80)
        
        # qcapture 관련 프로그램만 필터링
        qcapture_programs = db.query(Program).filter(Program.type == 'qcapture').all()
        
        if qcapture_programs:
            print(f"🎯 큐캡쳐 관련 프로그램 ({len(qcapture_programs)}개):")
            for program in qcapture_programs:
                print(f"  - {program.id}: {program.name}")
        else:
            print("❌ 큐캡쳐 관련 프로그램이 없습니다.")
            
    except Exception as e:
        print(f"❌ 프로그램 확인 중 오류: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    check_programs() 