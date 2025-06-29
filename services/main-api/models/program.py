from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json

from database import Base

# SQLAlchemy 모델
class Program(Base):
    __tablename__ = "programs"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True, default=0)
    version = Column(String(20), nullable=True)
    type = Column(String(20), nullable=False)  # qname, qtext, qcapture
    license_type = Column(String(20), default="free")  # free, month1, month3
    price = Column(Float, default=0.0)
    download_count = Column(Integer, default=0)
    icon_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)  # 일반 사용자 페이지에 표시 여부
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)
    created_by = Column(String(50), ForeignKey("users.id"), nullable=True)

    # 관계
    creator = relationship("User", back_populates="programs")
    user_programs = relationship("UserProgram", back_populates="program")

# 사용자와 프로그램 간의 관계를 나타내는 모델
class UserProgram(Base):
    __tablename__ = "user_programs"

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    program_id = Column(String(50), ForeignKey("programs.id"), nullable=False)
    is_allowed = Column(Boolean, default=True)
    download_count = Column(Integer, default=0)  # 다운로드 횟수 추가
    last_downloaded = Column(DateTime, nullable=True)  # 마지막 다운로드 시간 추가
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    
    # 관계
    user = relationship("User", back_populates="user_programs")
    program = relationship("Program", back_populates="user_programs")

# Pydantic 모델 (API 응답용)
class ProgramResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    version: Optional[str] = None
    type: str
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    license_type: str = "free"
    price: float = 0.0
    download_count: int = 0
    icon_url: Optional[str] = None
    is_active: bool = True
    is_public: Optional[bool] = False
    created_at: str  # datetime을 문자열로 처리
    updated_at: Optional[str] = None  # datetime을 문자열로 처리
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm(cls, obj):
        # SQLAlchemy 모델을 Pydantic 모델로 변환하며 날짜를 문자열로 변환
        data = {}
        for key, value in obj.__dict__.items():
            if key == "_sa_instance_state":
                continue
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            else:
                data[key] = value
        return cls(**data)

class ProgramUserResponse(ProgramResponse):
    is_allowed: bool
    
    class Config:
        from_attributes = True