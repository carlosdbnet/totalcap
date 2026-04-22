from sqlalchemy import Column, Integer, String, Boolean, DateTime
from backend.app.models.base import Base

class GrupoProduto(Base):
    __tablename__ = "grupo_produto"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, index=True, nullable=True)
    descricao = Column(String, index=True, nullable=False)
    ativo = Column(Boolean, default=True)
    userlan = Column(String, nullable=True)
    datalan = Column(DateTime, nullable=True)
