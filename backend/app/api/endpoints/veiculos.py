from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.api import deps
from backend.app.models.veiculo import Veiculo
from backend.app.schemas import veiculo as schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.Veiculo])
def read_veiculos(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100
):
    print("DEBUG: Lendo veículos...")
    veiculos = db.query(Veiculo).offset(skip).limit(limit).all()
    print(f"DEBUG: Encontrados {len(veiculos)} veículos")
    return veiculos

@router.get("/{id}", response_model=schemas.Veiculo)
def read_veiculo(id: int, db: Session = Depends(deps.get_db)):
    veiculo = db.query(Veiculo).filter(Veiculo.id == id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    return veiculo

@router.post("/", response_model=schemas.Veiculo)
def create_veiculo(
    *,
    db: Session = Depends(deps.get_db),
    veiculo_in: schemas.VeiculoCreate
):
    db_veiculo = Veiculo(**veiculo_in.model_dump())
    db.add(db_veiculo)
    db.commit()
    db.refresh(db_veiculo)
    return db_veiculo

@router.put("/{id}", response_model=schemas.Veiculo)
def update_veiculo(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    veiculo_in: schemas.VeiculoUpdate
):
    db_veiculo = db.query(Veiculo).filter(Veiculo.id == id).first()
    if not db_veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    update_data = veiculo_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_veiculo, field, value)
    
    db.commit()
    db.refresh(db_veiculo)
    return db_veiculo

@router.delete("/{id}")
def delete_veiculo(id: int, db: Session = Depends(deps.get_db)):
    db_veiculo = db.query(Veiculo).filter(Veiculo.id == id).first()
    if not db_veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    db.delete(db_veiculo)
    db.commit()
    return {"status": "ok"}
