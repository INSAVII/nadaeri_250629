import sqlite3
import os

db_path = 'services/main-api/qclick.db'
print(f"Checking database: {db_path}")
print(f"File exists: {os.path.exists(db_path)}")

if os.path.exists(db_path):
    print(f"File size: {os.path.getsize(db_path)} bytes")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 테이블 목록
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables: {[t[0] for t in tables]}")
        
        # users 테이블 확인
        if ('users',) in tables:
            cursor.execute("SELECT COUNT(*) FROM users;")
            count = cursor.fetchone()[0]
            print(f"Users count: {count}")
            
            if count > 0:
                cursor.execute("SELECT id, email, role FROM users LIMIT 3;")
                users = cursor.fetchall()
                print("Sample users:")
                for user in users:
                    print(f"  {user}")
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
else:
    print("Database file not found") 