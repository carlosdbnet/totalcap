from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.models.base import Base

class Estado(Base):
    __tablename__ = "estado"

    id = Column(Integer, primary_key=True, index=True)
    uf = Column(String(2), unique=True, index=True, nullable=False)
    nome = Column(String, index=True, nullable=False)
    ativo = Column(Boolean, default=True)
    userlan = Column(String, nullable=True)
    datalan = Column(DateTime, nullable=True)
