from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from backend.app.models.base import Base

class Falha(Base):
    __tablename__ = "falha"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(Integer, nullable=False)
    descricao = Column(String(50), nullable=True)
    observacao = Column(String(250), nullable=True)
    msg_email = Column(String(250), nullable=True)
    ativo = Column(Boolean, default=True)
    userlan = Column(String(20), nullable=True)
    datalan = Column(DateTime(timezone=True), server_default=func.now())
