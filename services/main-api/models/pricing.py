from sqlalchemy import Column, String, Integer, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class PricingPolicy(Base):
    __tablename__ = "pricing_policies"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    service_type = Column(String, nullable=False)  # qname, qtext, qcapture
    name = Column(String, nullable=False)  # 정책 이름
    base_price = Column(Float, default=0)  # 기본 가격
    unit_price = Column(Float, nullable=False)  # 단위 가격 (항목당)
    min_count = Column(Integer, default=1)  # 최소 수량
    max_count = Column(Integer, default=None)  # 최대 수량 (None은 제한 없음)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    def calculate_price(self, item_count):
        """항목 수에 따른 가격 계산"""
        if item_count < self.min_count:
            return 0
            
        if self.max_count and item_count > self.max_count:
            return 0
            
        return self.base_price + (item_count * self.unit_price)