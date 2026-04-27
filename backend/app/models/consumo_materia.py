from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class ConsumoMateria(Base):
    __tablename__ = "consumo_materia"

    id = Column(Integer, primary_key=True, index=True)
    id_produto = Column(Integer, ForeignKey("produto.id"), nullable=False)
    id_setor = Column(Integer, ForeignKey("setor.id"), nullable=True)
    id_operador = Column(Integer, ForeignKey("operador.id"), nullable=True)
    
    datamov = Column(DateTime(timezone=True), server_default=func.now())
    quant = Column(Numeric(10, 3), default=0.000)
    obs = Column(Text, nullable=True)
    
    # Relacionamentos
    produto = relationship("Produto")
    setor = relationship("Setor")
    operador = relationship("Operador")
