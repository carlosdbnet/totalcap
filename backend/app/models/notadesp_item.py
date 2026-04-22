from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, LargeBinary
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class NotadespItem(Base):
    __tablename__ = "notadesp_item"

    id = Column(Integer, primary_key=True, index=True)
    id_notadesp = Column("id_despesa", Integer, ForeignKey("notadesp.id"), nullable=False)
    id_vendedor = Column(Integer, ForeignKey("vendedor.id"), nullable=True)
    id_veiculo = Column(Integer, ForeignKey("veiculo.id"), nullable=True)
    
    descricao = Column(String(200), nullable=True)
    datamov = Column(DateTime)
    tipo = Column(String(10), nullable=True)
    qlitro = Column(Numeric(10, 2), default=0.00)
    vlitro = Column(Numeric(10, 2), default=0.00)
    vtotal = Column(Numeric(10, 2), default=0.00)
    kmanter = Column(Integer, nullable=True)
    kmatual = Column(Integer, nullable=True)
    foto = Column(LargeBinary, nullable=True)
    dados = Column(String(255), nullable=True)
    
    userlan = Column(String(20), nullable=True)
    datalan = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    nota = relationship("Notadesp", back_populates="itens")
    vendedor = relationship("Vendedor")
    veiculo = relationship("Veiculo")
