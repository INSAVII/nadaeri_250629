from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import uuid

from database import get_db
from models.user import User
from models.transaction import Transaction, TransactionType
from api.auth import get_current_active_user, get_current_admin_user

router = APIRouter()

# 요청/응답 모델
class BalanceUpdate(BaseModel):
    user_id: str
    amount: float
    description: Optional[str] = None
    transaction_type: str = "deposit"  # deposit 또는 withdraw

class BalanceResponse(BaseModel):
    user_id: str
    old_balance: float
    new_balance: float
    transaction_id: str
    description: str

# 사용자 예치금 잔액 조회
@router.get("/balance")
async def get_user_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """사용자 현재 예치금 잔액 조회"""
    db.refresh(current_user)  # 최신 데이터 조회를 위한 리프레시
    return {
        "user_id": current_user.id,
        "balance": current_user.balance,
        "email": current_user.email,
        "name": current_user.name
    }

# 관리자용 API
@router.get("/admin/users", response_model=List[Dict])
async def get_all_users_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """모든 사용자의 예치금 잔액 조회 (관리자 전용)"""
    users = db.query(User).all()
    result = []
    for user in users:
        result.append({
            "id": user.id,
            "email": user.email,
            "name": user.name, 
            "balance": user.balance,
            "is_active": user.is_active,
            "role": user.role,
            "created_at": user.created_at
        })
    return result

@router.post("/admin/balance", response_model=BalanceResponse)
async def admin_update_balance(
    balance_update: BalanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """관리자가 사용자 예치금 잔액 조정 (관리자 전용)"""
    # 사용자 확인
    user_id = balance_update.user_id
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    # 잔액 업데이트
    old_balance = user.balance
    amount = balance_update.amount
    # 트랜잭션 타입 결정
    transaction_type = TransactionType.DEPOSIT
    if balance_update.transaction_type == "withdraw":
        transaction_type = TransactionType.WITHDRAW
        # 출금의 경우 금액을 음수로 변환
        amount = -abs(amount)
    # 출금 시 잔액 검증
    if transaction_type == TransactionType.WITHDRAW and abs(amount) > user.balance:
        raise HTTPException(status_code=400, detail="사용자 잔액이 부족합니다")
    # 트랜잭션 생성
    transaction = Transaction(
        user_id=user.id,
        amount=amount,
        balance_after=user.balance + amount,
        transaction_type=transaction_type,
        reference_id=f"ADMIN-{uuid.uuid4()}",
        description=balance_update.description or f"관리자 잔액 조정: {amount}원 " + ("입금" if amount >= 0 else "출금")
    )
    # 사용자 잔액 업데이트
    user.balance += amount
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return {
        "user_id": user.id,
        "old_balance": old_balance,
        "new_balance": user.balance,
        "transaction_id": transaction.id,
        "description": transaction.description
    }