from fastapi import APIRouter

from app.api.endpoints import clientes, areas, regioes, auth, atividades, vendedores

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(clientes.router, prefix="/clientes", tags=["clientes"])
api_router.include_router(areas.router, prefix="/areas", tags=["áreas"])
api_router.include_router(regioes.router, prefix="/regioes", tags=["regiões"])
api_router.include_router(atividades.router, prefix="/atividades", tags=["atividades"])
api_router.include_router(vendedores.router, prefix="/vendedores", tags=["vendedores"])
