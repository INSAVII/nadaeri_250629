#!/usr/bin/env python3
import sys
import os
import sqlite3

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), 'services', 'main-api'))

def check_database_status():
    try:
        # SQLite 데이터베이스 파일 확인 (실제 데이터가 있는 파일)
        db_path = os.path.join('services', 'main-api', 'qclick.db')
        print(f"Database path: {db_path}")
        print(f"Database exists: {os.path.exists(db_path)}")
        
        if os.path.exists(db_path):
            print(f"Database size: {os.path.getsize(db_path)} bytes")
            
            # SQLite로 직접 연결하여 테이블 확인
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # 테이블 목록 조회
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            print(f"\nTables in database: {len(tables)}")
            for table in tables:
                print(f"  - {table[0]}")
            
            # users 테이블이 있는지 확인
            if ('users',) in tables:
                print("\nUsers table exists!")
                
                # users 테이블 구조 확인
                cursor.execute("PRAGMA table_info(users);")
                columns = cursor.fetchall()
                print(f"Users table columns: {len(columns)}")
                for col in columns:
                    print(f"  - {col[1]} ({col[2]})")
                
                # users 테이블 데이터 확인
                cursor.execute("SELECT COUNT(*) FROM users;")
                user_count = cursor.fetchone()[0]
                print(f"Users count: {user_count}")
                
                if user_count > 0:
                    # admin 사용자 확인
                    cursor.execute("SELECT id, email, role, is_active FROM users WHERE role = 'admin';")
                    admin_users = cursor.fetchall()
                    print(f"Admin users: {len(admin_users)}")
                    for admin in admin_users:
                        print(f"  - ID: {admin[0]}, Email: {admin[1]}, Role: {admin[2]}, Active: {admin[3]}")
                    
                    # 모든 사용자 확인 (처음 5개)
                    cursor.execute("SELECT id, email, role, is_active FROM users LIMIT 5;")
                    all_users = cursor.fetchall()
                    print(f"First 5 users:")
                    for user in all_users:
                        print(f"  - ID: {user[0]}, Email: {user[1]}, Role: {user[2]}, Active: {user[3]}")
                else:
                    print("No users found in database")
            else:
                print("\nUsers table does not exist!")
            
            conn.close()
        else:
            print("Database file does not exist!")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_database_status() 