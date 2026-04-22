from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from backend.database import get_db
from backend.app.models.ordem_servico import OSPneu
from backend.app.models.fatura import Fatura

router = APIRouter()

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """
    Retorna estatísticas para o Dashboard Geral.
    """
    # 1. Pneus em Produção (quantidade de pneus com statusfat = false)
    pneus_producao = db.query(OSPneu).filter(OSPneu.statusfat == False).count()

    # 2. Faturamento Mês Atual
    agora = datetime.now()
    faturamento_mes = db.query(func.sum(Fatura.vrtotal)).filter(
        extract('month', Fatura.datafat) == agora.month,
        extract('year', Fatura.datafat) == agora.year
    ).scalar() or 0

    return {
        "pneus_producao": pneus_producao,
        "faturamento_mes": float(faturamento_mes),
        "garantias_abertas": 3,  # Placeholder/Mock até implementação de garantias
        "capacidade_produtiva": "78%" # Placeholder/Mock
    }
