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
    print(f"DEBUG: Criando nota de despesa: {nota_in.model_dump()}")
    try:
        # Criar cabeçalho
        db_nota = Notadesp(
            id_contato=nota_in.id_contato,
            dataemi=nota_in.dataemi,
            cpfcnpj=nota_in.cpfcnpj,
            nome=nota_in.nome,
            vtotal=nota_in.vtotal,
            id_vendedor=nota_in.id_vendedor,
            status=nota_in.status,
            obs=nota_in.obs
        )
        db.add(db_nota)
        
        # Criar itens usando o relacionamento
        for item_in in nota_in.itens:
            db_item = NotadespItem(
                id_vendedor=item_in.id_vendedor,
                id_veiculo=item_in.id_veiculo,
                descricao=item_in.descricao,
                datamov=item_in.datamov,
                tipo=item_in.tipo,
                qlitro=item_in.qlitro,
                vlitro=item_in.vlitro,
                vtotal=item_in.vtotal,
                kmanter=item_in.kmanter,
                kmatual=item_in.kmatual,
                dados=item_in.dados
            )
            db_nota.itens.append(db_item)
        
        db.commit()
        db.refresh(db_nota)
        print(f"DEBUG: Nota criada com sucesso ID: {db_nota.id}")
        return db_nota
    except Exception as e:
        db.rollback()
        print(f"DEBUG: Erro ao criar nota: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{id}", response_model=schemas.Notadesp)
def update_nota(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    nota_in: schemas.NotadespUpdate
):
    print(f"DEBUG: Atualizando nota {id}")
    db_nota = db.query(Notadesp).filter(Notadesp.id == id).first()
    if not db_nota:
        raise HTTPException(status_code=404, detail="Nota não encontrada")
    
    try:
        # Atualizar cabeçalho
        update_data = nota_in.model_dump(exclude={"itens"})
        for field, value in update_data.items():
            setattr(db_nota, field, value)
        
        # Sincronizar itens
        db.query(NotadespItem).filter(NotadespItem.id_notadesp == id).delete()
        
        for item_in in nota_in.itens:
            db_item = NotadespItem(
                id_notadesp=id,
                id_vendedor=item_in.id_vendedor,
                id_veiculo=item_in.id_veiculo,
                descricao=item_in.descricao,
                datamov=item_in.datamov,
                tipo=item_in.tipo,
                qlitro=item_in.qlitro,
                vlitro=item_in.vlitro,
                vtotal=item_in.vtotal,
                kmanter=item_in.kmanter,
                kmatual=item_in.kmatual,
                dados=item_in.dados
            )
            db.add(db_item)
        
        db.commit()
        db.refresh(db_nota)
        print(f"DEBUG: Nota {id} atualizada")
        return db_nota
    except Exception as e:
        db.rollback()
        print(f"DEBUG: Erro ao atualizar nota {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{id}")
def delete_nota(id: int, db: Session = Depends(deps.get_db)):
    db_nota = db.query(Notadesp).filter(Notadesp.id == id).first()
    if not db_nota:
        raise HTTPException(status_code=404, detail="Nota não encontrada")
    
    db.delete(db_nota)
    db.commit()
    return {"status": "ok"}
