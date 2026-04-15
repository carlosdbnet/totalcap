from sqlalchemy import Column, Integer, String, Boolean
from app.models.base import Base

class Marca(Base):
    __tablename__ = "marca"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, index=True, nullable=True)
    descricao = Column(String, index=True, nullable=False)
    ativo = Column(Boolean, default=True)
