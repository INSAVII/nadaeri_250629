#!/usr/bin/env python3
"""
DB 파일 해시 비교 스크립트
FastAPI가 사용하는 DB 파일과 직접 확인하는 DB 파일이 같은지 확인
"""

import hashlib
import os
import sqlite3
from datetime import datetime

def sha1sum(filename):
    """파일의 SHA1 해시를 계산"""
    if not os.path.exists(filename):
        return None
    
    h = hashlib.sha1()
    with open(filename, 'rb') as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()

def get_file_info(filename):
    """파일 정보 반환"""
    if not os.path.exists(filename):
        return None
    
    stat = os.stat(filename)
    return {
        'size': stat.st_size,
        'modified': datetime.fromtimestamp(stat.st_mtime),
        'sha1': sha1sum(filename)
    }

def check_user_permissions(db_path, user_id):
    """DB에서 사용자 권한 확인"""
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
        print(f"DB 확인 중 오류: {e}")
        return None

def main():
    print("=" * 80)
    print("DB 파일 해시 비교 및 권한 확인")
    print("=" * 80)
    
    # FastAPI가 사용하는 DB 파일 경로 (services/main-api/qclick.db)
    fastapi_db_path = os.path.abspath("services/main-api/qclick.db")
    
    # 직접 확인하는 DB 파일 경로 (루트의 qclick.db)
    root_db_path = os.path.abspath("qclick.db")
    
    print(f"1. FastAPI DB 파일: {fastapi_db_path}")
    fastapi_info = get_file_info(fastapi_db_path)
    if fastapi_info:
        print(f"   - 크기: {fastapi_info['size']:,} bytes")
        print(f"   - 수정시간: {fastapi_info['modified']}")
        print(f"   - SHA1: {fastapi_info['sha1']}")
    else:
        print("   - 파일이 존재하지 않습니다!")
    
    print(f"\n2. 루트 DB 파일: {root_db_path}")
    root_info = get_file_info(root_db_path)
    if root_info:
        print(f"   - 크기: {root_info['size']:,} bytes")
        print(f"   - 수정시간: {root_info['modified']}")
        print(f"   - SHA1: {root_info['sha1']}")
    else:
        print("   - 파일이 존재하지 않습니다!")
    
    # 해시 비교
    print("\n3. 파일 비교 결과:")
    if fastapi_info and root_info:
        if fastapi_info['sha1'] == root_info['sha1']:
            print("   ✅ 두 DB 파일이 동일합니다!")
        else:
            print("   ❌ 두 DB 파일이 다릅니다!")
            print("   → FastAPI는 다른 DB 파일을 사용하고 있습니다.")
    elif fastapi_info and not root_info:
        print("   ⚠️  루트에 DB 파일이 없습니다. FastAPI만 사용 중입니다.")
    elif not fastapi_info and root_info:
        print("   ⚠️  FastAPI DB 파일이 없습니다. 루트만 사용 중입니다.")
    else:
        print("   ❌ 두 DB 파일 모두 존재하지 않습니다!")
    
    # testdbuser 권한 확인
    print("\n4. testdbuser 권한 확인:")
    test_user_id = "testdbuser"
    
    print(f"   FastAPI DB에서 {test_user_id} 권한:")
    fastapi_perms = check_user_permissions(fastapi_db_path, test_user_id)
    if fastapi_perms:
        print(f"   - {fastapi_perms}")
    else:
        print("   - 사용자를 찾을 수 없습니다.")
    
    if root_info:
        print(f"   루트 DB에서 {test_user_id} 권한:")
        root_perms = check_user_permissions(root_db_path, test_user_id)
        if root_perms:
            print(f"   - {root_perms}")
        else:
            print("   - 사용자를 찾을 수 없습니다.")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    main() 