from sqlalchemy import Column, String, Integer, DateTime, Float, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    service_type = Column(String, nullable=False)  # qname, qtext, qcapture
    status = Column(String, default="pending")  # pending, processing, completed, failed
    file_path = Column(String)  # 원본 파일 경로
    result_path = Column(String)  # 결과 파일 경로
    options = Column(JSON)  # 작업 옵션 (JSON 형식)
    progress = Column(Float, default=0)  # 진행률 (0-100%)
    error_message = Column(String)  # 오류 메시지 (실패 시)
    start_time = Column(DateTime)  # 작업 시작 시간
    end_time = Column(DateTime)  # 작업 완료 시간
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # 작업 크기 관련 (과금 계산용)
    item_count = Column(Integer, default=0)  # 처리 항목 수 (행 수, 이미지 수 등)
    charged_amount = Column(Float, default=0)  # 청구 금액
    
    # 관계 설정
    user = relationship("User", back_populates="jobs")
    
    @property
    def is_completed(self):
        return self.status == "completed"
    
    @property
    def is_failed(self):
        return self.status == "failed"
    
    @property
    def is_in_progress(self):
        return self.status in ["pending", "processing"]
    
    @property
    def duration(self):
        """작업 소요 시간 계산 (초 단위)"""
        if not self.start_time:
            return 0
            
        end = self.end_time if self.end_time else func.now()
        return (end - self.start_time).total_seconds()