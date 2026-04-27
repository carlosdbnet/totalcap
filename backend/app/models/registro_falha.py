from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class RegistroFalha(Base):
    __tablename__ = "registro_falha"

    id = Column(Integer, primary_key=True, index=True)
    id_setor = Column(Integer, ForeignKey("setor.id"), nullable=False)
    id_operador = Column(Integer, ForeignKey("operador.id"), nullable=False)
    id_falha = Column(Integer, ForeignKey("falha.id"), nullable=False)
    id_pneu = Column(Integer, ForeignKey("pneu.id"), nullable=True)
    
    data = Column(DateTime(timezone=True), server_default=func.now())
    obs = Column(Text, nullable=True)
    
    # Relacionamentos
    setor = relationship("Setor")
    operador = relationship("Operador")
    falha = relationship("Falha")
    pneu = relationship("OSPneu")
