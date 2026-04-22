from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric
from backend.app.models.base import Base

class PlanoPag(Base):
    __tablename__ = "planopag"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(Integer, nullable=True)
    formapag = Column(String, nullable=True)
    numparc = Column(Integer, default=1)
    acrescimo = Column(Numeric(10, 2), default=0.00)
    desconto = Column(Numeric(10, 2), default=0.00)
    ativo = Column(Boolean, default=True)
    userlan = Column(String, nullable=True)
    datalan = Column(DateTime, nullable=True)
