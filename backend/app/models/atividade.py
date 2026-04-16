from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from backend.app.models.base import Base

class Atividade(Base):
    __tablename__ = "atividade"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True, nullable=False)
    descricao = Column(String, index=True, nullable=False)
    ativo = Column(Boolean, default=True)
    userlan = Column(String, nullable=True)
    datalan = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
