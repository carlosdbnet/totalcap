from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Any, List
from backend.database import get_db
from backend.app.models.ordem_servico import OrdemServico as OSModel, OSPneu as PneuModel
from backend.app.schemas.ordem_servico import OrdemServicoResponse, OrdemServicoCreate, OrdemServicoUpdate

router = APIRouter()

@router.get("/", response_model=List[OrdemServicoResponse])
def read_ordens_servico(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return db.query(OSModel).options(joinedload(OSModel.pneus)).offset(skip).limit(limit).all()

@router.get("/{id}", response_model=OrdemServicoResponse)
def read_ordem_servico(
    id: int,
    db: Session = Depends(get_db),
) -> Any:
    db_obj = db.query(OSModel).options(joinedload(OSModel.pneus)).filter(OSModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada")
    return db_obj

@router.post("/", response_model=OrdemServicoResponse, status_code=status.HTTP_201_CREATED)
def create_ordem_servico(
    *,
    db: Session = Depends(get_db),
    os_in: OrdemServicoCreate,
) -> Any:
    # 1. Check if numero_os exists
    existing = db.query(OSModel).filter(OSModel.numero_os == os_in.numero_os).first()
    if existing:
        raise HTTPException(status_code=400, detail="Já existe uma OS com este número.")

    # 2. Create OS (Master)
    os_data = os_in.model_dump(exclude={'pneus'})
    db_os = OSModel(**os_data)
    db.add(db_os)
    db.flush() # Get OS ID

    # 3. Create Pneus (Details)
    for pneu_in in os_in.pneus:
        db_pneu = PneuModel(**pneu_in.model_dump(), id_os=db_os.id)
        db.add(db_pneu)

    db.commit()
    db.refresh(db_os)
    
    # Reload with pneus
    return db.query(OSModel).options(joinedload(OSModel.pneus)).filter(OSModel.id == db_os.id).first()

@router.put("/{os_id}", response_model=OrdemServicoResponse)
def update_ordem_servico(
    *,
    db: Session = Depends(get_db),
    os_id: int,
    os_in: OrdemServicoUpdate,
) -> Any:
    db_os = db.query(OSModel).filter(OSModel.id == os_id).first()
    if not db_os:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada")

    # 1. Update OS Master fields
    os_data = os_in.model_dump(exclude_unset=True, exclude={'pneus'})
    for field, value in os_data.items():
        setattr(db_os, field, value)

    # 2. Update Pneus (Details) - Synching logic
    if os_in.pneus is not None:
        # Simple sync: delete existing that are not in the update list, update existing, add new
        existing_pneus = {p.id: p for p in db_os.pneus}
        updated_pneu_ids = set()

        for pneu_in in os_in.pneus:
            if pneu_in.id and pneu_in.id in existing_pneus:
                # Update existing
                pneu_obj = existing_pneus[pneu_in.id]
                pneu_update_data = pneu_in.model_dump(exclude_unset=True, exclude={'id'})
                for f, v in pneu_update_data.items():
                    setattr(pneu_obj, f, v)
                updated_pneu_ids.add(pneu_in.id)
            else:
                # Add new
                new_pneu = PneuModel(**pneu_in.model_dump(exclude={'id'}), id_os=os_id)
                db.add(new_pneu)

        # Delete orphans (pneus that were in DB but not in our update list)
        for pid, pobj in existing_pneus.items():
            if pid not in updated_pneu_ids:
                db.delete(pobj)

    db.add(db_os)
    db.commit()
    db.refresh(db_os)
    
    # Reload with relations
    return db.query(OSModel).options(joinedload(OSModel.pneus)).filter(OSModel.id == os_id).first()

@router.delete("/{os_id}", response_model=OrdemServicoResponse)
def delete_ordem_servico(
    *,
    db: Session = Depends(get_db),
    os_id: int,
) -> Any:
    db_os = db.query(OSModel).filter(OSModel.id == os_id).first()
    if not db_os:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada")
    
    db.delete(db_os) # Cascade handles OS_pneus
    db.commit()
    return db_os
