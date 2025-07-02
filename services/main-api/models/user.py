from sqlalchemy import Boolean, Column, String, Integer, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from passlib.context import CryptContext
from database import Base

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)  # userId가 직접 id로 저장됨
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    balance = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="user")  # 'user' 또는 'admin'
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    phone = Column(String, nullable=True)
    region = Column(String, nullable=True)
    age = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    work_type = Column(String, nullable=True)
    has_business = Column(Boolean, default=False)
    business_number = Column(String, nullable=True)
    
    # 활성화된 관계 설정
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    user_programs = relationship("UserProgram", back_populates="user", cascade="all, delete-orphan")
    programs = relationship("Program", back_populates="creator")
    service_usages = relationship("ServiceUsage", back_populates="user", cascade="all, delete-orphan")
    
    @property
    def is_admin(self):
        return self.role == "admin"
    
    def verify_password(self, plain_password):
        return pwd_context.verify(plain_password, self.hashed_password)
    
    @staticmethod
    def get_password_hash(password):
        return pwd_context.hash(password)
    
    def update_balance(self, amount: float, db_session=None):
        """잔액 업데이트 (트랜잭션과 함께 사용)"""
        self.balance += amount
        self.updated_at = func.now()
        
        if db_session:
            db_session.add(self)
            db_session.commit()
        
        return self.balance
    
    def to_dict(self):
        """사용자 정보를 딕셔너리로 변환"""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "balance": self.balance,
            "is_active": self.is_active,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "phone": self.phone,
            "region": self.region,
            "age": self.age,
            "gender": self.gender,
            "work_type": self.work_type,
            "has_business": self.has_business,
            "business_number": self.business_number
        }