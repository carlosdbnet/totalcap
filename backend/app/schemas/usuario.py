from typing import Optional
from pydantic import BaseModel, EmailStr

# Shared properties
class UsuarioBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False
    nome: Optional[str] = None

# Properties to receive via API on creation
class UsuarioCreate(UsuarioBase):
    email: EmailStr
    password: str

# Properties to receive via API on update
class UsuarioUpdate(UsuarioBase):
    password: Optional[str] = None

# Properties to return via API
class Usuario(UsuarioBase):
    id: Optional[int] = None

    class Config:
        from_attributes = True

# Generic message schema
class Msg(BaseModel):
    msg: str

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None
