from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False)
    time_complexity = Column(String, nullable=False)
    space_complexity = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
