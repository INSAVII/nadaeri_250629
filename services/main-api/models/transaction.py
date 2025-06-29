from sqlalchemy import Column, String, Integer, DateTime, Float, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class TransactionType(str, enum.Enum):
    DEPOSIT = "deposit"  # 충전
    WITHDRAW = "withdraw"  # 출금
    SERVICE_USAGE = "service_usage"  # 서비스 사용
    REFUND = "refund"  # 환불

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)  # 거래 후 잔액
    transaction_type = Column(String, nullable=False)  # deposit, withdraw, service_usage, refund
    reference_id = Column(String)  # 관련 ID (결제 ID, 작업 ID 등)
    description = Column(String)  # 거래 설명
    created_at = Column(DateTime, default=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="transactions")
    
    @staticmethod
    def create_service_usage_transaction(user, amount, job_id, description):
        """서비스 사용에 대한 트랜잭션 생성"""
        user.balance -= amount
        return Transaction(
            user_id=user.id,
            amount=-amount,  # 마이너스 금액으로 기록
            balance_after=user.balance,
            transaction_type=TransactionType.SERVICE_USAGE,
            reference_id=job_id,
            description=description
        )
    
    @staticmethod
    def create_deposit_transaction(user, amount, payment_id, description):
        """충전에 대한 트랜잭션 생성"""
        user.balance += amount
        return Transaction(
            user_id=user.id,
            amount=amount,
            balance_after=user.balance,
            transaction_type=TransactionType.DEPOSIT,
            reference_id=payment_id,
            description=description
        )