from pydantic import BaseModel, ConfigDict
from typing import Optional
from decimal import Decimal

class PlanoPagBase(BaseModel):
    codigo: Optional[int] = None
    formapag: Optional[str] = None
    numparc: Optional[int] = 1
    ativo: Optional[bool] = True

class PlanoPagResponse(PlanoPagBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
