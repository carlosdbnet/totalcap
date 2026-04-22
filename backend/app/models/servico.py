from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from backend.app.models.base import Base
from backend.app.models.produto import Produto

class Servico(Base):
    __tablename__ = "servico"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, index=True, nullable=True)
    descricao = Column(String, index=True, nullable=False)
    grupo = Column(String, nullable=True)
    
    id_medida = Column(Integer, ForeignKey("medida.id"), nullable=True)
    id_desenho = Column(Integer, ForeignKey("desenho.id"), nullable=True)
    id_produto = Column(Integer, ForeignKey("produto.id"), nullable=True)
    id_recap = Column(Integer, ForeignKey("tiporecap.id"), nullable=True)
    valor = Column(Float, default=0.0)
    ativo = Column(Boolean, default=True)

    # Relationships
    medida = relationship("Medida")
    desenho = relationship("Desenho")
    produto = relationship("Produto")
    recap = relationship("TipoRecapagem")
