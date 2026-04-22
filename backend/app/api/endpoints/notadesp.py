from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.api import deps
from backend.app.models.notadesp import Notadesp
from backend.app.models.notadesp_item import NotadespItem
from backend.app.models.vendedor import Vendedor
from backend.app.models.contato import Contato
from backend.app.schemas import notadesp as schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Notadesp])
def read_notadesp(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100
):
    notas = db.query(Notadesp).offset(skip).limit(limit).all()
    
    # Enriquecer com nomes para o grid
    for nota in notas:
        if nota.id_contato:
            contato = db.query(Contato).filter(Contato.id == nota.id_contato).first()
            nota.contato_nome = contato.nome if contato else "Não encontrado"
        
        vendedor = db.query(Vendedor).filter(Vendedor.id == nota.id_vendedor).first()
        nota.vendedor_nome = vendedor.nome if vendedor else "Não encontrado"
        
    return notas

@router.get("/{id}", response_model=schemas.Notadesp)
def read_nota(id: int, db: Session = Depends(deps.get_db)):
    nota = db.query(Notadesp).filter(Notadesp.id == id).first()
    if not nota:
        raise HTTPException(status_code=404, detail="Nota de despesa não encontrada")
    return nota

@router.post("/", response_model=schemas.Notadesp)
def create_nota(
    *,
    db: Session = Depends(deps.get_db),
    nota_in: schemas.NotadespCreate
):
    # Criar cabeçalho
    db_nota = Notadesp(
        id_contato=nota_in.id_contato,
        dataemi=nota_in.dataemi,
        cpfcnpj=nota_in.cpfcnpj,
        nome=nota_in.nome,
        vtotal=nota_in.vtotal,
        id_vendedor=nota_in.id_vendedor,
        status=nota_in.status
    )
    db.add(db_nota)
    db.flush() # Para pegar o ID gerado

    # Criar itens
    for item in nota_in.itens:
        db_item = NotadespItem(
            id_notadesp=db_nota.id,
            id_vendedor=item.id_vendedor,
            id_veiculo=item.id_veiculo,
            descricao=item.descricao,
            datamov=item.datamov,
            tipo=item.tipo,
            qlitro=item.qlitro,
            vlitro=item.vlitro,
            vtotal=item.vtotal,
            kmanter=item.kmanter,
            kmatual=item.kmatual,
            dados=item.dados
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_nota)
    return db_nota

@router.put("/{id}", response_model=schemas.Notadesp)
def update_nota(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    nota_in: schemas.NotadespUpdate
):
    db_nota = db.query(Notadesp).filter(Notadesp.id == id).first()
    if not db_nota:
        raise HTTPException(status_code=404, detail="Nota não encontrada")
    
    # Atualizar cabeçalho
    update_data = nota_in.model_dump(exclude={"itens"})
    for field, value in update_data.items():
        setattr(db_nota, field, value)
    
    # Sincronizar itens (mais simples: remove todos e recria)
    db.query(NotadespItem).filter(NotadespItem.id_notadesp == id).delete()
    
    for item in nota_in.itens:
        db_item = NotadespItem(
            id_notadesp=id,
            id_vendedor=item.id_vendedor,
            id_veiculo=item.id_veiculo,
            descricao=item.descricao,
            datamov=item.datamov,
            tipo=item.tipo,
            qlitro=item.qlitro,
            vlitro=item.vlitro,
            vtotal=item.vtotal,
            kmanter=item.kmanter,
            kmatual=item.kmatual,
            dados=item.dados
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_nota)
    return db_nota

@router.delete("/{id}")
def delete_nota(id: int, db: Session = Depends(deps.get_db)):
    db_nota = db.query(Notadesp).filter(Notadesp.id == id).first()
    if not db_nota:
        raise HTTPException(status_code=404, detail="Nota não encontrada")
    
    db.delete(db_nota)
    db.commit()
    return {"status": "ok"}
