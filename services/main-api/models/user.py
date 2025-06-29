from sqlalchemy import Boolean, Column, String, Integer, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from passlib.context import CryptContext
from database import Base

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, unique=True, index=True, nullable=True)  # 사용자 아이디 추가
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    balance = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="user")  # 'user' 또는 'admin'
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # 관계 설정
    jobs = relationship("Job", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    user_programs = relationship("UserProgram", back_populates="user")
    programs = relationship("Program", back_populates="creator")  # 생성한 프로그램과의 관계 추가
    service_usages = relationship("ServiceUsage", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    
    @property
    def is_admin(self):
        return self.role == "admin"
    
    def verify_password(self, plain_password):
        return pwd_context.verify(plain_password, self.hashed_password)
    
    @staticmethod
    def get_password_hash(password):
        return pwd_context.hash(password)