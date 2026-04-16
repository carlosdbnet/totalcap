from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.models.base import Base

class Empresa(Base):
    __tablename__ = "empresa"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True, nullable=False)
    razaosocial = Column(String, index=True)
    endereco = Column(String)
    numcasa = Column(String)
    bairro = Column(String)
    cep = Column(String)
    cidade = Column(String)
    uf = Column(String(2))
    telefone = Column(String)
    cxpostal = Column(String)
    email = Column(String)
    cnpj = Column(String, unique=True, index=True)
    inscestadual = Column(String)
    inscmunicipio = Column(String)
    token = Column(String)
    ativo = Column(Boolean, default=True)
