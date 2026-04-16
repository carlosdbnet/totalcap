from sqlalchemy import Column, Integer, String, Boolean
from backend.app.models.base import Base

class Setor(Base):
    __tablename__ = "setor"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, index=True, nullable=True)
    descricao = Column(String, index=True, nullable=False)
    sequencia = Column(Integer, nullable=True)
    tempomedio = Column(Integer, nullable=True)
    tempominimo = Column(Integer, nullable=True)
    qmeta = Column(Integer, nullable=True)
    proxsetor = Column(String, nullable=True)
    sopassagem = Column(Boolean, default=False)
    avaliacao = Column(Boolean, default=False)
    falha = Column(Boolean, default=False)
    consumomp = Column(Boolean, default=False)
    faturamento = Column(Boolean, default=False)
    expedicao = Column(Boolean, default=False)
    supervisao = Column(Boolean, default=False)
    ativo = Column(Boolean, default=True)
