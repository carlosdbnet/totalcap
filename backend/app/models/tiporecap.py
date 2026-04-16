from sqlalchemy import Column, Integer, String, Boolean
from backend.app.models.base import Base

class TipoRecapagem(Base):
    __tablename__ = "tiporecap"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, index=True, nullable=False)
    descricao = Column(String, index=True, nullable=False)
    ativo = Column(Boolean, default=True)
