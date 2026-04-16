from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.models.base import Base

class Cidade(Base):
    __tablename__ = "cidade"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True, nullable=False)
    uf = Column(String(2), index=True, nullable=False)
    codibge = Column(String(7), nullable=True)
    ativo = Column(Boolean, default=True)
    userlan = Column(String, nullable=True)
    datalan = Column(DateTime, nullable=True)
