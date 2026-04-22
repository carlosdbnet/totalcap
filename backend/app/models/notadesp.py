from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class Notadesp(Base):
    __tablename__ = "notadesp"

    id = Column(Integer, primary_key=True, index=True)
    id_contato = Column(Integer, ForeignKey("contato.id"), nullable=True)
    dataemi = Column(DateTime)
    cpfcnpj = Column(String(18), nullable=True)
    nome = Column(String(100), nullable=True)
    vtotal = Column(Numeric(10, 2), default=0.00)
    id_vendedor = Column(Integer, ForeignKey("vendedor.id"), nullable=False)
    datalan = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(3), default="")

    # Relacionamentos
    contato = relationship("Contato")
    vendedor = relationship("Vendedor")
    itens = relationship("NotadespItem", back_populates="nota", cascade="all, delete-orphan")
