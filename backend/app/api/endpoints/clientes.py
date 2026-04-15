from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from database import get_db
from app.schemas.cliente import ClienteResponse, ClienteCreate, ClienteUpdate
from app.services.cliente import cliente_service

router = APIRouter()

@router.get("/", response_model=list[ClienteResponse])
def read_clientes(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return cliente_service.get_clientes(db, skip=skip, limit=limit)

@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
def create_cliente(
    *,
    db: Session = Depends(get_db),
    cliente_in: ClienteCreate,
) -> Any:
    return cliente_service.create_cliente(db, cliente_in=cliente_in)

@router.put("/{cliente_id}", response_model=ClienteResponse)
def update_cliente(
    *,
    db: Session = Depends(get_db),
    cliente_id: int,
    cliente_in: ClienteUpdate,
) -> Any:
    return cliente_service.update_cliente(db, cliente_id=cliente_id, cliente_in=cliente_in)
