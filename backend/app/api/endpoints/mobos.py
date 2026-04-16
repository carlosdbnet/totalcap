from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api import deps
from app.models.mobos import MobOS, MobPneu
from app.schemas.mobos import MobOSCreate, MobOSUpdate, MobOS as MobOSSchema
from database import get_db

router = APIRouter()

@router.get("/", response_model=List[MobOSSchema])
def read_mobos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve Coletas (MobOS).
    """
    coletas = db.query(MobOS).options(
        joinedload(MobOS.pneus),
        joinedload(MobOS.contato),
        joinedload(MobOS.vendedor)
    ).offset(skip).limit(limit).all()
    return coletas

@router.post("/", response_model=MobOSSchema, status_code=status.HTTP_201_CREATED)
def create_mobos(
    *,
    db: Session = Depends(get_db),
    obj_in: MobOSCreate,
) -> Any:
    """
    Create new Coleta (MobOS) with items (MobPneu).
    """
    # Calculate totals
    total_valor = sum(p.valor for p in obj_in.pneus)
    qtd_pneu = len(obj_in.pneus)

    # Create main OS
    db_obj = MobOS(
        id_contato=obj_in.id_contato,
        qpneu=qtd_pneu,
        vtotal=total_valor,
        msgmob=obj_in.msgmob,
        id_vendedor=obj_in.id_vendedor
    )
    db.add(db_obj)
    db.flush() # Get ID
    
    # Create items (pneus)
    for pneu_in in obj_in.pneus:
        db_pneu = MobPneu(
            id_mobos=db_obj.id,
            id_medida=pneu_in.id_medida if pneu_in.id_medida else None,
            id_marca=pneu_in.id_marca if pneu_in.id_marca else None,
            id_desenho=pneu_in.id_desenho if pneu_in.id_desenho else None,
            id_recap=pneu_in.id_recap if pneu_in.id_recap else None,
            valor=pneu_in.valor,
            piso=pneu_in.piso,
            numserie=pneu_in.numserie,
            numfogo=pneu_in.numfogo,
            dot=pneu_in.dot,
            doriginal=pneu_in.doriginal,
            qreforma=pneu_in.qreforma,
            uso=pneu_in.uso,
            garantia=pneu_in.garantia,
            obs=pneu_in.obs,
            medidanova=pneu_in.medidanova,
            marcanova=pneu_in.marcanova,
            id_vendedor=pneu_in.id_vendedor if pneu_in.id_vendedor else None
        )
        db.add(db_pneu)
        
    db.commit()
    db.refresh(db_obj)
    
    # Reload with all relationships
    return db.query(MobOS).options(
        joinedload(MobOS.pneus),
        joinedload(MobOS.contato),
        joinedload(MobOS.vendedor)
    ).filter(MobOS.id == db_obj.id).first()

@router.get("/{id}", response_model=MobOSSchema)
def read_mobos_by_id(
    id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Get Coleta by ID.
    """
    coleta = db.query(MobOS).options(
        joinedload(MobOS.pneus),
        joinedload(MobOS.contato),
        joinedload(MobOS.vendedor)
    ).filter(MobOS.id == id).first()
    
    if not coleta:
        raise HTTPException(status_code=404, detail="Coleta not found")
    return coleta

@router.put("/{id}", response_model=MobOSSchema)
def update_mobos(
    *,
    db: Session = Depends(get_db),
    id: int,
    obj_in: MobOSUpdate,
) -> Any:
    """
    Update a Coleta and its items.
    """
    db_obj = db.query(MobOS).options(joinedload(MobOS.pneus)).filter(MobOS.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Coleta not found")
        
    # Calculate totals
    total_valor = sum(p.valor for p in obj_in.pneus)
    qtd_pneu = len(obj_in.pneus)

    # 1. Update main entity fields
    db_obj.id_contato = obj_in.id_contato
    db_obj.msgmob = obj_in.msgmob
    db_obj.id_vendedor = obj_in.id_vendedor
    db_obj.qpneu = qtd_pneu
    db_obj.vtotal = total_valor
        
    # 2. Sync Pneus (Details)
    existing_pneus = {p.id: p for p in db_obj.pneus}
    updated_pneu_ids = set()

    for pneu_in in obj_in.pneus:
        if pneu_in.id and pneu_in.id in existing_pneus:
            # Update existing
            pneu_obj = existing_pneus[pneu_in.id]
            pneu_update_data = pneu_in.model_dump(exclude_unset=True, exclude={'id'})
            for f, v in pneu_update_data.items():
                setattr(pneu_obj, f, v)
            updated_pneu_ids.add(pneu_in.id)
        else:
            # Add new
            new_pneu = MobPneu(
                id_mobos=db_obj.id,
                id_medida=pneu_in.id_medida if pneu_in.id_medida else None,
                id_marca=pneu_in.id_marca if pneu_in.id_marca else None,
                id_desenho=pneu_in.id_desenho if pneu_in.id_desenho else None,
                id_recap=pneu_in.id_recap if pneu_in.id_recap else None,
                valor=pneu_in.valor,
                piso=pneu_in.piso,
                numserie=pneu_in.numserie,
                numfogo=pneu_in.numfogo,
                dot=pneu_in.dot,
                doriginal=pneu_in.doriginal,
                qreforma=pneu_in.qreforma,
                uso=pneu_in.uso,
                garantia=pneu_in.garantia,
                obs=pneu_in.obs,
                medidanova=pneu_in.medidanova,
                marcanova=pneu_in.marcanova,
                id_vendedor=pneu_in.id_vendedor if pneu_in.id_vendedor else None
            )
            db.add(new_pneu)

    # Delete orphans
    for pid, pobj in existing_pneus.items():
        if pid not in updated_pneu_ids:
            db.delete(pobj)
        
    db.commit()
    db.refresh(db_obj)
    
    # Reload with relations
    return db.query(MobOS).options(
        joinedload(MobOS.pneus),
        joinedload(MobOS.contato),
        joinedload(MobOS.vendedor)
    ).filter(MobOS.id == id).first()

@router.delete("/{id}", response_model=MobOSSchema)
def delete_mobos(
    *,
    db: Session = Depends(get_db),
    id: int,
) -> Any:
    """
    Delete a Coleta.
    """
    obj = db.query(MobOS).filter(MobOS.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Coleta not found")
    db.delete(obj)
    db.commit()
    return obj
