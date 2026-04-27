from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.models.base import Base

class Dispositivo(Base):
    __tablename__ = "credencial"

    id = Column(Integer, primary_key=True, index=True)
    android_id = Column(String, unique=True, index=True, nullable=False)
    id_setor = Column(Integer, ForeignKey("setor.id"), nullable=True)
    autorizado = Column(Boolean, default=False)
    data_solicitacao = Column(DateTime(timezone=True), server_default=func.now())
    datalan = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relacionamento
    setor = relationship("Setor")
