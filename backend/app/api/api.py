from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db

from backend.app.api.endpoints import (
    apontamentos,
    falhas,
    consumo_materia,
    clientes, 
    areas, 
    regioes, 
    auth, 
    atividades, 
    vendedores,
    transportadoras,
    cidades,
    estados,
    medidas,
    desenhos,
    marcas,
    tiporecaps,
    servicos,
    setores,
    departamentos,
    operadores,
    bancos,
    empresas,
    usuarios,
    ordens_servico,
    mobos,
    ocr,
    localizacao,
    localizacao,
    contatos,
    planos_pagamento,
    pneu_servico,
    produtos,
    grupos_produto,
    faturas,
    tipos_docto,
    dashboard,
    orcamento,
    notadesp,
    laudos,
    fatura_laudos,
    registro_falhas,
    dispositivos,
    veiculos,
    exportacao,
    logs,
    pneus,
    # credencial
)

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(exportacao.router, prefix="/exportacao", tags=["exportação"])
api_router.include_router(clientes.router, prefix="/clientes", tags=["clientes"])
api_router.include_router(areas.router, prefix="/areas", tags=["áreas"])
api_router.include_router(regioes.router, prefix="/regioes", tags=["regiões"])
api_router.include_router(atividades.router, prefix="/atividades", tags=["atividades"])
api_router.include_router(vendedores.router, prefix="/vendedores", tags=["vendedores"])
api_router.include_router(transportadoras.router, prefix="/transportadoras", tags=["transportadoras"])
api_router.include_router(cidades.router, prefix="/cidades", tags=["cidades"])
api_router.include_router(estados.router, prefix="/estados", tags=["estados"])
api_router.include_router(medidas.router, prefix="/medidas", tags=["medidas"])
api_router.include_router(desenhos.router, prefix="/desenhos", tags=["desenhos"])
api_router.include_router(marcas.router, prefix="/marcas", tags=["marcas"])
api_router.include_router(tiporecaps.router, prefix="/tipo-recapagem", tags=["tiporecap"])
api_router.include_router(servicos.router, prefix="/servicos", tags=["serviços"])
api_router.include_router(setores.router, prefix="/setores", tags=["setores"])
api_router.include_router(departamentos.router, prefix="/departamentos", tags=["departamentos"])
api_router.include_router(operadores.router, prefix="/operadores", tags=["operadores"])
api_router.include_router(bancos.router, prefix="/bancos", tags=["bancos"])
api_router.include_router(empresas.router, prefix="/empresas", tags=["empresas"])
api_router.include_router(usuarios.router, prefix="/usuarios", tags=["usuários"])
api_router.include_router(ordens_servico.router, prefix="/ordens-servico", tags=["os"])
api_router.include_router(mobos.router, prefix="/coletas", tags=["coletas"])
api_router.include_router(ocr.router, prefix="/ocr", tags=["ocr"])
api_router.include_router(localizacao.router, prefix="/localizacao", tags=["localizacao"])
api_router.include_router(contatos.router, prefix="/contatos", tags=["contatos"])
api_router.include_router(planos_pagamento.router, prefix="/planos-pagamento", tags=["planos-pagamento"])
api_router.include_router(pneu_servico.router, prefix="/pneu-servicos", tags=["pneu-servicos"])
api_router.include_router(produtos.router, prefix="/produtos", tags=["produtos"])
api_router.include_router(grupos_produto.router, prefix="/grupos-produto", tags=["grupos-produto"])
api_router.include_router(faturas.router, prefix="/faturas", tags=["faturas"])
api_router.include_router(tipos_docto.router, prefix="/tipos-docto", tags=["tipos-docto"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(apontamentos.router, prefix="/apontamentos", tags=["apontamentos"])
api_router.include_router(falhas.router, prefix="/falhas", tags=["falhas"])
api_router.include_router(consumo_materia.router, prefix="/consumo-materia", tags=["consumo"])
api_router.include_router(orcamento.router, prefix="/orcamentos", tags=["orçamentos"])
api_router.include_router(notadesp.router, prefix="/notadesp", tags=["despesas"])
api_router.include_router(laudos.router, prefix="/laudos", tags=["laudos"])
api_router.include_router(fatura_laudos.router, prefix="/fatura-laudos", tags=["fatura-laudos"])
api_router.include_router(registro_falhas.router, prefix="/registro-falhas", tags=["registro-falhas"])
api_router.include_router(dispositivos.router, prefix="/dispositivos", tags=["dispositivos"])
api_router.include_router(veiculos.router, prefix="/veiculos", tags=["veículos"])
api_router.include_router(logs.router, prefix="/logs", tags=["logs"])
api_router.include_router(pneus.router, prefix="/pneus", tags=["pneus"])
# api_router.include_router(credencial.router, prefix="/credencial", tags=["credencial"])
@api_router.get("/status")
def get_status(db: Session = Depends(get_db)):
    from backend.app.models.usuario import Usuario
    try:
        user_count = db.query(Usuario).count()
        return {
            "status": "online",
            "database": "connected",
            "user_count": user_count,
            "message": "Admin será criado no primeiro login se count for 0"
        }
    except Exception as e:
        return {
            "status": "online",
            "database": "error",
            "detail": str(e)
        }
