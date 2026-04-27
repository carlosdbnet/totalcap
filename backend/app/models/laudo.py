from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, Text, ForeignKey, CHAR, LargeBinary
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class Laudo(Base):
    __tablename__ = "laudo"

    id = Column(Integer, primary_key=True, index=True)
    id_empresa = Column(Integer, default=1, nullable=False)
    id_pneu = Column(Integer, nullable=False)
    id_contato = Column(Integer, nullable=False)
    id_medida = Column(Integer, nullable=False)
    id_desenho = Column(Integer, nullable=False)
    id_recap = Column(Integer, nullable=False)
    
    numlaudo = Column(Integer, nullable=False)
    datasol = Column(DateTime, nullable=False, server_default=func.now())
    numos = Column(Integer, nullable=False)
    
    numserie = Column(String(20), nullable=True)
    numfogo = Column(String(10), nullable=True)
    dot = Column(String(15), nullable=True)
    desenhoriginal = Column(String(6), nullable=True)
    piso = Column(String(10), nullable=True)
    
    vrservico = Column(Numeric(10, 2), default=0.00)
    borracha = Column(CHAR(2), nullable=True)
    carcaca = Column(CHAR(1), nullable=True)
    qreforma = Column(Integer, default=0)
    placa = Column(String(9), nullable=True)
    uso = Column(String(5), nullable=True)
    garantia = Column(String(1), nullable=True)
    codresp = Column(String(5), nullable=True)
    estado = Column(CHAR(1), nullable=True)
    defeito = Column(String(4), nullable=True)
    causa = Column(String(4), nullable=True)
    
    dataprod = Column(DateTime, nullable=True)
    dataexa = Column(DateTime, nullable=True)
    respgara = Column(String(5), nullable=True)
    laudo = Column(String(1), nullable=True)
    motivo = Column(CHAR(4), nullable=True)
    tiporepo = Column(CHAR(1), nullable=True)
    
    percdesg = Column(Numeric, default=0.00)
    percrepo = Column(Numeric, default=0.00)
    percrefor = Column(Numeric, default=0.00)
    servrepo = Column(CHAR(3), nullable=True)
    
    vrcredito = Column(Numeric, default=0.00)
    vrpago = Column(Numeric, default=0.00)
    vrsaldo = Column(Numeric, default=0.00)
    vrestornocomissao = Column(Numeric(15, 2), default=0.00)
    
    notarep = Column(Integer, nullable=True)
    statrep = Column(CHAR(1), nullable=True)
    datarep = Column(DateTime, nullable=True)
    qremanescente = Column(Numeric(15, 2), default=0.00)
    
    alegacao = Column(LargeBinary, nullable=True)
    examinador = Column(String(30), nullable=True)
    laudofab = Column(Integer, default=0, nullable=False)
    profundidade = Column(Numeric(15, 2), default=0.00)
    serienf = Column(CHAR(3), nullable=True)
    numnota = Column(Integer, default=0, nullable=False)
    datafat = Column(DateTime, nullable=True)
    userexa = Column(CHAR(10), nullable=True)
    dataresul = Column(DateTime, nullable=True)
    
    obs = Column(Text, nullable=True)
    obs2 = Column(Text, nullable=True)
    status = Column(CHAR(1), default='A')
    
    userlan = Column(String(20), nullable=True)
    datalan = Column(DateTime, server_default=func.now())
