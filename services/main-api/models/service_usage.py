from sqlalchemy import Column, String, Integer, DateTime, Float, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ServiceUsage(Base):
    __tablename__ = "service_usages"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    service_type = Column(String, nullable=False)  # qname, qtext, qcapture
    item_count = Column(Integer, default=0)  # 처리한 항목 수
    unit_price = Column(Float, nullable=False)  # 항목당 가격
    total_amount = Column(Float, nullable=False)  # 총 금액
    usage_date = Column(DateTime, default=func.now())
    details = Column(JSON)  # 추가 세부 정보 (JSON 형식)
    
    # 관계 설정
    user = relationship("User", back_populates="service_usages")
    job = relationship("Job")
    
    @staticmethod
    def create_from_job(job, unit_price, details=None):
        """작업 정보로부터 서비스 사용 내역 생성"""
        total_amount = job.item_count * unit_price
        
        return ServiceUsage(
            user_id=job.user_id,
            job_id=job.id,
            service_type=job.service_type,
            item_count=job.item_count,
            unit_price=unit_price,
            total_amount=total_amount,
            details=details or {}
        )