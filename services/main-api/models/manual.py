from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
import uuid
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Manual(Base):
    __tablename__ = "manuals"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    page_key = Column(String, unique=True, nullable=False)  # 'main', 'qname', 'qtext', 'qcapture'
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
