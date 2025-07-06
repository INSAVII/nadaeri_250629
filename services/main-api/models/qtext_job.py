from sqlalchemy import Column, String, Integer, DateTime, Float, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class QTextJob(Base):
    __tablename__ = "qtext_jobs"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    file_count = Column(Integer, nullable=False, default=0)
    unit_price = Column(Float, nullable=False, default=30.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    status = Column(String, nullable=False, default="processing")  # processing, completed, failed, cancelled
    original_files = Column(Text, nullable=True)  # 원본 파일명들 (JSON)
    processed_files = Column(Text, nullable=True)  # 처리된 파일명들 (JSON)
    result_file_path = Column(String, nullable=True)  # 결과 ZIP 파일 경로
    error_message = Column(Text, nullable=True)  # 오류 메시지
    processing_started_at = Column(DateTime, nullable=True)
    processing_completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="qtext_jobs")
    
    @staticmethod
    def create_job(user_id: str, file_count: int, unit_price: float):
        """새로운 QText 작업 생성"""
        total_amount = file_count * unit_price
        
        return QTextJob(
            user_id=user_id,
            file_count=file_count,
            unit_price=unit_price,
            total_amount=total_amount,
            status="processing",
            processing_started_at=func.now()
        )
    
    def mark_completed(self, result_file_path: str, processed_files: list):
        """작업 완료 처리"""
        self.status = "completed"
        self.result_file_path = result_file_path
        self.processed_files = str(processed_files) if processed_files else None
        self.processing_completed_at = func.now()
    
    def mark_failed(self, error_message: str):
        """작업 실패 처리"""
        self.status = "failed"
        self.error_message = error_message
        self.processing_completed_at = func.now()
    
    def mark_cancelled(self):
        """작업 취소 처리"""
        self.status = "cancelled"
        self.processing_completed_at = func.now() 