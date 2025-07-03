#!/usr/bin/env python3
"""
DB 직접 접근으로 User 테이블 프로그램 권한 필드 진단
"""

import sqlite3
import os
import sys

# DB 파일 경로 (SQLite 사용 시)
DB_PATH = "services/main-api/qclick.db"

def check_db_exists():
    """DB 파일 존재 확인"""
    if os.path.exists(DB_PATH):
        print(f"✅ DB 파일 발견: {DB_PATH}")
        return True
    else:
        print(f"❌ DB 파일 없음: {DB_PATH}")
        return False

def check_user_table_structure():
    """User 테이블 구조 확인"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 테이블 구조 확인
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        
        print("\n📋 User 테이블 구조:")
        program_columns = []
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
            if 'program_permissions' in col[1]:
                program_columns.append(col[1])
        
        print(f"\n🔍 프로그램 권한 관련 컬럼: {program_columns}")
        
        conn.close()
        return program_columns
    except Exception as e:
        print(f"❌ 테이블 구조 확인 실패: {e}")
        return []

def check_user_data(user_id="testdbuser"):
    """특정 사용자의 데이터 확인"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 사용자 존재 확인
        cursor.execute("SELECT id, name, email FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ 사용자 {user_id}를 찾을 수 없습니다")
            conn.close()
            return
        
        print(f"\n👤 사용자 정보: {user}")
        
        # 프로그램 권한 필드 확인
        cursor.execute("""
            SELECT 
                program_permissions_free,
                program_permissions_month1,
                program_permissions_month3
            FROM users 
            WHERE id = ?
        """, (user_id,))
        
        permissions = cursor.fetchone()
        print(f"\n🔍 현재 프로그램 권한:")
        print(f"  - Free: {permissions[0]}")
        print(f"  - Month1: {permissions[1]}")
        print(f"  - Month3: {permissions[2]}")
        
        conn.close()
        return permissions
    except Exception as e:
        print(f"❌ 사용자 데이터 확인 실패: {e}")
        return None

def update_user_permissions_direct(user_id="testdbuser"):
    """DB에 직접 권한 업데이트"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 권한 업데이트
        cursor.execute("""
            UPDATE users 
            SET 
                program_permissions_free = ?,
                program_permissions_month1 = ?,
                program_permissions_month3 = ?
            WHERE id = ?
        """, (True, True, False, user_id))
        
        conn.commit()
        
        # 업데이트 후 확인
        cursor.execute("""
            SELECT 
                program_permissions_free,
                program_permissions_month1,
                program_permissions_month3
            FROM users 
            WHERE id = ?
        """, (user_id,))
        
        permissions = cursor.fetchone()
        print(f"\n✅ 직접 업데이트 후 권한:")
        print(f"  - Free: {permissions[0]}")
        print(f"  - Month1: {permissions[1]}")
        print(f"  - Month3: {permissions[2]}")
        
        conn.close()
        return permissions
    except Exception as e:
        print(f"❌ 직접 업데이트 실패: {e}")
        return None

def main():
    print("🔍 DB 직접 진단 시작")
    
    # 1. DB 파일 확인
    if not check_db_exists():
        return
    
    # 2. 테이블 구조 확인
    program_columns = check_user_table_structure()
    
    if not program_columns:
        print("❌ 프로그램 권한 컬럼이 없습니다!")
        return
    
    # 3. 현재 사용자 데이터 확인
    current_permissions = check_user_data()
    
    # 4. 직접 업데이트 테스트
    print("\n🔄 직접 DB 업데이트 테스트...")
    updated_permissions = update_user_permissions_direct()
    
    if updated_permissions:
        print("\n✅ 직접 DB 업데이트 성공!")
        print("이제 API를 통해 다시 테스트해보세요.")

if __name__ == "__main__":
    main() 