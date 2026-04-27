from sqlalchemy import Column, Integer, ForeignKey, Numeric, DateTime, String
from sqlalchemy.orm import relationship
from backend.app.models.base import Base
from sqlalchemy.sql import func

class FaturaLaudo(Base):
    __tablename__ = "fatura_laudo"

    id = Column(Integer, primary_key=True, index=True)
    id_fatura = Column(Integer, ForeignKey("fatura.id"), nullable=False)
    id_laudo = Column(Integer, ForeignKey("laudo.id"), nullable=False)
    valor = Column(Numeric(10, 2), default=0.00)
    datalan = Column(DateTime, server_default=func.now())
    userlan = Column(String(20), nullable=True)

    # Relationships
    fatura = relationship("Fatura", back_populates="laudos")
    laudo = relationship("Laudo")
