from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import uuid
from fastapi.responses import JSONResponse
from sqlalchemy import func

from database import get_db
from models.user import User
from models.program import Program, UserProgram
from models.transaction import Transaction
from api.auth import get_current_admin_user

router = APIRouter()

# 요청/응답 모델
class UserProgramResponse(BaseModel):
    user_id: str
    program_id: str
    program_name: str
    is_allowed: bool
    license_expiry: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserWithProgramsResponse(BaseModel):
    id: str
    email: str
    name: str
    balance: float
    is_active: bool
    role: str
    programs: List[UserProgramResponse]
    
    class Config:
        from_attributes = True

class BalanceUpdateRequest(BaseModel):
    amount: float = Field(..., description="추가 또는 차감할 금액")
    description: str = Field(..., description="예치금 업데이트 설명")
    
class ProgramPermissionRequest(BaseModel):
    program_id: str
    is_allowed: bool
    duration_months: Optional[int] = Field(None, description="허용 기간(개월)")

class DepositUpdateRequest(BaseModel):
    user_id: str
    balance_update: Optional[BalanceUpdateRequest] = None
    program_permissions: Optional[List[ProgramPermissionRequest]] = None

class BulkDepositUpdateRequest(BaseModel):
    updates: List[DepositUpdateRequest]

# API 엔드포인트
@router.get("/users", response_model=List[UserWithProgramsResponse])
async def get_users_with_programs(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """사용자 목록을 프로그램 권한 정보와 함께 조회 (관리자 전용)"""
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.email.contains(search)) | 
            (User.name.contains(search))
        )
    
    users = query.offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        # 사용자의 프로그램 권한 조회
        user_programs = db.query(UserProgram, Program) \
            .join(Program, UserProgram.program_id == Program.id) \
            .filter(UserProgram.user_id == user.id) \
            .all()
        
        programs = []
        for up, program in user_programs:
            programs.append(UserProgramResponse(
                user_id=up.user_id,
                program_id=up.program_id,
                program_name=program.name,
                is_allowed=up.is_allowed,
                license_expiry=up.license_expiry
            ))
        
        # 기존 프로그램 권한이 없는 프로그램에 대해 기본 권한 정보 추가
        all_programs = db.query(Program).all()
        existing_program_ids = {p.program_id for p in programs}
        
        for program in all_programs:
            if program.id not in existing_program_ids:
                programs.append(UserProgramResponse(
                    user_id=user.id,
                    program_id=program.id,
                    program_name=program.name,
                    is_allowed=False,
                    license_expiry=None
                ))
        
        user_with_programs = UserWithProgramsResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            balance=user.balance,
            is_active=user.is_active,
            role=user.role,
            programs=programs
        )
        result.append(user_with_programs)
    
    return result

@router.post("/update-balance")
async def update_user_balance(
    request: BalanceUpdateRequest,
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """사용자의 예치금을 업데이트합니다 (관리자 전용)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    # 예치금 업데이트
    user.balance += request.amount
    
    # 거래 내역 기록
    transaction = Transaction(
        user_id=user.id,
        amount=request.amount,
        balance_after=user.balance,
        transaction_type="admin_adjustment",
        description=request.description
    )
    
    db.add(transaction)
    db.commit()
    
    return {"message": "예치금이 업데이트되었습니다", "new_balance": user.balance}

@router.post("/update-program-permission")
async def update_program_permission(
    request: ProgramPermissionRequest,
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """사용자의 프로그램 사용 권한을 업데이트합니다 (관리자 전용)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    program = db.query(Program).filter(Program.id == request.program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="프로그램을 찾을 수 없습니다")
    
    # 기존 권한 조회
    user_program = db.query(UserProgram) \
        .filter(UserProgram.user_id == user_id, UserProgram.program_id == request.program_id) \
        .first()
    
    # 권한 만료일 계산
    license_expiry = None
    if request.is_allowed and request.duration_months:
        license_expiry = datetime.now() + timedelta(days=30 * request.duration_months)
    
    if user_program:
        # 기존 권한 업데이트
        user_program.is_allowed = request.is_allowed
        if license_expiry:
            user_program.license_expiry = license_expiry
    else:
        # 새 권한 생성
        user_program = UserProgram(
            user_id=user_id,
            program_id=request.program_id,
            is_allowed=request.is_allowed,
            license_expiry=license_expiry
        )
        db.add(user_program)
    
    db.commit()
    
    return {
        "message": "프로그램 사용 권한이 업데이트되었습니다", 
        "is_allowed": request.is_allowed,
        "license_expiry": license_expiry
    }

@router.post("/bulk-update")
async def bulk_update_deposits(
    request: BulkDepositUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """여러 사용자의 예치금과 프로그램 권한을 일괄 업데이트합니다 (관리자 전용)"""
    results = []
    
    for update in request.updates:
        user = db.query(User).filter(User.id == update.user_id).first()
        if not user:
            results.append({
                "user_id": update.user_id,
                "success": False,
                "message": "사용자를 찾을 수 없습니다"
            })
            continue
        
        # 예치금 업데이트
        if update.balance_update:
            user.balance += update.balance_update.amount
            transaction = Transaction(
                user_id=user.id,
                amount=update.balance_update.amount,
                balance_after=user.balance,
                transaction_type="admin_adjustment",
                description=update.balance_update.description
            )
            db.add(transaction)
        
        # 프로그램 권한 업데이트
        if update.program_permissions:
            for pp in update.program_permissions:
                program = db.query(Program).filter(Program.id == pp.program_id).first()
                if not program:
                    continue
                
                user_program = db.query(UserProgram) \
                    .filter(UserProgram.user_id == update.user_id, UserProgram.program_id == pp.program_id) \
                    .first()
                
                license_expiry = None
                if pp.is_allowed and pp.duration_months:
                    license_expiry = datetime.now() + timedelta(days=30 * pp.duration_months)
                
                if user_program:
                    user_program.is_allowed = pp.is_allowed
                    if license_expiry:
                        user_program.license_expiry = license_expiry
                else:
                    user_program = UserProgram(
                        user_id=update.user_id,
                        program_id=pp.program_id,
                        is_allowed=pp.is_allowed,
                        license_expiry=license_expiry
                    )
                    db.add(user_program)
        
        results.append({
            "user_id": update.user_id,
            "success": True,
            "message": "성공적으로 업데이트되었습니다"
        })
    
    db.commit()
    
    return {"results": results}

@router.get("/export-users-excel")
async def export_users_to_excel(
    user_ids: List[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """사용자 목록을 Excel 형식으로 내보냅니다 (관리자 전용)"""
    # 실제 Excel 파일 생성은 프론트엔드에서 처리
    # 여기서는 필요한 데이터만 반환
    
    query = db.query(User)
    if user_ids:
        query = query.filter(User.id.in_(user_ids))
    
    users = query.all()
    
    user_data = []
    for user in users:
        # 사용자의 프로그램 권한 정보
        user_programs = db.query(UserProgram, Program) \
            .join(Program, UserProgram.program_id == Program.id) \
            .filter(UserProgram.user_id == user.id) \
            .all()
        
        programs_info = {
            up.program_id: {
                "name": program.name,
                "is_allowed": up.is_allowed,
                "license_expiry": up.license_expiry.isoformat() if up.license_expiry else None
            }
            for up, program in user_programs
        }
        
        user_data.append({
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "balance": user.balance,
            "is_active": user.is_active,
            "role": user.role,
            "created_at": user.created_at.isoformat(),
            "programs": programs_info
        })
    
    return {"users": user_data}
