from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, TIMESTAMP, CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class Apontamento(Base):
    __tablename__ = "apontamento"

    id = Column(Integer, primary_key=True, index=True)
    id_pneu = Column(Integer, ForeignKey("pneu.id"), nullable=False)
    id_setor = Column(Integer, ForeignKey("setor.id"), nullable=True)
    id_operador = Column(Integer, ForeignKey("operador.id"), nullable=True)
    id_retrabalho = Column(Integer, nullable=True)
    
    inicio = Column(TIMESTAMP, nullable=True)
    termino = Column(TIMESTAMP, nullable=True)
    tempo = Column(Numeric(10, 2), nullable=True)
    obs = Column(String(100), nullable=True)
    codbarra = Column(String(30), nullable=True)
    
    status = Column(CHAR(1), nullable=True)
    userlan = Column(String(20), nullable=True)
    datalan = Column(TIMESTAMP, server_default=func.now())

    # Relacionamentos
    pneu = relationship("OSPneu")
    setor = relationship("Setor")
    operador = relationship("Operador")
