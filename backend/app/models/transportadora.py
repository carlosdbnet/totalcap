from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from backend.app.models.base import Base

class Transportadora(Base):
    __tablename__ = "transportadora"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, index=True, nullable=True)
    nome = Column(String, index=True, nullable=False) # Antigo razao_social
    endereco = Column(String, nullable=True)
    cep = Column(String, nullable=True)
    cidade = Column(String, nullable=True)
    uf = Column(String, nullable=True)
    fone = Column(String, nullable=True)
    fax = Column(String, nullable=True)
    cpfcnpj = Column(String, unique=True, index=True, nullable=True) # Antigo cnpj
    inscricao = Column(String, nullable=True)
    placaveic = Column(String, nullable=True)
    ufplaca = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)
    userlan = Column(String, nullable=True)
    datalan = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
