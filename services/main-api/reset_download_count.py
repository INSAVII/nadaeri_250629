#!/usr/bin/env python3
"""
다운로드 횟수를 초기화하는 스크립트
"""

import os
import sys

# 프로젝트 루트를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from models.program import UserProgram

def reset_download_count():
    """모든 사용자의 다운로드 횟수를 초기화"""
    
    db = next(get_db())
    
    try:
        print("🔄 다운로드 횟수 초기화 시작...")
        
        # 모든 UserProgram 레코드 조회
        user_programs = db.query(UserProgram).all()
        
        if not user_programs:
            print("❌ 초기화할 다운로드 기록이 없습니다.")
            return
        
        print(f"📋 총 {len(user_programs)}개의 다운로드 기록을 초기화합니다.")
        
        # 다운로드 횟수를 0으로 초기화
        for user_program in user_programs:
            old_count = user_program.download_count
            user_program.download_count = 0
            print(f"  - 사용자 {user_program.user_id}, 프로그램 {user_program.program_id}: {old_count} → 0")
        
        db.commit()
        print("✅ 다운로드 횟수 초기화 완료!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ 다운로드 횟수 초기화 중 오류: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_download_count() 