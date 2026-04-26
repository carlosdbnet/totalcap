from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
import traceback

router = APIRouter()

# ========== TABELA: falha (tipos de falha) ==========
@router.get("/teste")
def teste_falha():
    return {"message": "ok"}

@router.get("/tipofalhas/")
def get_tipos_falha(db: Session = Depends(get_db)):
    try:
        from backend.app.models.falha import Falha
        falhas = db.query(Falha).all()
        return [
            {
                "id": f.id,
                "codigo": f.codigo,
                "descricao": f.descricao,
                "ativo": f.ativo if f.ativo is not None else True
            }
            for f in falhas
        ]
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tipofalhas/")
def create_tipo_falha(obj_in: dict, db: Session = Depends(get_db)):
    try:
        from backend.app.models.falha import Falha
        nova = Falha(
            codigo=obj_in.get("codigo"),
            descricao=obj_in.get("descricao"),
            ativo=obj_in.get("ativo", True)
        )
        db.add(nova)
        db.commit()
        db.refresh(nova)
        return {
            "id": nova.id,
            "codigo": nova.codigo,
            "descricao": nova.descricao,
            "ativo": nova.ativo
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/tipofalhas/{id}")
def update_tipo_falha(id: int, obj_in: dict, db: Session = Depends(get_db)):
    try:
        from backend.app.models.falha import Falha
        falha = db.query(Falha).filter(Falha.id == id).first()
        if not falha:
            raise HTTPException(status_code=404, detail="Tipo de falha não encontrado")
        
        if obj_in.get("codigo"):
            falha.codigo = obj_in["codigo"]
        if obj_in.get("descricao"):
            falha.descricao = obj_in["descricao"]
        if obj_in.get("ativo") is not None:
            falha.ativo = obj_in["ativo"]
        
        db.commit()
        db.refresh(falha)
        return {
            "id": falha.id,
            "codigo": falha.codigo,
            "descricao": falha.descricao,
            "ativo": falha.ativo
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/tipofalhas/{id}")
def delete_tipo_falha(id: int, db: Session = Depends(get_db)):
    try:
        from backend.app.models.falha import Falha
        falha = db.query(Falha).filter(Falha.id == id).first()
        if not falha:
            raise HTTPException(status_code=404, detail="Tipo de falha não encontrado")
        
        db.delete(falha)
        db.commit()
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ========== TABELA: registro_falha ==========
@router.get("/registrofalha/")
def get_registros_falha(db: Session = Depends(get_db)):
    try:
        from backend.app.models.registro_falha import RegistroFalha
        from backend.app.models.setor import Setor
        from backend.app.models.operador import Operador
        from backend.app.models.falha import Falha
        
        registros = db.query(RegistroFalha).order_by(RegistroFalha.data.desc()).all()
        
        result = []
        for r in registros:
            setor = db.query(Setor).filter(Setor.id == r.id_setor).first()
            operador = db.query(Operador).filter(Operador.id == r.id_operador).first()
            falha_tipo = db.query(Falha).filter(Falha.id == r.id_falha).first()
            
            result.append({
                "id": r.id,
                "data": r.data.isoformat() if r.data else None,
                "id_setor": r.id_setor,
                "id_operador": r.id_operador,
                "id_falha": r.id_falha,
                "id_pneu": r.id_pneu,
                "obs": r.obs,
                "setor_nome": setor.descricao if setor else "-",
                "operador_nome": operador.nome if operador else "-",
                "falha_nome": falha_tipo.descricao if falha_tipo else "-"
            })
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/registrofalha/")
def create_registro_falha(obj_in: dict, db: Session = Depends(get_db)):
    try:
        from backend.app.models.registro_falha import RegistroFalha
        novo = RegistroFalha(
            id_setor=obj_in.get("id_setor"),
            id_operador=obj_in.get("id_operador"),
            id_falha=obj_in.get("id_falha"),
            id_pneu=obj_in.get("id_pneu"),
            obs=obj_in.get("obs")
        )
        db.add(novo)
        db.commit()
        db.refresh(novo)
        return {"id": novo.id, "status": "success"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/registrofalha/{id}")
def delete_registro_falha(id: int, db: Session = Depends(get_db)):
    try:
        from backend.app.models.registro_falha import RegistroFalha
        reg = db.query(RegistroFalha).filter(RegistroFalha.id == id).first()
        if not reg:
            raise HTTPException(status_code=404, detail="Registro não encontrado")
        
        db.delete(reg)
        db.commit()
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))