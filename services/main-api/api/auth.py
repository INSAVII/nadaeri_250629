from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, validator
import os
import logging
from dotenv import load_dotenv
import re
from passlib.context import CryptContext
import uuid
from sqlalchemy import or_

from database import get_db
from models.user import User

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 환경변수 로드 (안전하게)
try:
    load_dotenv()
except Exception as e:
    print(f"환경변수 로드 실패 (기본값 사용): {e}")

# 시크릿 키 및 토큰 설정
SECRET_KEY = os.getenv("JWT_SECRET", "qclick_secret_key_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7일

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# 표준 응답 모델
class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

# 요청/응답 모델
class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    email: Optional[str] = None
    
class UserCreate(BaseModel):
    # 필수 필드
    email: EmailStr
    password: str
    name: str
    userId: str
    phone: str  # 필수로 변경
    
    # 선택적 필드
    region: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    workType: Optional[str] = None
    hasBusiness: Optional[bool] = False
    businessNumber: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if not re.match(r'^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{5,}$', v):
            raise ValueError('비밀번호는 영문, 숫자, 특수문자 조합 5자 이상이어야 합니다.')
        return v
    
class UserResponse(BaseModel):
    # 필수 필드 (핵심 정합성)
    id: str
    userId: str
    name: str
    email: str
    phone: str  # 필수로 변경
    role: str
    balance: float
    is_active: bool
    created_at: datetime
    
    # 선택적 필드
    last_login_at: Optional[datetime] = None
    region: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    work_type: Optional[str] = None
    has_business: Optional[bool] = False
    business_number: Optional[str] = None
    
    # 프로그램 권한 정보 추가
    programPermissions: Optional[dict] = None
    
    @classmethod
    def from_orm(cls, user):
        """User 모델에서 UserResponse 생성 (표준 구조)"""
        try:
            # 프로그램 권한 정보 안전하게 추출
            program_permissions = {
                'free': getattr(user, 'program_permissions_free', False) or False,
                'month1': getattr(user, 'program_permissions_month1', False) or False,
                'month3': getattr(user, 'program_permissions_month3', False) or False
            }
            
            return cls(
                id=user.id,
                userId=user.id,  # id와 동일
                name=user.name,
                email=user.email,
                phone=user.phone or "010-0000-0000",  # 기본값 제공
                role=user.role,
                balance=user.balance,
                is_active=user.is_active,
                created_at=user.created_at,
                last_login_at=user.updated_at,  # 임시로 updated_at 사용
                region=user.region,
                age=user.age,
                gender=user.gender,
                work_type=user.work_type,
                has_business=user.has_business,
                business_number=user.business_number,
                # 프로그램 권한 정보 추가
                programPermissions=program_permissions
            )
        except Exception as e:
            logger.error(f"UserResponse.from_orm 오류: {str(e)}")
            # 기본값으로 생성
            return cls(
                id=user.id,
                userId=user.id,
                name=user.name or "",
                email=user.email or "",
                phone=user.phone or "010-0000-0000",
                role=user.role or "user",
                balance=user.balance or 0.0,
                is_active=user.is_active or True,
                created_at=user.created_at or datetime.utcnow(),
                programPermissions={
                    'free': False,
                    'month1': False,
                    'month3': False
                }
            )
    
    class Config:
        from_attributes = True  # orm_mode의 새 이름

class LoginResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str

class SignupResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"

# 헬퍼 함수
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: str):
    return db.query(User).filter(User.id == user_id).first()

def authenticate_user(db: Session, username: str, password: str):
    """
    이메일 또는 사용자 ID를 사용하여 인증
    username 파라미터는 이메일 또는 사용자 ID가 될 수 있음
    """
    logger.info(f"사용자 인증 시작: {username}")
    
    # 먼저 이메일로 시도
    user = get_user(db, email=username)
    
    # 이메일로 찾지 못한 경우 사용자 ID로 시도
    if not user and '@' not in username:
        logger.info(f"사용자 ID로 검색 시도: {username}")
        user = get_user_by_id(db, user_id=username)
    
    if not user:
        logger.warning(f"사용자를 찾을 수 없음: {username}")
        return False    
    
    logger.info(f"사용자 찾음: {user.email}, 비밀번호 확인 중...")
    if not user.verify_password(password):
        logger.warning(f"비밀번호 확인 실패: {user.email}")
        return False
        
    logger.info(f"인증 성공: {user.email}")
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        logger.error("토큰이 제공되지 않음")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰이 제공되지 않았습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 토큰 형식 검증 강화
    logger.info(f"토큰 검증 시작: 길이={len(token)}, 시작={token[:20]}...")
    
    # 토큰 형식 기본 검증
    if not token or len(token.strip()) == 0:
        logger.error("토큰이 비어있음")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # JWT 토큰 형식 검증 (3개 세그먼트: header.payload.signature)
    token_parts = token.split('.')
    if len(token_parts) != 3:
        logger.error(f"JWT 토큰 형식 오류: 세그먼트 수={len(token_parts)}, 토큰={token[:50]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰 형식이 올바르지 않습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="토큰 인증에 실패했습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        logger.info(f"JWT 디코드 시도: SECRET_KEY 길이={len(SECRET_KEY)}, ALGORITHM={ALGORITHM}")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.info(f"JWT 디코드 성공: payload={payload}")
        
        email: str = payload.get("sub")
        
        if email is None:
            logger.error("토큰에 이메일 정보가 없음")
            raise credentials_exception
            
        token_data = TokenData(email=email)
        logger.info(f"토큰 데이터 생성 완료: email={email}")
        
    except JWTError as e:
        logger.error(f"JWT 디코드 오류 상세: {str(e)}, 토큰 길이={len(token)}, 토큰 시작={token[:30]}...")
        logger.error(f"SECRET_KEY 정보: 길이={len(SECRET_KEY)}, 시작={SECRET_KEY[:10]}...")
        raise credentials_exception
        
    user = get_user(db, email=token_data.email)
    
    if user is None:
        logger.error(f"DB에서 사용자를 찾을 수 없음: {token_data.email}")
        raise credentials_exception
        
    logger.debug(f"사용자 인증 성공: {user.email}")
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="비활성화된 사용자입니다")
    return current_user

async def get_optional_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    토큰이 제공된 경우 사용자 정보를 반환하고, 제공되지 않은 경우 None을 반환합니다.
    이는 인증이 선택적인 API 엔드포인트에서 사용됩니다.
    """
    if not token:
        return None
    
    # 임시: 더미 토큰 처리 (실제 운영에서는 제거 필요)
    if token == "dummy-token":
        return None
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            return None
            
        user = get_user(db, email=email)
        return user if user and user.is_active else None
        
    except JWTError:
        return None

async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다")
    return current_user

# API 엔드포인트
@router.post("/register", response_model=StandardResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """회원가입 (레거시 엔드포인트)"""
    try:
        # 기존 사용자 확인
        existing_user = get_user(db, email=user_data.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다")
        
        existing_user_id = get_user_by_id(db, user_data.userId)
        if existing_user_id:
            raise HTTPException(status_code=400, detail="이미 사용 중인 사용자 ID입니다")
        
        # 새 사용자 생성
        hashed_password = User.get_password_hash(user_data.password)
        db_user = User(
            id=user_data.userId,
            email=user_data.email,
            hashed_password=hashed_password,
            name=user_data.name,
            phone=user_data.phone,
            region=user_data.region,
            age=user_data.age,
            gender=user_data.gender,
            work_type=user_data.workType,
            has_business=user_data.hasBusiness,
            business_number=user_data.businessNumber
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # 액세스 토큰 생성
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user.email}, expires_delta=access_token_expires
        )
        
        return StandardResponse(
            success=True,
            message="회원가입이 성공적으로 완료되었습니다",
            data={
                "user": db_user.to_dict(),
                "access_token": access_token,
                "token_type": "bearer"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"회원가입 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="회원가입 처리 중 오류가 발생했습니다")

@router.post("/signup", response_model=SignupResponse)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """회원가입 - 신규 가입 시 자동으로 예치금 10,000원과 무료 프로그램 권한 부여"""
    try:
        # 기존 사용자 확인
        existing_user = get_user(db, email=user_data.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다")
        
        existing_user_id = get_user_by_id(db, user_data.userId)
        if existing_user_id:
            raise HTTPException(status_code=400, detail="이미 사용 중인 사용자 ID입니다")
        
        # 새 사용자 생성 (자동 혜택 포함)
        hashed_password = User.get_password_hash(user_data.password)
        db_user = User(
            id=user_data.userId,
            email=user_data.email,
            hashed_password=hashed_password,
            name=user_data.name,
            phone=user_data.phone,
            region=user_data.region,
            age=user_data.age,
            gender=user_data.gender,
            work_type=user_data.workType,
            has_business=user_data.hasBusiness,
            business_number=user_data.businessNumber,
            # 🎁 신규 가입 혜택: 자동 예치금 10,000원
            balance=10000.0,
            # 🎁 신규 가입 혜택: 무료 프로그램 다운로드 권한
            program_permissions_free=True
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # 액세스 토큰 생성
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user.email}, expires_delta=access_token_expires
        )
        
        logger.info(f"신규 회원가입 완료: {db_user.email}, 예치금: {db_user.balance}원, 무료권한: {db_user.program_permissions_free}")
        
        return SignupResponse(
            user=UserResponse.from_orm(db_user),
            access_token=access_token,
            token_type="bearer"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"회원가입 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="회원가입 처리 중 오류가 발생했습니다")

@router.post("/login", response_model=LoginResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """로그인"""
    try:
        logger.info(f"로그인 시도: username={form_data.username}")
        
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="이메일 또는 비밀번호가 올바르지 않습니다",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(status_code=400, detail="비활성화된 계정입니다")
        
        # 액세스 토큰 생성
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        logger.info(f"로그인 성공: {user.email}, UserResponse 생성 시작")
        
        # UserResponse 생성 시 안전하게 처리
        try:
            user_response = UserResponse.from_orm(user)
            logger.info(f"UserResponse 생성 성공: programPermissions={user_response.programPermissions}")
        except Exception as e:
            logger.error(f"UserResponse 생성 실패: {str(e)}")
            # 기본 UserResponse 생성
            user_response = UserResponse(
                id=user.id,
                userId=user.id,
                name=user.name or "",
                email=user.email or "",
                phone=user.phone or "010-0000-0000",
                role=user.role or "user",
                balance=user.balance or 0.0,
                is_active=user.is_active or True,
                created_at=user.created_at or datetime.utcnow(),
                programPermissions={
                    'free': False,
                    'month1': False,
                    'month3': False
                }
            )
        
        return LoginResponse(
            user=user_response,
            access_token=access_token,
            token_type="bearer"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"로그인 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="로그인 처리 중 오류가 발생했습니다")

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """현재 로그인한 사용자 정보 조회 (프로그램 권한 포함)"""
    try:
        logger.info(f"사용자 정보 조회 시작: user_id={current_user.id}")
        
        # UserResponse.from_orm에서 자동으로 프로그램 권한 정보 포함
        user_response = UserResponse.from_orm(current_user)
        
        logger.info(f"사용자 정보 조회 완료: programPermissions={user_response.programPermissions}")
        return user_response
        
    except Exception as e:
        logger.error(f"사용자 정보 조회 중 오류: {str(e)}")
        # 오류 시 기본 사용자 정보만 반환
        return UserResponse.from_orm(current_user)

@router.get("/check-admin")
async def check_admin_status(current_user: User = Depends(get_current_active_user)):
    """관리자 권한 확인"""
    return {
        "is_admin": current_user.is_admin,
        "user_id": current_user.id,
        "email": current_user.email
    }

@router.get("/program-permissions")
async def get_user_program_permissions(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """사용자의 프로그램 권한 조회 (User 테이블에서 직접 읽기)"""
    try:
        logger.info(f"프로그램 권한 조회 시작: user_id={current_user.id}")
        
        # User 테이블에서 직접 읽기 (예치금 방식)
        program_permissions = {
            'free': current_user.program_permissions_free or False,
            'month1': current_user.program_permissions_month1 or False,
            'month3': current_user.program_permissions_month3 or False
        }
        
        logger.info(f"프로그램 권한 조회 완료: {program_permissions}")
        
        return {
            "success": True,
            "programPermissions": program_permissions,
            "user_id": current_user.id
        }
        
    except Exception as e:
        logger.error(f"프로그램 권한 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="프로그램 권한 조회 중 오류가 발생했습니다")

@router.post("/update-program-permissions")
async def update_user_program_permissions(
    request: dict = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """사용자 자신의 프로그램 권한을 업데이트합니다 (예치금 방식으로 단순화)"""
    try:
        permissions = request.get("permissions", {})
        
        # User 테이블에 직접 저장 (예치금 방식)
        current_user.program_permissions_free = permissions.get('free', False)
        current_user.program_permissions_month1 = permissions.get('month1', False)
        current_user.program_permissions_month3 = permissions.get('month3', False)
        
        db.commit()
        db.refresh(current_user)
        
        # 업데이트된 권한 정보 반환
        program_permissions = {
            'free': current_user.program_permissions_free,
            'month1': current_user.program_permissions_month1,
            'month3': current_user.program_permissions_month3
        }
        
        return {
            "success": True,
            "message": "프로그램 권한이 성공적으로 업데이트되었습니다",
            "programPermissions": program_permissions
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"프로그램 권한 업데이트 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"프로그램 권한 업데이트 중 오류 발생: {str(e)}")

@router.post("/update-program-permissions-bulk")
async def update_user_program_permissions_bulk(
    request: dict = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """사용자의 모든 프로그램 권한을 한 번에 업데이트합니다 (1회성 처리)"""
    try:
        permissions = request.get("permissions", {})
        
        # User 테이블에 직접 저장 (예치금 방식)
        current_user.program_permissions_free = permissions.get('free', False)
        current_user.program_permissions_month1 = permissions.get('month1', False)
        current_user.program_permissions_month3 = permissions.get('month3', False)
        
        db.commit()
        db.refresh(current_user)
        
        # 업데이트된 권한 정보 반환
        program_permissions = {
            'free': current_user.program_permissions_free,
            'month1': current_user.program_permissions_month1,
            'month3': current_user.program_permissions_month3
        }
        
        logger.info(f"프로그램 권한 일괄 업데이트 완료: user_id={current_user.id}, permissions={program_permissions}")
        
        return {
            "success": True,
            "message": "프로그램 권한이 성공적으로 업데이트되었습니다",
            "programPermissions": program_permissions,
            "type": "bulk_update"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"프로그램 권한 일괄 업데이트 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"프로그램 권한 업데이트 중 오류 발생: {str(e)}")

@router.post("/admin/update-user-program-permissions")
async def admin_update_user_program_permissions(
    request: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """관리자가 특정 사용자의 프로그램 권한을 업데이트합니다."""
    try:
        user_id = request.get("user_id")
        permissions = request.get("permissions", {})
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id가 필요합니다.")
        
        logger.info(f"[ADMIN 권한 업데이트] 시작: user_id={user_id}, permissions={permissions}")
        
        # 타겟 사용자 조회
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="해당 사용자를 찾을 수 없습니다.")
        
        # 권한 업데이트 전 상태 로깅
        before_permissions = {
            'free': target_user.program_permissions_free,
            'month1': target_user.program_permissions_month1,
            'month3': target_user.program_permissions_month3
        }
        logger.info(f"[ADMIN 권한 업데이트] 업데이트 전: {before_permissions}")
        
        # 권한 업데이트
        target_user.program_permissions_free = permissions.get('free', False)
        target_user.program_permissions_month1 = permissions.get('month1', False)
        target_user.program_permissions_month3 = permissions.get('month3', False)
        
        # 업데이트 후 상태 로깅
        after_permissions = {
            'free': target_user.program_permissions_free,
            'month1': target_user.program_permissions_month1,
            'month3': target_user.program_permissions_month3
        }
        logger.info(f"[ADMIN 권한 업데이트] 업데이트 후: {after_permissions}")
        
        # 커밋 전 로깅
        logger.info(f"[ADMIN 권한 업데이트] 커밋 시작: user_id={user_id}")
        db.commit()
        logger.info(f"[ADMIN 권한 업데이트] 커밋 성공: user_id={user_id}")
        
        # refresh 후 최종 상태 확인
        db.refresh(target_user)
        final_permissions = {
            'free': target_user.program_permissions_free,
            'month1': target_user.program_permissions_month1,
            'month3': target_user.program_permissions_month3
        }
        logger.info(f"[ADMIN 권한 업데이트] refresh 후 최종 상태: {final_permissions}")
        
        program_permissions = {
            'free': target_user.program_permissions_free,
            'month1': target_user.program_permissions_month1,
            'month3': target_user.program_permissions_month3
        }
        
        logger.info(f"[ADMIN 권한 업데이트] 완료: user_id={user_id}, final_permissions={program_permissions}")
        
        return {
            "success": True,
            "message": "프로그램 권한이 성공적으로 업데이트되었습니다.",
            "user_id": user_id,
            "programPermissions": program_permissions
        }
    except HTTPException:
        # HTTPException은 그대로 재발생
        raise
    except Exception as e:
        logger.error(f"[ADMIN 권한 업데이트] 예외 발생: {str(e)}")
        db.rollback()
        logger.error(f"[ADMIN 권한 업데이트] 롤백 완료")
        raise HTTPException(status_code=500, detail=f"관리자 프로그램 권한 업데이트 중 오류 발생: {str(e)}")

@router.get("/users")
async def get_users(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """관리자가 사용자 목록을 조회합니다."""
    try:
        query = db.query(User)
        
        # 검색 필터 적용
        if search:
            query = query.filter(
                or_(
                    User.name.contains(search),
                    User.email.contains(search)
                )
            )
        
        # 페이지네이션 적용
        users = query.offset(skip).limit(limit).all()
        total = query.count()
        
        # 응답 데이터 구성
        user_list = []
        for user in users:
            user_data = {
                "id": user.id,
                "username": user.name,  # username 대신 name 사용
                "email": user.email,
                "phone": user.phone or "",  # 전화번호 추가
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "balance": user.balance,  # 예치금 정보 추가
                "program_permissions_free": user.program_permissions_free,
                "program_permissions_month1": user.program_permissions_month1,
                "program_permissions_month3": user.program_permissions_month3
            }
            user_list.append(user_data)
        
        return {
            "users": user_list,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"사용자 목록 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="사용자 목록 조회 중 오류가 발생했습니다.")
