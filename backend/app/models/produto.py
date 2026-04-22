from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class Produto(Base):
    __tablename__ = "produto"

    id = Column(Integer, primary_key=True, index=True)
    codprod = Column(String, index=True, nullable=False)
    id_grupo = Column(Integer, ForeignKey("grupo_produto.id"), nullable=True)
    
    grupo = relationship("GrupoProduto")
    numfab = Column(String, nullable=True)
    descricao = Column(String, index=True, nullable=True)
    unidade = Column(String, nullable=True)
    embalag = Column(String, nullable=True)
    precoven = Column(Numeric(12, 2), default=0.0)
    ativo = Column(Boolean, default=True)
    userlan = Column(String, nullable=True)
    datalan = Column(DateTime, nullable=True)
