#!/usr/bin/env python3
"""
데이터베이스 마이그레이션 스크립트
기존 데이터를 보존하면서 스키마를 업데이트합니다.
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import logging
from datetime import datetime

# 프로젝트 루트를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Base, engine
from models import User, Transaction, Program, UserProgram, ServiceUsage, Board

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_database_connection():
    """데이터베이스 연결 확인"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✅ 데이터베이스 연결 성공")
            return True
    except Exception as e:
        logger.error(f"❌ 데이터베이스 연결 실패: {e}")
        return False

def backup_existing_data():
    """기존 데이터 백업"""
    try:
        with engine.connect() as conn:
            # 백업 테이블 생성
            backup_tables = [
                "users_backup",
                "transactions_backup", 
                "programs_backup",
                "user_programs_backup",
                "service_usages_backup",
                "boards_backup"
            ]
            
            for table in backup_tables:
                try:
                    conn.execute(text(f"DROP TABLE IF EXISTS {table}"))
                    conn.execute(text(f"CREATE TABLE {table} AS SELECT * FROM {table.replace('_backup', '')}"))
                    logger.info(f"✅ {table} 백업 완료")
                except Exception as e:
                    logger.warning(f"⚠️ {table} 백업 실패 (테이블이 없을 수 있음): {e}")
            
            conn.commit()
            logger.info("✅ 모든 테이블 백업 완료")
            return True
    except Exception as e:
        logger.error(f"❌ 백업 중 오류: {e}")
        return False

def create_tables():
    """새로운 스키마로 테이블 생성"""
    try:
        logger.info("🔄 새로운 스키마로 테이블 생성 중...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ 테이블 생성 완료")
        return True
    except Exception as e:
        logger.error(f"❌ 테이블 생성 실패: {e}")
        return False

def migrate_user_data():
    """사용자 데이터 마이그레이션"""
    try:
        with engine.connect() as conn:
            # 기존 users 테이블이 있는지 확인
            inspector = inspect(engine)
            if 'users_backup' not in inspector.get_table_names():
                logger.info("⚠️ users_backup 테이블이 없어 마이그레이션을 건너뜁니다")
                return True
            
            # 백업된 사용자 데이터를 새 스키마로 복사
            result = conn.execute(text("""
                INSERT INTO users (
                    id, email, hashed_password, name, balance, is_active, role,
                    created_at, updated_at, phone, region, age, gender, work_type,
                    has_business, business_number
                )
                SELECT 
                    id, email, hashed_password, name, balance, is_active, role,
                    created_at, updated_at, phone, region, age, gender, work_type,
                    has_business, business_number
                FROM users_backup
                ON CONFLICT (id) DO NOTHING
            """))
            
            conn.commit()
            logger.info(f"✅ 사용자 데이터 마이그레이션 완료: {result.rowcount}개 행")
            return True
    except Exception as e:
        logger.error(f"❌ 사용자 데이터 마이그레이션 실패: {e}")
        return False

def migrate_transaction_data():
    """거래 데이터 마이그레이션"""
    try:
        with engine.connect() as conn:
            inspector = inspect(engine)
            if 'transactions_backup' not in inspector.get_table_names():
                logger.info("⚠️ transactions_backup 테이블이 없어 마이그레이션을 건너뜁니다")
                return True
            
            # 백업된 거래 데이터를 새 스키마로 복사
            result = conn.execute(text("""
                INSERT INTO transactions (
                    id, user_id, amount, balance_after, transaction_type,
                    reference_id, description, created_at
                )
                SELECT 
                    id, user_id, amount, balance_after, transaction_type,
                    reference_id, description, created_at
                FROM transactions_backup
                ON CONFLICT (id) DO NOTHING
            """))
            
            conn.commit()
            logger.info(f"✅ 거래 데이터 마이그레이션 완료: {result.rowcount}개 행")
            return True
    except Exception as e:
        logger.error(f"❌ 거래 데이터 마이그레이션 실패: {e}")
        return False

def migrate_program_data():
    """프로그램 데이터 마이그레이션"""
    try:
        with engine.connect() as conn:
            inspector = inspect(engine)
            if 'programs_backup' not in inspector.get_table_names():
                logger.info("⚠️ programs_backup 테이블이 없어 마이그레이션을 건너뜁니다")
                return True
            
            # 백업된 프로그램 데이터를 새 스키마로 복사
            result = conn.execute(text("""
                INSERT INTO programs (
                    id, name, description, file_path, file_size, version, type,
                    license_type, price, download_count, icon_url, is_active,
                    is_public, created_at, updated_at, created_by
                )
                SELECT 
                    id, name, description, file_path, file_size, version, type,
                    license_type, price, download_count, icon_url, is_active,
                    is_public, created_at, updated_at, created_by
                FROM programs_backup
                ON CONFLICT (id) DO NOTHING
            """))
            
            conn.commit()
            logger.info(f"✅ 프로그램 데이터 마이그레이션 완료: {result.rowcount}개 행")
            return True
    except Exception as e:
        logger.error(f"❌ 프로그램 데이터 마이그레이션 실패: {e}")
        return False

def migrate_user_program_data():
    """사용자 프로그램 권한 데이터 마이그레이션"""
    try:
        with engine.connect() as conn:
            inspector = inspect(engine)
            if 'user_programs_backup' not in inspector.get_table_names():
                logger.info("⚠️ user_programs_backup 테이블이 없어 마이그레이션을 건너뜁니다")
                return True
            
            # 백업된 사용자 프로그램 데이터를 새 스키마로 복사
            result = conn.execute(text("""
                INSERT INTO user_programs (
                    id, user_id, program_id, is_allowed, download_count,
                    last_downloaded, created_at, expires_at
                )
                SELECT 
                    id, user_id, program_id, is_allowed, download_count,
                    last_downloaded, created_at, expires_at
                FROM user_programs_backup
                ON CONFLICT (id) DO NOTHING
            """))
            
            conn.commit()
            logger.info(f"✅ 사용자 프로그램 데이터 마이그레이션 완료: {result.rowcount}개 행")
            return True
    except Exception as e:
        logger.error(f"❌ 사용자 프로그램 데이터 마이그레이션 실패: {e}")
        return False

def create_initial_data():
    """초기 데이터 생성"""
    try:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # 기본 관리자 계정 생성 (없는 경우)
        admin_user = db.query(User).filter(User.id == "admin").first()
        if not admin_user:
            from models.user import User
            admin_user = User(
                id="admin",
                email="admin@qclick.com",
                hashed_password=User.get_password_hash("admin123!"),
                name="시스템 관리자",
                balance=1000000,
                is_active=True,
                role="admin"
            )
            db.add(admin_user)
            logger.info("✅ 기본 관리자 계정 생성")
        
        # 기본 프로그램 생성 (없는 경우)
        programs_data = [
            {
                "id": "qname",
                "name": "QName - 상품명 생성기",
                "description": "AI 기반 상품명 생성 서비스",
                "type": "qname",
                "license_type": "free",
                "price": 0.0,
                "is_public": True
            },
            {
                "id": "qtext", 
                "name": "QText - 텍스트 생성기",
                "description": "AI 기반 텍스트 생성 서비스",
                "type": "qtext",
                "license_type": "free",
                "price": 0.0,
                "is_public": True
            },
            {
                "id": "qcapture",
                "name": "QCapture - 화면 캡처",
                "description": "화면 캡처 및 편집 서비스",
                "type": "qcapture",
                "license_type": "month1",
                "price": 50000.0,
                "is_public": True
            }
        ]
        
        for prog_data in programs_data:
            existing_program = db.query(Program).filter(Program.id == prog_data["id"]).first()
            if not existing_program:
                program = Program(**prog_data)
                db.add(program)
                logger.info(f"✅ 기본 프로그램 생성: {prog_data['name']}")
        
        db.commit()
        logger.info("✅ 초기 데이터 생성 완료")
        return True
    except Exception as e:
        logger.error(f"❌ 초기 데이터 생성 실패: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def cleanup_backup_tables():
    """백업 테이블 정리 (선택사항)"""
    try:
        with engine.connect() as conn:
            backup_tables = [
                "users_backup",
                "transactions_backup",
                "programs_backup", 
                "user_programs_backup",
                "service_usages_backup",
                "boards_backup"
            ]
            
            for table in backup_tables:
                try:
                    conn.execute(text(f"DROP TABLE IF EXISTS {table}"))
                    logger.info(f"✅ {table} 정리 완료")
                except Exception as e:
                    logger.warning(f"⚠️ {table} 정리 실패: {e}")
            
            conn.commit()
            logger.info("✅ 백업 테이블 정리 완료")
            return True
    except Exception as e:
        logger.error(f"❌ 백업 테이블 정리 실패: {e}")
        return False

def migrate_program_permissions():
    """User 테이블에 프로그램 권한 필드를 추가하고 기존 UserProgram 데이터를 마이그레이션"""
    
    db = sessionmaker(autocommit=False, autoflush=False, bind=engine)()
    
    try:
        logger.info("=== 프로그램 권한 마이그레이션 시작 ===")
        
        # 1. User 테이블에 프로그램 권한 필드 추가
        logger.info("1. User 테이블에 프로그램 권한 필드 추가 중...")
        
        try:
            # ALTER TABLE 명령 실행
            with engine.connect() as conn:
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN program_permissions_free BOOLEAN DEFAULT FALSE
                """))
                conn.commit()
            logger.info("   - program_permissions_free 필드 추가 완료")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                logger.info("   - program_permissions_free 필드가 이미 존재함")
            else:
                logger.error(f"   - program_permissions_free 필드 추가 실패: {e}")
        
        try:
            with engine.connect() as conn:
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN program_permissions_month1 BOOLEAN DEFAULT FALSE
                """))
                conn.commit()
            logger.info("   - program_permissions_month1 필드 추가 완료")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                logger.info("   - program_permissions_month1 필드가 이미 존재함")
            else:
                logger.error(f"   - program_permissions_month1 필드 추가 실패: {e}")
        
        try:
            with engine.connect() as conn:
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN program_permissions_month3 BOOLEAN DEFAULT FALSE
                """))
                conn.commit()
            logger.info("   - program_permissions_month3 필드 추가 완료")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                logger.info("   - program_permissions_month3 필드가 이미 존재함")
            else:
                logger.error(f"   - program_permissions_month3 필드 추가 실패: {e}")
        
        # 2. 기존 UserProgram 데이터를 User 테이블로 마이그레이션
        logger.info("2. 기존 UserProgram 데이터 마이그레이션 중...")
        
        # 모든 사용자 조회
        users = db.query(User).all()
        logger.info(f"   - 총 {len(users)}명의 사용자 발견")
        
        migrated_count = 0
        
        for user in users:
            # 해당 사용자의 UserProgram 데이터 조회
            user_programs = db.query(UserProgram).filter(UserProgram.user_id == user.id).all()
            
            if user_programs:
                logger.info(f"   - 사용자 {user.email}의 프로그램 권한 마이그레이션 중...")
                
                # 각 프로그램 권한을 User 테이블에 설정
                for user_program in user_programs:
                    if user_program.program_id == 'free':
                        user.program_permissions_free = user_program.is_allowed
                    elif user_program.program_id == 'month1':
                        user.program_permissions_month1 = user_program.is_allowed
                    elif user_program.program_id == 'month3':
                        user.program_permissions_month3 = user_program.is_allowed
                
                migrated_count += 1
                logger.info(f"     - {len(user_programs)}개 프로그램 권한 마이그레이션 완료")
        
        # 변경사항 저장
        db.commit()
        logger.info(f"3. 마이그레이션 완료: {migrated_count}명의 사용자 권한 업데이트됨")
        
        # 4. 마이그레이션 결과 확인
        logger.info("4. 마이그레이션 결과 확인 중...")
        
        for user in users[:5]:  # 처음 5명만 확인
            logger.info(f"   - {user.email}: free={user.program_permissions_free}, month1={user.program_permissions_month1}, month3={user.program_permissions_month3}")
        
        logger.info("=== 프로그램 권한 마이그레이션 완료 ===")
        
    except Exception as e:
        logger.error(f"마이그레이션 중 오류 발생: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def run_migration():
    """전체 마이그레이션 실행"""
    logger.info("🚀 데이터베이스 마이그레이션 시작")
    
    # 1. 데이터베이스 연결 확인
    if not check_database_connection():
        return False
    
    # 2. 기존 데이터 백업
    if not backup_existing_data():
        logger.warning("⚠️ 백업 실패했지만 계속 진행합니다")
    
    # 3. 새로운 스키마로 테이블 생성
    if not create_tables():
        return False
    
    # 4. 데이터 마이그레이션
    migration_steps = [
        ("사용자 데이터", migrate_user_data),
        ("거래 데이터", migrate_transaction_data),
        ("프로그램 데이터", migrate_program_data),
        ("사용자 프로그램 데이터", migrate_user_program_data),
    ]
    
    for step_name, step_func in migration_steps:
        logger.info(f"🔄 {step_name} 마이그레이션 중...")
        if not step_func():
            logger.warning(f"⚠️ {step_name} 마이그레이션 실패했지만 계속 진행합니다")
    
    # 5. 초기 데이터 생성
    if not create_initial_data():
        logger.warning("⚠️ 초기 데이터 생성 실패했지만 계속 진행합니다")
    
    # 6. 백업 테이블 정리 (선택사항)
    cleanup_backup_tables()
    
    # 7. 프로그램 권한 마이그레이션
    migrate_program_permissions()
    
    logger.info("🎉 데이터베이스 마이그레이션 완료!")
    return True

if __name__ == "__main__":
    success = run_migration()
    if success:
        print("\n✅ 마이그레이션이 성공적으로 완료되었습니다!")
        print("기본 관리자 계정: admin / admin123!")
    else:
        print("\n❌ 마이그레이션 중 오류가 발생했습니다.")
        sys.exit(1) 