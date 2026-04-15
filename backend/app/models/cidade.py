from sqlalchemy import Column, Integer, String, Boolean
from app.models.base import Base

class Cidade(Base):
    __tablename__ = "cidade"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True, nullable=False)
    uf = Column(String, index=True, nullable=False)
    codigo_ibge = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)
