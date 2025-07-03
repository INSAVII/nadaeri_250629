#!/usr/bin/env python3
"""
실시간 DB 상태 모니터링 스크립트
API 호출 전후로 DB 상태를 확인하여 실제로 값이 바뀌는지 모니터링
"""

import sqlite3
import os
import time
from datetime import datetime

def get_user_permissions(db_path, user_id):
    """DB에서 사용자 권한 조회"""
    if not os.path.exists(db_path):
        return None
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT program_permissions_free, program_permissions_month1, program_permissions_month3
            FROM users WHERE id = ?
        """, (user_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                'free': bool(result[0]),
                'month1': bool(result[1]),
                'month3': bool(result[2])
            }
        return None
    except Exception as e:
        print(f"DB 조회 중 오류: {e}")
        return None

def monitor_user_permissions(user_id, db_path=None, interval=2):
    """
    사용자 권한을 실시간으로 모니터링
    
    Args:
        user_id: 모니터링할 사용자 ID
        db_path: DB 파일 경로 (None이면 FastAPI DB 사용)
        interval: 체크 간격 (초)
    """
    if db_path is None:
        db_path = os.path.abspath("services/main-api/qclick.db")
    
    print(f"🔍 {user_id} 권한 모니터링 시작")
    print(f"📁 DB 파일: {db_path}")
    print(f"⏱️  체크 간격: {interval}초")
    print("=" * 60)
    
    last_permissions = None
    check_count = 0
    
    try:
        while True:
            check_count += 1
            current_time = datetime.now().strftime("%H:%M:%S")
            
            permissions = get_user_permissions(db_path, user_id)
            
            if permissions is None:
                print(f"[{current_time}] ❌ 사용자를 찾을 수 없습니다: {user_id}")
            else:
                if last_permissions != permissions:
                    print(f"[{current_time}] 🔄 권한 변경 감지!")
                    print(f"   이전: {last_permissions}")
                    print(f"   현재: {permissions}")
                    print("-" * 40)
                    last_permissions = permissions
                else:
                    print(f"[{current_time}] ✅ 권한 동일: {permissions}")
            
            time.sleep(interval)
            
    except KeyboardInterrupt:
        print(f"\n🛑 모니터링 종료 (총 {check_count}회 체크)")

def main():
    print("실시간 DB 상태 모니터링")
    print("=" * 40)
    
    # FastAPI DB 경로
    fastapi_db = os.path.abspath("services/main-api/qclick.db")
    
    print("1. 현재 DB 상태 확인")
    print(f"   FastAPI DB: {fastapi_db}")
    print(f"   존재 여부: {os.path.exists(fastapi_db)}")
    
    if os.path.exists(fastapi_db):
        print("   ✅ DB 파일이 존재합니다.")
        
        # testdbuser 현재 상태 확인
        current_perms = get_user_permissions(fastapi_db, "testdbuser")
        if current_perms:
            print(f"   testdbuser 현재 권한: {current_perms}")
        else:
            print("   testdbuser를 찾을 수 없습니다.")
    else:
        print("   ❌ DB 파일이 존재하지 않습니다!")
        return
    
    print("\n2. 모니터링 시작")
    print("   - API 호출 후 권한이 바뀌는지 실시간으로 확인됩니다.")
    print("   - Ctrl+C로 종료할 수 있습니다.")
    print("   - 권한이 변경되면 즉시 알려줍니다.")
    print("\n" + "=" * 60)
    
    # 모니터링 시작
    monitor_user_permissions("testdbuser", fastapi_db, interval=2)

if __name__ == "__main__":
    main() 