from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from database import get_db
from app.schemas.regiao import RegiaoResponse, RegiaoCreate, RegiaoUpdate
from app.services.regiao import regiao_service

router = APIRouter()

@router.get("/", response_model=list[RegiaoResponse])
def read_regioes(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return regiao_service.get_regioes(db, skip=skip, limit=limit)

@router.post("/", response_model=RegiaoResponse, status_code=status.HTTP_201_CREATED)
def create_regiao(
    *,
    db: Session = Depends(get_db),
    regiao_in: RegiaoCreate,
) -> Any:
    return regiao_service.create_regiao(db, regiao_in=regiao_in)

@router.put("/{regiao_id}", response_model=RegiaoResponse)
def update_regiao(
    *,
    db: Session = Depends(get_db),
    regiao_id: int,
    regiao_in: RegiaoUpdate,
) -> Any:
    return regiao_service.update_regiao(db, regiao_id=regiao_id, regiao_in=regiao_in)

@router.delete("/{regiao_id}", response_model=RegiaoResponse)
def delete_regiao(
    *,
    db: Session = Depends(get_db),
    regiao_id: int,
) -> Any:
    return regiao_service.delete_regiao(db, regiao_id=regiao_id)
