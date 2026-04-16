from sqlalchemy import Column, Integer, String, Boolean, DateTime, CHAR, TIMESTAMP
from sqlalchemy.sql import func
from backend.app.models.base import Base

class Banco(Base):
    __tablename__ = "banco"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(4), nullable=True)
    nome = Column(String(20), nullable=False)
    razaosocial = Column(String(50), nullable=True)
    endereco = Column(String(100), nullable=True)
    cep = Column(String(9), nullable=True)
    cidade = Column(String(60), nullable=True)
    uf = Column(CHAR(2), nullable=True)
    contato = Column(String(20), nullable=True)
    fone = Column(String(17), nullable=True)
    cnpj = Column(String(18), nullable=True)
    ativo = Column(Boolean, default=True)
    userlan = Column(String(20), nullable=True)
    datalan = Column(TIMESTAMP, server_default=func.now())
