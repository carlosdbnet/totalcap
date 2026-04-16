from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from backend.database import get_db
from backend.app.schemas.vendedor import VendedorResponse, VendedorCreate, VendedorUpdate
from backend.app.services.vendedor import vendedor_service

router = APIRouter()

@router.get("/", response_model=list[VendedorResponse])
def read_vendedores(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    vendedores = vendedor_service.get_vendedores(db, skip=skip, limit=limit)
    # Mapping for the custom response with area_nome and regiao_nome
    results = []
    for v in vendedores:
        resp = VendedorResponse.model_validate(v)
        results.append(resp)
    return results

@router.post("/", response_model=VendedorResponse, status_code=status.HTTP_201_CREATED)
def create_vendedor(
    *,
    db: Session = Depends(get_db),
    vendedor_in: VendedorCreate,
) -> Any:
    vendedor = vendedor_service.create_vendedor(db, vendedor_in=vendedor_in)
    return VendedorResponse.model_validate(vendedor)

@router.put("/{vendedor_id}", response_model=VendedorResponse)
def update_vendedor(
    *,
    db: Session = Depends(get_db),
    vendedor_id: int,
    vendedor_in: VendedorUpdate,
) -> Any:
    vendedor = vendedor_service.update_vendedor(db, vendedor_id=vendedor_id, vendedor_in=vendedor_in)
    return VendedorResponse.model_validate(vendedor)

@router.delete("/{vendedor_id}", response_model=VendedorResponse)
def delete_vendedor(
    *,
    db: Session = Depends(get_db),
    vendedor_id: int,
) -> Any:
    vendedor = vendedor_service.delete_vendedor(db, vendedor_id=vendedor_id)
    return VendedorResponse.model_validate(vendedor)
