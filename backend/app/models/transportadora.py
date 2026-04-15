from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.models.base import Base

class Transportadora(Base):
    __tablename__ = "transportadora"

    id = Column(Integer, primary_key=True, index=True)
    razao_social = Column(String, index=True, nullable=False)
    nome_fantasia = Column(String, index=True, nullable=True)
    cnpj = Column(String, unique=True, index=True, nullable=True)
    endereco = Column(String, nullable=True)
    cep = Column(String, nullable=True)
    cidade = Column(String, nullable=True)
    uf = Column(String, nullable=True)
    fone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    contato = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)
    datalan = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
