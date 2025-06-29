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
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# 환경변수 로드
load_dotenv()

# 시크릿 키 및 토큰 설정
SECRET_KEY = os.getenv("JWT_SECRET", "qclick_secret_key_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7일

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# 요청/응답 모델
class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    email: Optional[str] = None
    
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    userId: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if not re.match(r'^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{5,}$', v):
            raise ValueError('비밀번호는 영문, 숫자, 특수문자 조합 5자 이상이어야 합니다.')
        return v
    
class UserResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    email: str
    name: str
    balance: float
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True  # orm_mode의 새 이름

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
    return db.query(User).filter(User.user_id == user_id).first()

def authenticate_user(db: Session, username: str, password: str):
    """
    이메일 또는 사용자 ID를 사용하여 인증
    username 파라미터는 이메일 또는 사용자 ID가 될 수 있음
    """
    logger.debug(f"Authenticating user with username: {username}")
    
    # 먼저 이메일로 시도
    user = get_user(db, email=username)
    
    # 이메일로 찾지 못한 경우 사용자 ID로 시도
    if not user and '@' not in username:
        user = get_user_by_id(db, user_id=username)
    
    if not user:
        logger.debug(f"User not found with username: {username}")
        return False    
    logger.debug(f"User found, verifying password for: {user.email}")
    if not user.verify_password(password):
        logger.debug(f"Password verification failed for: {user.email}")
        return False
        
    logger.debug(f"Authentication successful: {user.email}")
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        logger.error("No token provided in request")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰이 제공되지 않았습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.debug(f"Authenticating token: {token[:10]}...")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="토큰 인증에 실패했습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        logger.debug("Decoding JWT token...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        logger.debug(f"Token contains email: {email}")
        
        if email is None:
            logger.error("Token does not contain email (sub field)")
            raise credentials_exception
            
        token_data = TokenData(email=email)
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        logger.error(f"Token length: {len(token) if token else 0}")
        logger.error(f"Token preview: {token[:50] if token else 'None'}...")
        raise credentials_exception
        
    logger.debug(f"Getting user from DB with email: {token_data.email}")
    user = get_user(db, email=token_data.email)
    
    if user is None:
        logger.error(f"User with email {token_data.email} not found in DB")
        raise credentials_exception
        
    logger.debug(f"User authenticated successfully: {user.email}")
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
        # Mock 사용자 반환
        mock_user = User(
            id="1",
            user_id="testuser",
            email="test@example.com",
            name="테스트 사용자",
            role="user",  # is_admin 대신 role 사용
            is_active=True
        )
        return mock_user
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            return None
            
        user = get_user(db, email=email)
        if user is None or not user.is_active:
            return None
            
        return user
    except JWTError:
        return None

async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="관리자 권한이 필요합니다"
        )
    return current_user

# API 엔드포인트
@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user(db, email=user_data.email)
    if db_user:
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다")
    
    # userId가 제공된 경우 userId로 이미 등록된 사용자가 있는지 확인
    if user_data.userId:
        user_by_id = db.query(User).filter(User.user_id == user_data.userId).first()
        if user_by_id:
            raise HTTPException(status_code=400, detail="이미 사용 중인 아이디입니다")
    
    new_user = User(
        email=user_data.email,
        hashed_password=User.get_password_hash(user_data.password),
        name=user_data.name,
        user_id=user_data.userId,
        balance=10000.0  # 신규 가입 시 1만원 지급
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 무료 프로그램 자동 활성화
    from models.program import Program, UserProgram
    import uuid
    from datetime import datetime
    
    free_programs = db.query(Program).filter(Program.license_type == "free").all()
    for program in free_programs:
        user_program = UserProgram(
            id=str(uuid.uuid4()),
            user_id=new_user.id,
            program_id=program.id,
            is_allowed=True,
            download_count=0,
            created_at=datetime.utcnow()
        )
        db.add(user_program)
    
    db.commit()
    
    return new_user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    logger.debug(f"Login attempt with username: {form_data.username}")
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        logger.error(f"Login failed for username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 일치하지 않습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.debug(f"Login successful, generating token for: {user.email}")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    logger.debug(f"Token generated for user: {user.email}")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """
    현재 로그인한 사용자의 정보를 반환합니다.
    직렬화 문제를 피하기 위해 수동으로 딕셔너리를 생성하여 반환합니다.
    """
    logger.debug(f"Reading user data for: {current_user.email}")
    try:
        # 수동으로 응답 객체를 생성
        response_data = {
            "id": str(current_user.id),
            "user_id": current_user.user_id,
            "email": current_user.email,
            "name": current_user.name,
            "balance": float(current_user.balance or 0),
            "is_active": bool(current_user.is_active),
            "is_admin": current_user.role == "admin",
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        }
        return response_data
    except Exception as e:
        logger.error(f"Error reading user data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"사용자 정보를 가져오는 중 오류 발생: {str(e)}")

@router.get("/check-admin")
async def check_admin_status(current_user: User = Depends(get_current_active_user)):
    """
    현재 로그인한 사용자가 관리자 권한을 가지고 있는지 확인합니다.
    """
    return {"isAdmin": current_user.is_admin}
