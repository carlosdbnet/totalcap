from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.models.base import Base

class Servico(Base):
    __tablename__ = "servico"

    id = Column(Integer, primary_key=True, index=True)
    codservico = Column(String, index=True, nullable=True)
    descricao = Column(String, index=True, nullable=False)
    piso = Column(String, nullable=True)
    
    id_medida = Column(Integer, ForeignKey("medida.id"), nullable=True)
    id_desenho = Column(Integer, ForeignKey("desenho.id"), nullable=True)
    id_marca = Column(Integer, ForeignKey("marca.id"), nullable=True)
    id_recap = Column(Integer, ForeignKey("tiporecap.id"), nullable=True)

    ativo = Column(Boolean, default=True)

    # Relationships
    medida = relationship("Medida")
    desenho = relationship("Desenho")
    marca = relationship("Marca")
    recap = relationship("TipoRecapagem")
