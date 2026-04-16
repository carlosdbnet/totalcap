from sqlalchemy import Column, Integer, String, Boolean
from backend.app.models.base import Base

class Medida(Base):
    __tablename__ = "medida"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, index=True, nullable=True)
    descricao = Column(String, index=True, nullable=False)
    ativo = Column(Boolean, default=True)
