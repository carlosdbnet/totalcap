from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Any, List, Optional
from backend.database import get_db
from backend.app.models.ordem_servico import OrdemServico as OSModel, OSPneu as PneuModel
from backend.app.models.mobos import MobOS
from backend.app.models.servico import Servico
from backend.app.models.contato import Contato
from backend.app.models.medida import Medida
from backend.app.models.produto import Produto
from backend.app.models.desenho import Desenho
from backend.app.models.tiporecap import TipoRecapagem
from backend.app.schemas.ordem_servico import OrdemServicoResponse, OrdemServicoCreate, OrdemServicoUpdate, PneuSearchResult

router = APIRouter()

def get_matching_servico_id(db: Session, id_medida: int, id_desenho: int, id_recap: int) -> int | None:
    if not id_medida or not id_desenho or not id_recap:
        return None
    
    servico = db.query(Servico).filter(
        Servico.id_medida == id_medida,
        Servico.id_desenho == id_desenho,
        Servico.id_recap == id_recap,
        Servico.ativo == True
    ).first()
    
    return servico.id if servico else None

# Mapeamentos de Status para Banco Legado
STATUS_MAP_STORE = {
    "ABERTA": "A",
    "PRODUCAO": "P",
    "FINALIZADA": "F",
    "CANCELADA": "C"
}
STATUS_MAP_READ = {v: k for k, v in STATUS_MAP_STORE.items()}

def map_os_to_response(os):
    # Converte códigos do banco para palavras amigáveis
    os.status = STATUS_MAP_READ.get(os.status, "ABERTA")
    if hasattr(os, 'contato') and os.contato:
        os.contato_nome = os.contato.nome
    for pneu in os.pneus:
        if pneu.statusfat:
            pneu.statuspro_label = "PRONTO"
        elif pneu.statuspro:
            pneu.statuspro_label = "PROCESSO"
        else:
            pneu.statuspro_label = "AGUARDANDO"
        if pneu.servico:
            pneu.servico_nome = pneu.servico.descricao
    return os

@router.get("/", response_model=List[OrdemServicoResponse])
def read_ordens_servico(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = None,
    latest: Optional[bool] = False
) -> Any:
    query = db.query(OSModel).options(joinedload(OSModel.pneus).joinedload(PneuModel.servico), joinedload(OSModel.contato))
    
    if q:
        from backend.app.models.contato import Contato
        # Se for número, busca por numos, senão busca por nome do contato
        if q.isdigit():
            query = query.filter(OSModel.numos == int(q))
        else:
            query = query.join(OSModel.contato).filter(Contato.nome.ilike(f"%{q}%"))
            
    # Ordenação padrão por data e ID desc (mais novos primeiro)
    query = query.order_by(OSModel.dataentrada.desc(), OSModel.id.desc())

    if latest:
        oss = query.limit(1).all()
    else:
        oss = query.offset(skip).limit(limit).all()
        
    return [map_os_to_response(os) for os in oss]

@router.get("/pneu-search/", response_model=List[PneuSearchResult])
def search_pneu(
    q: str,
    db: Session = Depends(get_db)
) -> Any:
    # Limpeza e normalização da busca
    q = q.strip()
    if not q:
        return []

    # Busca por ID, Série, Fogo ou Código de Barras
    query = db.query(
        PneuModel, OSModel, Contato, Medida, Produto, Desenho, Servico, TipoRecapagem
    ).outerjoin(OSModel, PneuModel.id_ordem == OSModel.id)\
     .outerjoin(Contato, PneuModel.id_contato == Contato.id)\
     .outerjoin(Medida, PneuModel.id_medida == Medida.id)\
     .outerjoin(Produto, PneuModel.id_marca == Produto.id)\
     .outerjoin(Desenho, PneuModel.id_desenho == Desenho.id)\
     .outerjoin(Servico, PneuModel.id_servico == Servico.id)\
     .outerjoin(TipoRecapagem, PneuModel.id_recap == TipoRecapagem.id)
     
    # Filtro Dinâmico: Busca por ID exato, codbarra exato ou likes nos outros campos
    if q.isdigit():
        query = query.filter(
            (PneuModel.id == int(q)) | 
            (PneuModel.codbarra == q)
        )
    else:
        query = query.filter(
             (PneuModel.numserie.ilike(f"%{q}%")) | 
             (PneuModel.numfogo.ilike(f"%{q}%")) |
             (PneuModel.codbarra.ilike(f"%{q}%"))
        )
    
    results = query.order_by(PneuModel.id.desc()).limit(1).all()

    mapped_results = []
    for pneu, os, contato, medida, produto, desenho, servico, tiporecap in results:
        # Formata o label de status
        status_label = "PENDENTE"
        if pneu.statusfat:
            status_label = "FATURADO"
        elif pneu.statuspro:
            status_label = "CONCLUÍDO"

        # Correção da lógica de data para evitar AttributeError
        dt_entrada = os.dataentrada if (os and os.dataentrada) else pneu.datalan

        mapped_results.append(
            PneuSearchResult(
                pneu_id=pneu.id,
                numserie=pneu.numserie.strip() if pneu.numserie else "---",
                numfogo=pneu.numfogo.strip() if pneu.numfogo else "---",
                codbarra=pneu.codbarra or str(pneu.id),
                dot=pneu.dot or "---",
                statuspro=bool(pneu.statuspro),
                statusfat=bool(pneu.statusfat),
                statuspro_label=status_label,
                medida_nome=medida.descricao if medida else "---",
                produto_nome=produto.descricao if produto else "---",
                desenho_nome=desenho.descricao if desenho else "---",
                servico_nome=servico.descricao if servico else "---",
                tiporecap_nome=tiporecap.descricao if tiporecap else "---",
                os_id=os.id if os else 0,
                numos=os.numos if os else 0,
                contato_nome=contato.nome if contato else "CLIENTE NÃO VINCULADO",
                dataentrada=dt_entrada.isoformat() if dt_entrada else None,
                id_servico_base=pneu.id_servico,
                valor_pneu=pneu.valor or 0,
                qservico=pneu.qservico or 0,
                vrservico=pneu.vrservico or 0,
                id_vendedor=pneu.id_vendedor,
                id_contato=pneu.id_contato
            )
        )
    
    return mapped_results

@router.get("/pneus-pendentes/", response_model=List[PneuSearchResult])
def get_pneus_pendentes_faturamento(
    pneu_id: Optional[int] = None,
    numos: Optional[int] = None,
    cliente: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Any:
    """Busca pneus com serviços lançados mas sem faturamento (Triagem)."""
    query = db.query(
        PneuModel, OSModel, Contato, Medida, Produto, Desenho, Servico, TipoRecapagem
    ).join(OSModel, PneuModel.id_ordem == OSModel.id)\
     .join(Contato, OSModel.id_contato == Contato.id)\
     .outerjoin(Medida, PneuModel.id_medida == Medida.id)\
     .outerjoin(Produto, PneuModel.id_marca == Produto.id)\
     .outerjoin(Desenho, PneuModel.id_desenho == Desenho.id)\
     .outerjoin(Servico, PneuModel.id_servico == Servico.id)\
     .outerjoin(TipoRecapagem, PneuModel.id_recap == TipoRecapagem.id)\
     .filter(PneuModel.statusfat == False)\
     .filter(PneuModel.qservico > 0)
    
    if pneu_id:
        query = query.filter(PneuModel.id == pneu_id)
    if numos:
        query = query.filter(OSModel.numos == numos)
    if cliente:
        query = query.filter(Contato.nome.ilike(f"%{cliente}%"))
        
    results = query.all()
    
    mapped_results = []
    for pneu, os, contato, medida, produto, desenho, servico, tiporecap in results:
        # Formata o label de status
        status_label = "PENDENTE"
        if pneu.statusfat:
            status_label = "FATURADO"
        elif pneu.statuspro:
            status_label = "CONCLUÍDO"

        dt_entrada = os.dataentrada if (os and os.dataentrada) else pneu.datalan

        mapped_results.append(
            PneuSearchResult(
                pneu_id=pneu.id,
                numserie=pneu.numserie.strip() if pneu.numserie else "---",
                numfogo=pneu.numfogo.strip() if pneu.numfogo else "---",
                codbarra=pneu.codbarra or str(pneu.id),
                dot=pneu.dot or "---",
                statuspro=bool(pneu.statuspro),
                statusfat=bool(pneu.statusfat),
                statuspro_label=status_label,
                medida_nome=medida.descricao if medida else "---",
                produto_nome=produto.descricao if produto else "---",
                desenho_nome=desenho.descricao if desenho else "---",
                servico_nome=servico.descricao if servico else "---",
                tiporecap_nome=tiporecap.descricao if tiporecap else "---",
                os_id=os.id if os else 0,
                numos=os.numos if os else 0,
                contato_nome=contato.nome if contato else "CLIENTE NÃO VINCULADO",
                dataentrada=dt_entrada.isoformat() if dt_entrada else None,
                id_servico_base=pneu.id_servico,
                valor_pneu=pneu.valor or 0,
                qservico=pneu.qservico or 0,
                vrservico=pneu.vrservico or 0,
                id_vendedor=pneu.id_vendedor,
                id_contato=pneu.id_contato
            )
        )
    
    return mapped_results

@router.get("/{id}", response_model=OrdemServicoResponse)
def read_ordem_servico(
    id: int,
    db: Session = Depends(get_db),
) -> Any:
    db_obj = db.query(OSModel).options(joinedload(OSModel.pneus)).filter(OSModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada")
    return map_os_to_response(db_obj)

@router.post("/", response_model=OrdemServicoResponse, status_code=status.HTTP_201_CREATED)
def create_ordem_servico(
    *,
    db: Session = Depends(get_db),
    os_in: OrdemServicoCreate,
) -> Any:
    # 1. Check if numos exists
    existing = db.query(OSModel).filter(OSModel.numos == os_in.numos).first()
    if existing:
        raise HTTPException(status_code=400, detail="Registro Já Existe")

    # 2. Create OS (Master)
    os_data = os_in.model_dump(exclude={'pneus', 'id_coleta', 'observacao'})
    # Mapear Status para CHAR(1)
    os_data['status'] = STATUS_MAP_STORE.get(os_in.status, "A")
    
    db_os = OSModel(**os_data)
    
    db_os.id_mobos = os_in.id_coleta
    
    db.add(db_os)
    db.flush() # Get OS ID

    # 3. Create Pneus (Details)
    for pneu_in in os_in.pneus:
        pneu_data = pneu_in.model_dump()
        
        # Mapear statuspro string para booleanos (statuspro/statusfat)
        status_label = pneu_in.statuspro or "AGUARDANDO"
        if status_label == "PRONTO":
            pneu_data['statuspro'] = False
            pneu_data['statusfat'] = True
        elif status_label == "PROCESSO":
            pneu_data['statuspro'] = True
            pneu_data['statusfat'] = False
        else:
            pneu_data['statuspro'] = False
            pneu_data['statusfat'] = False

        # Tenta encontrar serviço automático
        auto_servico_id = get_matching_servico_id(
            db, 
            pneu_in.id_medida, 
            pneu_in.id_desenho, 
            pneu_in.id_recap
        )
        if auto_servico_id:
            pneu_data['id_servico'] = auto_servico_id
            
        # Sincronização Legado: Propaga IDs e preenche obrigatórios
        pneu_data['id_contato'] = db_os.id_contato
        pneu_data['id_vendedor'] = db_os.id_vendedor or 1 # Padrão se nulo
        pneu_data['vrtotal'] = pneu_data.get('valor', 0)
        pneu_data['vrtabela'] = pneu_data.get('valor', 0)
        pneu_data['quant'] = 1
        pneu_data['id_empresa'] = db_os.id_empresa
            
        db_pneu = PneuModel(**pneu_data, id_ordem=db_os.id)
        db.add(db_pneu)
        db.flush() # Gerar ID
        
        # Lógica: se codbarra vazio, assume ID (Formatado com 8 dígitos)
        if not db_pneu.codbarra:
            db_pneu.codbarra = str(db_pneu.id).zfill(8)

    # 4. Recalcular Totais Financeiros após adicionar os pneus
    db.flush() # Sincroniza pneus adicionados
    total_pneus = sum((p.valor for p in db_os.pneus), 0)
    
    # Preenche vrservico e vrtotal se estiverem zerados ou nulos
    if not db_os.vrservico or db_os.vrservico == 0:
        db_os.vrservico = total_pneus
    if not db_os.vrtotal or db_os.vrtotal == 0:
        db_os.vrtotal = total_pneus
        
    # Calcula vrcomissao se houver porcentagem
    if db_os.pcomissao and db_os.vrtotal:
        db_os.vrcomissao = (db_os.vrtotal * db_os.pcomissao) / 100

    # 4. Se houver id_coleta, atualiza o status da coleta para EXP e salva o Nº OS
    if os_in.id_coleta:
        coleta = db.query(MobOS).filter(MobOS.id == os_in.id_coleta).first()
        if coleta:
            coleta.status = 'GOS'
            coleta.numos = db_os.numos

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
    os_data = os_in.model_dump(exclude_unset=True, exclude={'pneus', 'observacao'})
    if 'status' in os_data:
        os_data['status'] = STATUS_MAP_STORE.get(os_data['status'], "A")
        
    for field, value in os_data.items():
        setattr(db_os, field, value)
    
    if os_in.observacao is not None:
        db_os.obs_fatura = os_in.observacao

    # 2. Update Pneus (Details) - Synching logic
    if os_in.pneus is not None:
        existing_pneus = {p.id: p for p in db_os.pneus}
        updated_pneu_ids = set()

        for pneu_in in os_in.pneus:
            pneu_data = pneu_in.model_dump(exclude_unset=True, exclude={'id'})
            
            # Tradução de statuspro para booleanos
            if 'statuspro' in pneu_data and isinstance(pneu_data['statuspro'], str):
                status_label = pneu_data['statuspro']
                if status_label == "PRONTO":
                    pneu_data['statuspro'] = False
                    pneu_data['statusfat'] = True
                elif status_label == "PROCESSO":
                    pneu_data['statuspro'] = True
                    pneu_data['statusfat'] = False
                else:
                    pneu_data['statuspro'] = False
                    pneu_data['statusfat'] = False

            if pneu_in.id and pneu_in.id in existing_pneus:
                # Update existing
                pneu_obj = existing_pneus[pneu_in.id]
                for f, v in pneu_data.items():
                    setattr(pneu_obj, f, v)
                
                # Garante propagação de IDs na atualização também
                pneu_obj.id_contato = db_os.id_contato
                pneu_obj.id_vendedor = db_os.id_vendedor or 1
                pneu_obj.vrtotal = pneu_obj.valor
                
                # Lógica: se codbarra vazio, assume ID (Formatado com 8 dígitos)
                if not pneu_obj.codbarra:
                    pneu_obj.codbarra = str(pneu_obj.id).zfill(8)
                
                updated_pneu_ids.add(pneu_in.id)
            else:
                # Add new
                auto_servico_id = get_matching_servico_id(
                    db, 
                    pneu_in.id_medida, 
                    pneu_in.id_desenho, 
                    pneu_in.id_recap
                )
                if auto_servico_id:
                    pneu_data['id_servico'] = auto_servico_id
                
                # Sincronização Legado: Propaga IDs e preenche obrigatórios para novos pneus
                pneu_data['id_contato'] = db_os.id_contato
                pneu_data['id_vendedor'] = db_os.id_vendedor or 1
                pneu_data['vrtotal'] = pneu_data.get('valor', 0)
                pneu_data['vrtabela'] = pneu_data.get('valor', 0)
                pneu_data['quant'] = 1
                pneu_data['id_empresa'] = db_os.id_empresa
                    
                new_pneu = PneuModel(**pneu_data, id_ordem=os_id)
                db.add(new_pneu)
                db.flush() # Gerar ID
                
                # Lógica: se codbarra vazio, assume ID (Formatado com 8 dígitos)
                if not new_pneu.codbarra:
                    new_pneu.codbarra = str(new_pneu.id).zfill(8)

        # Delete orphans (pneus that were in DB but not in our update list)
        for pid, pobj in existing_pneus.items():
            if pid not in updated_pneu_ids:
                db.delete(pobj)

        db.flush() # Sincroniza alterações nos pneus
        
        # Recalcula totais financeiros
        total_pneus = sum((p.valor for p in db_os.pneus), 0)
        
        # Regra: se vrservico/vrtotal vieram zerados ou nulos no update, recalculamos
        # Se vieram com valor, respeitamos o valor informado
        if not db_os.vrservico or db_os.vrservico == 0:
            db_os.vrservico = total_pneus
        if not db_os.vrtotal or db_os.vrtotal == 0:
            db_os.vrtotal = total_pneus
            
        # Recalcula comissão
        if db_os.pcomissao and db_os.vrtotal:
            db_os.vrcomissao = (db_os.vrtotal * db_os.pcomissao) / 100

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
