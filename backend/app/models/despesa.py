from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from backend.app.models.base import Base

class Despesa(Base):
    __tablename__ = "despesa"

    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String(50), nullable=True)
    ativo = Column(Boolean, default=True)
    userlan = Column(String(20), nullable=True)
    datalan = Column(DateTime(timezone=True), server_default=func.now())
