from sqlalchemy import Column, String, Integer, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending, completed, failed, refunded
    payment_method = Column(String)
    transaction_id = Column(String, unique=True)
    description = Column(String)
    depositor_name = Column(String)  # 입금자명
    reference_code = Column(String)  # 참조 코드 (식별용)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="payments")
    
    @property
    def is_completed(self):
        return self.status == "completed"
    
    @property
    def is_refunded(self):
        return self.status == "refunded"