from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from database import get_db
from app.schemas.atividade import AtividadeResponse, AtividadeCreate, AtividadeUpdate
from app.services.atividade import atividade_service

router = APIRouter()

@router.get("/", response_model=list[AtividadeResponse])
def read_atividades(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return atividade_service.get_atividades(db, skip=skip, limit=limit)

@router.post("/", response_model=AtividadeResponse, status_code=status.HTTP_201_CREATED)
def create_atividade(
    *,
    db: Session = Depends(get_db),
    atividade_in: AtividadeCreate,
) -> Any:
    return atividade_service.create_atividade(db, atividade_in=atividade_in)

@router.put("/{atividade_id}", response_model=AtividadeResponse)
def update_atividade(
    *,
    db: Session = Depends(get_db),
    atividade_id: int,
    atividade_in: AtividadeUpdate,
) -> Any:
    return atividade_service.update_atividade(db, atividade_id=atividade_id, atividade_in=atividade_in)

@router.delete("/{atividade_id}", response_model=AtividadeResponse)
def delete_atividade(
    *,
    db: Session = Depends(get_db),
    atividade_id: int,
) -> Any:
    return atividade_service.delete_atividade(db, atividade_id=atividade_id)
