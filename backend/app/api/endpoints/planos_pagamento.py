from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.app.models.planopag import PlanoPag
from backend.app.schemas.planopag import PlanoPagResponse

router = APIRouter()

@router.get("/", response_model=List[PlanoPagResponse])
def read_planos_pagamento(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    planos = db.query(PlanoPag).filter(PlanoPag.ativo == True).offset(skip).limit(limit).all()
    return planos
