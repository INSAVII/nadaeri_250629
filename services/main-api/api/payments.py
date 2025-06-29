from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import uuid

from database import get_db
from models.user import User
from models.payment import Payment
from models.transaction import Transaction, TransactionType
from api.auth import get_current_active_user, get_current_admin_user

router = APIRouter()

# 요청/응답 모델
class PaymentBase(BaseModel):
    amount: float
    payment_method: str
    description: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: str
    user_id: str
    status: str
    transaction_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

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

class DepositRequest(BaseModel):
    amount: float
    depositor_name: str = None
    reference_code: str = None

# API 엔드포인트
@router.post("/request-deposit", response_model=Dict)
async def request_deposit(
    deposit_request: DepositRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """사용자가 예치금 충전을 요청합니다."""
    # 입금 참조 코드 생성 (사용자 식별 + 무작위 숫자)
    reference_code = f"{current_user.email.split('@')[0]}-{uuid.uuid4().hex[:6]}"
    
    # 결제 기록 생성
    payment = Payment(
        user_id=current_user.id,
        amount=deposit_request.amount,
        status="pending",  # 대기중 상태로 설정
        payment_method="bank_transfer",
        transaction_id=f"REQ-{uuid.uuid4()}",
        description=f"예치금 충전 요청: {deposit_request.amount}원",
        depositor_name=deposit_request.depositor_name or current_user.name,
        reference_code=deposit_request.reference_code or reference_code
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return {
        "payment_id": payment.id,
        "amount": payment.amount,
        "status": payment.status,
        "reference_code": payment.reference_code or reference_code,
        "created_at": payment.created_at,
        "bank_info": {
            "bank_name": "신한은행",
            "account_number": "123-456-789012",
            "account_holder": "(주)큐클릭"
        }
    }

@router.get("/history", response_model=List[PaymentResponse])
async def get_payment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """사용자 결제 내역 조회"""
    payments = db.query(Payment).filter(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()).all()
    return payments

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
        description=balance_update.description or f"관리자 잔액 조정: {amount}원 " + 
            ("입금" if amount >= 0 else "출금")
    )
    
    # 사용자 잔액 업데이트
    user.balance += amount
    
    # 입금인 경우 결제 기록 생성
    if transaction_type == TransactionType.DEPOSIT and amount > 0:
        payment = Payment(
            user_id=user.id,
            amount=abs(amount),
            status="completed",
            payment_method="bank_transfer",
            transaction_id=transaction.reference_id,
            description=transaction.description
        )
        db.add(payment)
    
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

@router.post("/admin/confirm/{payment_id}", response_model=BalanceResponse)
async def admin_confirm_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """무통장 입금 확인 및 예치금 추가 (관리자 전용)"""
    # 결제 정보 확인
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="결제 정보를 찾을 수 없습니다")
    
    if payment.status == "completed":
        raise HTTPException(status_code=400, detail="이미 처리된 결제입니다")
    
    # 사용자 확인
    user = db.query(User).filter(User.id == payment.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    # 잔액 업데이트
    old_balance = user.balance
    
    # 트랜잭션 생성
    transaction = Transaction(
        user_id=user.id,
        amount=payment.amount,
        balance_after=user.balance + payment.amount,
        transaction_type=TransactionType.DEPOSIT,
        reference_id=payment.id,
        description=payment.description or f"{payment.amount} 원 무통장 입금 확인"
    )
    
    # 사용자 잔액 업데이트
    user.balance += payment.amount
    
    # 결제 상태 업데이트
    payment.status = "completed"
    
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

@router.get("/admin/transactions/{user_id}", response_model=List[Dict])
async def get_user_transactions(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """특정 사용자의 모든 트랜잭션 내역 조회 (관리자 전용)"""
    # 사용자 존재 확인
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    # 트랜잭션 조회
    transactions = db.query(Transaction)\
        .filter(Transaction.user_id == user_id)\
        .order_by(Transaction.created_at.desc())\
        .all()
    
    result = []
    for tx in transactions:
        result.append({
            "id": tx.id,
            "amount": tx.amount,
            "balance_after": tx.balance_after,
            "transaction_type": tx.transaction_type,
            "reference_id": tx.reference_id,
            "description": tx.description,
            "created_at": tx.created_at
        })
    
    return result

@router.get("/deposit-requests", response_model=List[Dict])
async def get_deposit_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """사용자 자신의 예치금 충전 요청 목록을 조회합니다."""
    requests = db.query(Payment)\
        .filter(Payment.user_id == current_user.id, 
                Payment.payment_method == "bank_transfer")\
        .order_by(Payment.created_at.desc())\
        .all()
    
    result = []
    for req in requests:
        result.append({
            "id": req.id,
            "amount": req.amount,
            "status": req.status,
            "reference_code": req.reference_code,
            "depositor_name": req.depositor_name,
            "created_at": req.created_at,
            "updated_at": req.updated_at
        })
    
    return result

@router.get("/admin/deposit-requests", response_model=List[Dict])
async def admin_get_deposit_requests(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """모든 사용자의 예치금 충전 요청을 조회합니다 (관리자 전용)"""
    query = db.query(Payment).filter(Payment.payment_method == "bank_transfer")
    
    if status:
        query = query.filter(Payment.status == status)
    
    requests = query.order_by(Payment.created_at.desc()).all()
    
    result = []
    for req in requests:
        # 사용자 정보 조회
        user = db.query(User).filter(User.id == req.user_id).first()
        
        result.append({
            "id": req.id,
            "user_id": req.user_id,
            "user_email": user.email if user else "Unknown",
            "user_name": user.name if user else "Unknown",
            "amount": req.amount,
            "status": req.status,
            "reference_code": req.reference_code,
            "depositor_name": req.depositor_name,
            "created_at": req.created_at,
            "updated_at": req.updated_at
        })
    
    return result

@router.post("/admin/confirm-deposit/{payment_id}", response_model=Dict)
async def admin_confirm_deposit(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """관리자가 예치금 충전 요청을 확인하고 승인합니다 (관리자 전용)"""
    # 결제 정보 확인
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="충전 요청을 찾을 수 없습니다")
    
    if payment.status == "completed":
        raise HTTPException(status_code=400, detail="이미 처리된 충전 요청입니다")
    
    # 사용자 확인
    user = db.query(User).filter(User.id == payment.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    # 잔액 업데이트
    old_balance = user.balance
    
    # 트랜잭션 생성
    transaction = Transaction(
        user_id=user.id,
        amount=payment.amount,
        balance_after=user.balance + payment.amount,
        transaction_type=TransactionType.DEPOSIT,
        reference_id=payment.id,
        description=f"예치금 충전 확인: {payment.amount}원 (입금자: {payment.depositor_name or '미상'})"
    )
    
    # 사용자 잔액 업데이트
    user.balance += payment.amount
    
    # 결제 상태 업데이트
    payment.status = "completed"
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return {
        "user_id": user.id,
        "user_email": user.email,
        "old_balance": old_balance,
        "new_balance": user.balance,
        "amount": payment.amount,
        "transaction_id": transaction.id,
        "description": transaction.description
    }