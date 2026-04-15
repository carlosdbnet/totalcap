from fastapi import APIRouter

from app.api.endpoints import (
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
    operadores
)

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
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
