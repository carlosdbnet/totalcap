from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

# Shared properties
class ClienteBase(BaseModel):
    nome: str
    documento: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    ativo: Optional[bool] = True

# Properties to receive on item creation
class ClienteCreate(ClienteBase):
    pass

# Properties to receive on item update
class ClienteUpdate(ClienteBase):
    nome: Optional[str] = None
    documento: Optional[str] = None

# Properties to return to client
class ClienteResponse(ClienteBase):
    id: int
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
