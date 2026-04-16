from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any
from database import get_db
from app.schemas.empresa import EmpresaResponse, EmpresaCreate, EmpresaUpdate
from app.services.empresa import empresa_service

router = APIRouter()

@router.get("/", response_model=list[EmpresaResponse])
def read_empresas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return empresa_service.get_empresas(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=EmpresaResponse)
def read_empresa(
    id: int,
    db: Session = Depends(get_db),
) -> Any:
    return empresa_service.get_empresa(db, id=id)

@router.post("/", response_model=EmpresaResponse, status_code=status.HTTP_201_CREATED)
def create_empresa(
    *,
    db: Session = Depends(get_db),
    empresa_in: EmpresaCreate,
) -> Any:
    return empresa_service.create_empresa(db, empresa_in=empresa_in)

@router.put("/{empresa_id}", response_model=EmpresaResponse)
def update_empresa(
    *,
    db: Session = Depends(get_db),
    empresa_id: int,
    empresa_in: EmpresaUpdate,
) -> Any:
    return empresa_service.update_empresa(db, empresa_id=empresa_id, empresa_in=empresa_in)

@router.delete("/{empresa_id}", response_model=EmpresaResponse)
def delete_empresa(
    *,
    db: Session = Depends(get_db),
    empresa_id: int,
) -> Any:
    return empresa_service.delete_empresa(db, empresa_id=empresa_id)
