from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Board(Base):
    __tablename__ = "boards"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text)
    category = Column(String(50), default="일반")  # 메뉴얼, 공고, 일반
    author = Column(String(100), nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=True)
    is_pinned = Column(Boolean, default=False)  # 상단고정
    is_notice = Column(Boolean, default=False)  # 공지사항
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 관계 설정
    files = relationship("BoardFile", back_populates="board", cascade="all, delete-orphan")


class BoardFile(Base):
    __tablename__ = "board_files"
    
    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("boards.id"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    content_type = Column(String(100))
    upload_date = Column(DateTime, default=datetime.utcnow)
    
    # 관계 설정
    board = relationship("Board", back_populates="files")
