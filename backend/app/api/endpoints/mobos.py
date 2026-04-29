from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from backend.app.api import deps
from backend.app.models.mobos import MobOS, MobPneu
from backend.app.models.ordem_servico import OrdemServico, OSPneu
from backend.app.schemas.mobos import MobOSCreate, MobOSUpdate, MobOS as MobOSSchema
from backend.app.schemas.ordem_servico import OrdemServicoResponse
from backend.database import get_db

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
    ).order_by(MobOS.id.desc()).offset(skip).limit(limit).all()
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

    # Verifica duplicidade do Número da OS
    if obj_in.numos:
        existing = db.query(MobOS).filter(MobOS.numos == obj_in.numos).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Registro Já Existe"
            )

    # Create main OS
    db_obj = MobOS(
        id_contato=obj_in.id_contato if obj_in.id_contato and obj_in.id_contato > 0 else None,
        qpneu=qtd_pneu,
        vtotal=total_valor,
        msgmob=obj_in.msgmob,
        id_vendedor=obj_in.id_vendedor,
        
        # Novos campos salvos no banco
        numos=obj_in.numos,
        cpfcnpj=obj_in.cpfcnpj,
        nome=obj_in.nome,
        endereco=obj_in.endereco,
        cidade=obj_in.cidade,
        uf=obj_in.uf,
        fone=obj_in.fone,
        veiculo=obj_in.veiculo,
        formapagto=obj_in.formapagto,
        vendedor_ocr=obj_in.vendedor_ocr,
        servicocomgarantia=obj_in.servicocomgarantia,
        tipoveiculo=obj_in.tipoveiculo,
        somentesepar=obj_in.somentesepar,
        podealterardesenho=obj_in.podealterardesenho,
        status=obj_in.status
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
            desenhonovo=pneu_in.desenhonovo
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
    db_obj.id_contato = obj_in.id_contato if obj_in.id_contato and obj_in.id_contato > 0 else None
    db_obj.msgmob = obj_in.msgmob
    db_obj.id_vendedor = obj_in.id_vendedor
    db_obj.qpneu = qtd_pneu
    db_obj.vtotal = total_valor
    
    # Novos campos atualizados (numos REMOVIDO para garantir imutabilidade)
    db_obj.cpfcnpj = obj_in.cpfcnpj
    db_obj.nome = obj_in.nome
    db_obj.endereco = obj_in.endereco
    db_obj.cidade = obj_in.cidade
    db_obj.uf = obj_in.uf
    db_obj.fone = obj_in.fone
    db_obj.veiculo = obj_in.veiculo
    db_obj.formapagto = obj_in.formapagto
    db_obj.vendedor_ocr = obj_in.vendedor_ocr
    db_obj.servicocomgarantia = obj_in.servicocomgarantia
    db_obj.tipoveiculo = obj_in.tipoveiculo
    db_obj.somentesepar = obj_in.somentesepar
    db_obj.podealterardesenho = obj_in.podealterardesenho
    db_obj.status = obj_in.status
        
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
                desenhonovo=pneu_in.desenhonovo
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

@router.post("/{id}/gerar-os", response_model=OrdemServicoResponse)
def gerar_os_from_coleta(
    id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Transforma uma Coleta (MobOS) em uma Ordem de Serviço (OrdemServico).
    """
    # 1. Busca a Coleta
    coleta = db.query(MobOS).options(joinedload(MobOS.pneus)).filter(MobOS.id == id).first()
    if not coleta:
        raise HTTPException(status_code=404, detail="Coleta não encontrada")
        
    # 2. Validações
    if not coleta.numos:
        raise HTTPException(
            status_code=400, 
            detail="Esta coleta não possui um Número de OS preenchido. Edite a coleta e informe o número antes de gerar."
        )
    
    # Validação do status 'Ok' (solicitado pelo usuário)
    if coleta.status == 'GOS':
        raise HTTPException(status_code=400, detail="Esta coleta já foi exportada para uma OS anteriormente.")
    
    if coleta.status != 'Ok':
        raise HTTPException(
            status_code=400, 
            detail=f"Esta coleta está com status '{coleta.status or 'Pendente'}'. É necessário validar todos os campos e deixar o status como 'Ok' antes de gerar a OS."
        )
        
    # 3. Verifica se o numos já existe no sistema principal (Tabela Física Legada)
    existing_os = db.query(OrdemServico).filter(OrdemServico.numos == str(coleta.numos)).first()
    if existing_os:
        raise HTTPException(status_code=400, detail="Registro Já Existe")

    try:
        # 4. Cria a OS Master na tabela fisica 'ordemservico'
        new_os = OrdemServico(
            numos=str(coleta.numos),
            id_contato=coleta.id_contato, # Usa id_contato diretamente (tabela fisica contato)
            id_vendedor=coleta.id_vendedor,
            id_empresa=1,
            status="ABERTA"
        )
        db.add(new_os)
        db.flush() # Pega o ID da nova OS
        
        # 5. Cria os itens na tabela fisica 'pneu'
        for pneu in coleta.pneus:
            new_pneu = OSPneu(
                id_ordem=new_os.id,
                id_medida=pneu.id_medida,
                id_marca=pneu.id_marca,
                id_desenho=pneu.id_desenho,
                id_recap=pneu.id_recap,
                id_empresa=1,
                numserie=pneu.numserie,
                dot=pneu.dot,
                valor=pneu.valor,
                statuspro="AGUARDANDO",
                obs=pneu.obs
            )
            db.add(new_pneu)
            
        # 6. Atualiza status da Coleta original
        coleta.status = 'GOS'
        
        db.commit()
        db.refresh(new_os)
        
        # Recarrega para retorno (mesmo que o schema mude, o retorno Any aceita o objeto)
        return db.query(OrdemServico).options(joinedload(OrdemServico.pneus)).filter(OrdemServico.id == new_os.id).first()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao gerar OS: {str(e)}")
