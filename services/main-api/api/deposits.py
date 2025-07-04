from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import uuid
from fastapi.responses import JSONResponse
from sqlalchemy import func
import logging

from database import get_db
from models.user import User
from models.program import Program, UserProgram
from models.transaction import Transaction, TransactionType
from api.auth import get_current_admin_user, get_current_active_user

# 로깅 설정
logger = logging.getLogger(__name__)

router = APIRouter()

# 표준 응답 모델
class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

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

class ProgramDownloadRequest(BaseModel):
    program_id: str
    license_type: str  # free, month1, month3
    prices: Optional[dict] = None  # 프론트엔드에서 전송하는 가격 정보

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
    try:
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
                    license_expiry=up.expires_at
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"사용자 목록 조회 중 오류 발생: {str(e)}")

@router.patch("/users/{user_id}/balance", response_model=StandardResponse)
async def update_user_balance(
    user_id: str,
    request: BalanceUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """사용자의 예치금을 업데이트합니다 (관리자 전용)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        
        # 예치금 업데이트
        old_balance = user.balance
        user.balance += request.amount  # 직접 잔액 업데이트
        
        # 거래 내역 기록 (잔액은 이미 업데이트됨)
        if request.amount > 0:
            transaction = Transaction.create_deposit_transaction(
                user, request.amount, f"admin_{uuid.uuid4()}", request.description
            )
        else:
            transaction = Transaction.create_withdraw_transaction(
                user, abs(request.amount), f"admin_{uuid.uuid4()}", request.description
            )
        
        db.add(transaction)
        db.commit()
        db.refresh(user)
        
        return StandardResponse(
            success=True,
            message="예치금이 성공적으로 업데이트되었습니다",
            data={
                "user_id": user.id,
                "old_balance": old_balance,
                "new_balance": user.balance,
                "amount_change": request.amount,
                "transaction_id": transaction.id
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"예치금 업데이트 중 오류 발생: {str(e)}")

@router.patch("/users/{user_id}/status", response_model=StandardResponse)
async def update_user_status(
    user_id: str,
    request: dict = Body(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """사용자 상태를 업데이트합니다 (관리자 전용)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        
        # 상태 업데이트
        if "is_active" in request:
            user.is_active = request["is_active"]
        
        if "role" in request:
            if request["role"] not in ["user", "admin"]:
                raise HTTPException(status_code=400, detail="유효하지 않은 역할입니다")
            user.role = request["role"]
        
        db.commit()
        db.refresh(user)
        
        return StandardResponse(
            success=True,
            message="사용자 상태가 성공적으로 업데이트되었습니다",
            data=user.to_dict()
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"사용자 상태 업데이트 중 오류 발생: {str(e)}")

@router.patch("/users/{user_id}/role", response_model=StandardResponse)
async def update_user_role(
    user_id: str,
    request: dict = Body(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """사용자 역할을 업데이트합니다 (관리자 전용)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        
        if "role" not in request:
            raise HTTPException(status_code=400, detail="역할 정보가 필요합니다")
        
        if request["role"] not in ["user", "admin"]:
            raise HTTPException(status_code=400, detail="유효하지 않은 역할입니다")
        
        user.role = request["role"]
        db.commit()
        db.refresh(user)
        
        return StandardResponse(
            success=True,
            message="사용자 역할이 성공적으로 업데이트되었습니다",
            data=user.to_dict()
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"사용자 역할 업데이트 중 오류 발생: {str(e)}")

@router.post("/update-program-permission", response_model=StandardResponse)
async def update_program_permission(
    request: ProgramPermissionRequest,
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """사용자의 프로그램 다운로드 권한을 업데이트합니다 (관리자 전용) - User 테이블에 직접 저장"""
    try:
        logger.info(f"프로그램 다운로드 권한 업데이트 시작: user_id={user_id}, program_id={request.program_id}, is_allowed={request.is_allowed}")
        
        # 사용자 확인
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"사용자를 찾을 수 없음: {user_id}")
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        
        logger.info(f"사용자 확인 완료: user={user.email}")
        
        # User 테이블에 직접 저장 (예치금 방식)
        if request.program_id == 'free':
            user.program_permissions_free = request.is_allowed
        elif request.program_id == 'month1':
            user.program_permissions_month1 = request.is_allowed
        elif request.program_id == 'month3':
            user.program_permissions_month3 = request.is_allowed
        else:
            logger.error(f"유효하지 않은 프로그램 ID: {request.program_id}")
            raise HTTPException(status_code=400, detail="유효하지 않은 프로그램 ID입니다")
        
        db.commit()
        db.refresh(user)
        
        logger.info(f"프로그램 다운로드 권한 업데이트 성공: user_id={user_id}, program_id={request.program_id}")
        
        return StandardResponse(
            success=True,
            message="프로그램 다운로드 권한이 성공적으로 업데이트되었습니다",
            data={
                "user_id": user_id,
                "program_id": request.program_id,
                "is_allowed": request.is_allowed,
                "type": "user_table_direct"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"프로그램 다운로드 권한 업데이트 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"프로그램 다운로드 권한 업데이트 중 오류 발생: {str(e)}")

# 기존 엔드포인트들 (하위 호환성을 위해 유지)
@router.post("/update-balance")
async def update_user_balance_legacy(
    request: BalanceUpdateRequest,
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """사용자의 예치금을 업데이트합니다 (레거시 엔드포인트)"""
    return await update_user_balance(user_id, request, db, current_admin)

@router.put("/users/{user_id}")
async def update_user_deposit_legacy(
    user_id: str,
    user_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """사용자 예치금 정보 업데이트 (레거시 엔드포인트)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        
        # 예치금 업데이트
        if "balance" in user_data:
            old_balance = user.balance
            user.balance = user_data["balance"]
            
            # 거래 내역 기록
            amount_change = user.balance - old_balance
            if amount_change != 0:
                description = f"관리자 예치금 조정: {amount_change:+,}원"
                if amount_change > 0:
                    transaction = Transaction.create_deposit_transaction(
                        user, amount_change, f"admin_{uuid.uuid4()}", description
                    )
                else:
                    transaction = Transaction.create_withdraw_transaction(
                        user, abs(amount_change), f"admin_{uuid.uuid4()}", description
                    )
                db.add(transaction)
        
        # 기타 사용자 정보 업데이트
        if "name" in user_data:
            user.name = user_data["name"]
        if "is_active" in user_data:
            user.is_active = user_data["is_active"]
        if "role" in user_data:
            user.role = user_data["role"]
        
        db.commit()
        db.refresh(user)
        
        return {
            "id": user.id,
            "userId": user.id,
            "name": user.name,
            "email": user.email,
            "balance": user.balance,
            "is_active": user.is_active,
            "role": user.role,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"사용자 정보 업데이트 중 오류 발생: {str(e)}")

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

@router.post("/download-program", response_model=StandardResponse)
async def download_program_with_balance_deduction(
    request: ProgramDownloadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """프로그램 다운로드 시 예치금 차감 (일반 사용자용)"""
    try:
        logger.info(f"프로그램 다운로드 요청: user_id={current_user.id}, program_id={request.program_id}, license_type={request.license_type}")
        
        # 1. 프로그램 다운로드 권한 확인 (UserProgram 테이블 대신 사용자 필드 확인)
        logger.info(f"사용자 권한 확인: user_id={current_user.id}, programPermissions={current_user.program_permissions_free}, {current_user.program_permissions_month1}, {current_user.program_permissions_month3}")
        
        # license_type에 따른 권한 확인
        has_permission = False
        if request.license_type == 'free':
            has_permission = current_user.program_permissions_free or False
        elif request.license_type == 'month1':
            has_permission = current_user.program_permissions_month1 or False
        elif request.license_type == 'month3':
            has_permission = current_user.program_permissions_month3 or False
        
        if not has_permission:
            logger.warning(f"다운로드 권한 없음: user_id={current_user.id}, program_id={request.program_id}, license_type={request.license_type}, has_permission={has_permission}")
            raise HTTPException(status_code=403, detail="프로그램 다운로드 권한이 없습니다")
        
        logger.info(f"다운로드 권한 확인됨: user_id={current_user.id}, program_id={request.program_id}, license_type={request.license_type}")
        
        # 2. 프로그램 정보 확인 (실제 데이터베이스 조회)
        program = None
        
        # license_type에 따른 프로그램 ID 결정 (실제 데이터베이스 ID 사용)
        if request.program_id == 'qcapture':
            if request.license_type == 'free':
                program_id = 'free'  # 실제 데이터베이스 ID
            elif request.license_type == 'month1':
                program_id = 'month1'  # 실제 데이터베이스 ID
            elif request.license_type == 'month3':
                program_id = 'month3'  # 실제 데이터베이스 ID
            else:
                raise HTTPException(status_code=400, detail="유효하지 않은 라이센스 타입입니다")
        else:
            program_id = request.program_id
        
        # 데이터베이스에서 프로그램 조회
        program = db.query(Program).filter(Program.id == program_id).first()
        if not program:
            logger.error(f"프로그램을 찾을 수 없음: program_id={program_id}, license_type={request.license_type}")
            raise HTTPException(status_code=404, detail=f"프로그램을 찾을 수 없습니다 (ID: {program_id})")
        
        logger.info(f"프로그램 조회 성공: program_id={program_id}, name={program.name}")
        
        # 3. 다운로드 횟수 제한 확인 (새로 추가)
        user_program = db.query(UserProgram).filter(
            UserProgram.user_id == current_user.id,
            UserProgram.program_id == request.program_id
        ).first()
        
        # 다운로드 횟수 제한 설정 (개발용으로 늘림)
        MAX_DOWNLOADS = 100  # 최대 100회 다운로드 허용 (개발용)
        
        if user_program and user_program.download_count >= MAX_DOWNLOADS:
            logger.warning(f"다운로드 횟수 초과: user_id={current_user.id}, program_id={request.program_id}, current_count={user_program.download_count}, max_allowed={MAX_DOWNLOADS}")
            raise HTTPException(status_code=429, detail=f"다운로드 횟수 제한에 도달했습니다. 최대 {MAX_DOWNLOADS}회까지 다운로드 가능합니다.")
        
        # 4. 예치금 차감 (무료 프로그램은 차감하지 않음)
        amount_to_deduct = 0
        if request.license_type == 'month1':
            # 프론트엔드에서 전송한 가격 사용
            if request.prices and 'month1' in request.prices:
                amount_to_deduct = request.prices['month1']
            else:
                amount_to_deduct = 5000  # 기본값
        elif request.license_type == 'month3':
            # 프론트엔드에서 전송한 가격 사용
            if request.prices and 'month3' in request.prices:
                amount_to_deduct = request.prices['month3']
            else:
                amount_to_deduct = 12000  # 기본값
        elif request.license_type == 'free':
            amount_to_deduct = 0  # 무료: 차감 없음
        
        if amount_to_deduct > 0:
            if current_user.balance < amount_to_deduct:
                logger.warning(f"예치금 부족: user_id={current_user.id}, balance={current_user.balance}, required={amount_to_deduct}")
                raise HTTPException(status_code=400, detail=f"예치금이 부족합니다. 필요: {amount_to_deduct:,}원, 보유: {current_user.balance:,}원")
            
            # 예치금 차감
            old_balance = current_user.balance
            current_user.balance -= amount_to_deduct
            
            # 거래 내역 기록
            transaction = Transaction.create_withdraw_transaction(
                current_user, 
                amount_to_deduct, 
                f"download_{request.program_id}_{request.license_type}_{uuid.uuid4()}", 
                f"프로그램 다운로드: {program.name} ({request.license_type})"
            )
            db.add(transaction)
            
            logger.info(f"예치금 차감 완료: user_id={current_user.id}, amount={amount_to_deduct}, balance={old_balance}->{current_user.balance}")
        
        # 5. 다운로드 횟수 증가 및 사용자 프로그램 기록 업데이트
        if program:
            program.download_count += 1
        
        # UserProgram 테이블 업데이트 (다운로드 횟수 추적)
        if user_program:
            user_program.download_count += 1
            user_program.last_downloaded = datetime.now()
        else:
            # 새로운 사용자 프로그램 기록 생성
            user_program = UserProgram(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                program_id=request.program_id,
                is_allowed=True,
                download_count=1,
                last_downloaded=datetime.now()
            )
            db.add(user_program)
        
        db.commit()
        
        logger.info(f"프로그램 다운로드 성공: user_id={current_user.id}, program_id={request.program_id}, license_type={request.license_type}, download_count={user_program.download_count if user_program else 1}")
        
        return StandardResponse(
            success=True,
            message="프로그램 다운로드가 성공적으로 처리되었습니다",
            data={
                "user_id": current_user.id,
                "program_id": request.program_id,
                "license_type": request.license_type,
                "amount_deducted": amount_to_deduct,
                "remaining_balance": current_user.balance,
                "download_count": user_program.download_count if user_program else 1,
                "max_downloads": MAX_DOWNLOADS,
                "downloads_remaining": MAX_DOWNLOADS - (user_program.download_count if user_program else 1),
                "download_url": f"/downloads/{request.program_id}/{request.license_type}/"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"프로그램 다운로드 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"프로그램 다운로드 중 오류 발생: {str(e)}")
