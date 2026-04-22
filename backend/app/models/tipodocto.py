from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from backend.app.models.base import Base

class TipoDocto(Base):
    __tablename__ = "tipodocto"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(5), nullable=False)
    descricao = Column(String(30), nullable=True)
    ativo = Column(Boolean, default=True)
    userlan = Column(String(20), nullable=True)
    datalan = Column(DateTime, server_default=func.now())
