from fastapi import APIRouter, Depends, HTTPException, status
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
    
    @classmethod
    def from_orm(cls, user):
        """User 모델에서 UserResponse 생성 (표준 구조)"""
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
            business_number=user.business_number
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
    
    logger.debug(f"토큰 인증: {token[:10]}...")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="토큰 인증에 실패했습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            logger.error("토큰에 이메일 정보가 없음")
            raise credentials_exception
            
        token_data = TokenData(email=email)
    except JWTError as e:
        logger.error(f"JWT 디코드 오류: {str(e)}")
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
    """회원가입"""
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
        
        logger.info(f"로그인 성공: {user.email}")
        return LoginResponse(
            user=UserResponse.from_orm(user),
            access_token=access_token,
            token_type="bearer"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"로그인 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="로그인 처리 중 오류가 발생했습니다")

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """현재 로그인한 사용자 정보 조회"""
    return UserResponse.from_orm(current_user)

@router.get("/check-admin")
async def check_admin_status(current_user: User = Depends(get_current_active_user)):
    """관리자 권한 확인"""
    return {
        "is_admin": current_user.is_admin,
        "user_id": current_user.id,
        "email": current_user.email
    }
