from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class Operador(Base):
    __tablename__ = "operador"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, index=True, nullable=True)
    nome = Column(String, index=True, nullable=False)
    cargo = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)
    
    id_setor = Column(Integer, ForeignKey("setor.id"), nullable=True)
    id_depto = Column(Integer, ForeignKey("departamento.id"), nullable=True)
    
    # Technical fields found in DB
    qmeta = Column(Integer, nullable=True)
    valor = Column(Numeric, nullable=True)

    # Relationships
    setor = relationship("Setor")
    departamento = relationship("Departamento")
