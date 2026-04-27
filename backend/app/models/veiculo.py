from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from backend.app.models.base import Base

class Veiculo(Base):
    __tablename__ = "veiculo"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String(10), nullable=False)
    descricao = Column(String(50), nullable=True)
    codven = Column("id_vendedor", String(10), nullable=True)
    tipo = Column(String(1), nullable=True)
    comb = Column(String(10), nullable=True)
    plaqueta = Column(Integer, nullable=True)
    uf = Column(String(2), nullable=True)
    codmod = Column(String(20), nullable=True)
    renavam = Column(String(20), nullable=True)
    chassi = Column(String(20), nullable=True)
    ano = Column(String(5), nullable=True)
    alienado = Column(Boolean, default=False)
    bancofin = Column(String(50), nullable=True)
    sinistro = Column(Boolean, default=False)
    seguradora = Column(String(30), nullable=True)
    antt = Column(String(10), nullable=True)
    ativo = Column(Boolean, default=True)
    userlan = Column(String(20), nullable=True)
    datalan = Column(DateTime(timezone=True), server_default=func.now())
