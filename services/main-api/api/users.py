from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import uuid
from sqlalchemy import func

from database import get_db
from models.user import User
from models.program import UserProgram, Program
from api.auth import get_current_active_user, get_current_admin_user

router = APIRouter()

# 요청/응답 모델
class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    balance: float
    is_active: bool
    role: str
    created_at: datetime
    business_number: Optional[str] = None
    last_login_at: Optional[datetime] = None
    total_spent: Optional[float] = None
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None
    business_number: Optional[str] = None

class CMSStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_balance: float
    monthly_revenue: float
    new_users_this_month: int
    average_balance: float

class BulkDepositRequest(BaseModel):
    user_ids: List[str]
    amount: float
    deposit_type: str  # 'add' or 'subtract'
    memo: Optional[str] = None

class UserProgramInfoResponse(BaseModel):
    license_type: str
    expires_at: Optional[str] = None
    download_count: int
    is_allowed: bool
    last_downloaded: Optional[str] = None
    program_count_by_type: Dict[str, int] = {}

# API 엔드포인트
@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """사용자 목록 조회 (관리자 전용)"""
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.email.contains(search)) | 
            (User.name.contains(search))
        )
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/me", response_model=UserResponse)
async def read_user_me(current_user: User = Depends(get_current_active_user)):
    """현재 로그인한 사용자 정보 조회"""
    return current_user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """특정 사용자 정보 조회 (관리자 전용)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """사용자 정보 업데이트 (관리자 전용)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    if user_data.name:
        user.name = user_data.name
    
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    if user_data.role:
        user.role = user_data.role
    
    if user_data.business_number:
        user.business_number = user_data.business_number
    
    db.commit()
    db.refresh(user)
    return user

@router.put("/me/update", response_model=UserResponse)
async def update_user_me(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """자신의 사용자 정보 업데이트"""
    if user_data.name:
        current_user.name = user_data.name
    
    if user_data.is_active is not None:
        current_user.is_active = user_data.is_active
    
    if user_data.role:
        current_user.role = user_data.role
    
    if user_data.business_number:
        current_user.business_number = user_data.business_number
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/program-info", response_model=UserProgramInfoResponse)
async def get_user_program_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """현재 사용자의 프로그램 이용현황 정보 조회"""
    # 사용자의 프로그램 권한 정보 조회
    user_programs = db.query(UserProgram).filter(UserProgram.user_id == current_user.id).all()
    
    # 기본값 설정
    license_type = "무료"
    expires_at = None
    total_download_count = 0
    is_allowed = True  # 무료 사용자는 기본 허용
    last_downloaded = None
    program_count_by_type = {"free": 0, "month1": 0, "month3": 0}
    
    # 사용자가 가진 프로그램별 정보 수집
    for user_program in user_programs:
        program = db.query(Program).filter(Program.id == user_program.program_id).first()
        if program:
            # 다운로드 횟수 누적
            total_download_count += user_program.download_count or 0
            
            # 라이센스 타입별 카운트
            if program.license_type in program_count_by_type:
                program_count_by_type[program.license_type] += 1
            
            # 최고 라이센스 타입 결정 (무료 < 1개월 < 3개월)
            if program.license_type == "month3" and license_type in ["무료", "1개월"]:
                license_type = "3개월"
                # 3개월 라이센스 만료일 계산 (예: 현재로부터 90일)
                expires_at = (datetime.utcnow() + timedelta(days=90)).strftime("%Y.%m.%d")
            elif program.license_type == "month1" and license_type == "무료":
                license_type = "1개월"
                # 1개월 라이센스 만료일 계산 (예: 현재로부터 30일)
                expires_at = (datetime.utcnow() + timedelta(days=30)).strftime("%Y.%m.%d")
            
            # 마지막 다운로드 시간 업데이트
            if user_program.last_downloaded and (not last_downloaded or user_program.last_downloaded > last_downloaded):
                last_downloaded = user_program.last_downloaded.strftime("%Y.%m.%d %H:%M")
    
    # 무료 사용자의 경우 기본 만료일 설정 (예: 1년 후)
    if license_type == "무료":
        expires_at = (datetime.utcnow() + timedelta(days=365)).strftime("%Y.%m.%d")
    
    return UserProgramInfoResponse(
        license_type=license_type,
        expires_at=expires_at,
        download_count=total_download_count,
        is_allowed=is_allowed,
        last_downloaded=last_downloaded,
        program_count_by_type=program_count_by_type
    )

@router.get("/cms/stats", response_model=CMSStatsResponse)
async def get_cms_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """CMS 통계 정보 조회 (관리자 전용)"""
    # 총 사용자 수
    total_users = db.query(User).count()
    
    # 활성 사용자 수
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # 총 예치금
    total_balance = db.query(User).with_entities(func.sum(User.balance)).scalar() or 0
    
    # 이번 달 신규 사용자 수
    first_day_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_users_this_month = db.query(User).filter(User.created_at >= first_day_of_month).count()
    
    # 평균 예치금
    average_balance = total_balance / total_users if total_users > 0 else 0
    
    # 이번 달 매출 (실제 구현에서는 거래 내역 테이블에서 계산)
    monthly_revenue = 1500000  # 임시 값, 실제로는 거래 내역에서 계산
    
    return CMSStatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_balance=total_balance,
        monthly_revenue=monthly_revenue,
        new_users_this_month=new_users_this_month,
        average_balance=average_balance
    )

@router.post("/cms/bulk-deposit")
async def bulk_deposit(
    request: BulkDepositRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """일괄 예치금 처리 (관리자 전용)"""
    if not request.user_ids:
        raise HTTPException(status_code=400, detail="사용자 ID 목록이 필요합니다")
    
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="금액은 0보다 커야 합니다")
    
    updated_users = []
    
    for user_id in request.user_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            continue
            
        if request.deposit_type == 'add':
            user.balance += request.amount
        elif request.deposit_type == 'subtract':
            user.balance = max(0, user.balance - request.amount)
        else:
            raise HTTPException(status_code=400, detail="잘못된 처리 유형입니다")
        
        updated_users.append(user)
    
    db.commit()
    
    # 거래 내역 기록 (실제 구현에서는 별도 테이블에 저장)
    return {
        "message": f"{len(updated_users)}명의 사용자 예치금이 {request.deposit_type} 처리되었습니다",
        "updated_count": len(updated_users),
        "amount": request.amount,
        "deposit_type": request.deposit_type
    }

@router.get("/cms/users", response_model=List[UserResponse])
async def get_cms_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """CMS용 사용자 목록 조회 (관리자 전용)"""
    query = db.query(User)
    
    # 검색 필터
    if search:
        query = query.filter(
            (User.email.contains(search)) | 
            (User.name.contains(search)) |
            (User.business_number.contains(search))
        )
    
    # 권한 필터
    if role and role != 'all':
        query = query.filter(User.role == role)
    
    # 상태 필터
    if status and status != 'all':
        if status == 'active':
            query = query.filter(User.is_active == True)
        elif status == 'inactive':
            query = query.filter(User.is_active == False)
    
    # 정렬
    if sort_by == 'balance':
        if sort_order == 'desc':
            query = query.order_by(User.balance.desc())
        else:
            query = query.order_by(User.balance.asc())
    elif sort_by == 'name':
        if sort_order == 'desc':
            query = query.order_by(User.name.desc())
        else:
            query = query.order_by(User.name.asc())
    else:  # 기본값: 생성일
        if sort_order == 'desc':
            query = query.order_by(User.created_at.desc())
        else:
            query = query.order_by(User.created_at.asc())
    
    users = query.offset(skip).limit(limit).all()
    return users