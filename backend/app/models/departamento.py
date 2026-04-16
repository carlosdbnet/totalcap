from sqlalchemy import Column, Integer, String, Boolean
from backend.app.models.base import Base

class Departamento(Base):
    __tablename__ = "departamento"

    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String, index=True, nullable=False)
    ativo = Column(Boolean, default=True)
