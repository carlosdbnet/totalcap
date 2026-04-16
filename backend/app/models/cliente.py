from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True, nullable=False)
    documento = Column(String, unique=True, index=True, nullable=False)  # CPF/CNPJ
    email = Column(String, nullable=True)
    telefone = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    
    id_contato = Column(Integer, ForeignKey("contato.id"), nullable=True)
    contato = relationship("Contato")
