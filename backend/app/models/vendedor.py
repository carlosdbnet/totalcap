from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.models.base import Base

class Vendedor(Base):
    __tablename__ = "vendedor"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True, nullable=True)
    apelido = Column(String, index=True, nullable=True)
    nome = Column(String, index=True, nullable=False)
    endereco = Column(String, nullable=True)
    cep = Column(String, nullable=True)
    cidade = Column(String, nullable=True)
    uf = Column(String, nullable=True)
    fone = Column(String, nullable=True)
    cpfcnpj = Column(String, nullable=True)
    cargo = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)
    id_area = Column(Integer, ForeignKey("area.id"), nullable=True)
    id_regiao = Column(Integer, ForeignKey("regiao.id"), nullable=True)
    id_vendedor_erp = Column(Integer, nullable=True)
    userlan = Column(String, nullable=True)
    datalan = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    area = relationship("Area", backref="vendedores")
    regiao = relationship("Regiao", backref="vendedores")
