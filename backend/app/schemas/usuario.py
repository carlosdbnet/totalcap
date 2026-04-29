from typing import Optional
from pydantic import BaseModel, EmailStr

class UsuarioBase(BaseModel):
    email: Optional[EmailStr] = None
    nome: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False

class UsuarioCreate(UsuarioBase):
    email: EmailStr
    password: str

class UsuarioUpdate(UsuarioBase):
    password: Optional[str] = None

class UsuarioInDBBase(UsuarioBase):
    id: Optional[int] = None

    class Config:
        from_attributes = True

# Additional properties to return via API
class Usuario(UsuarioInDBBase):
    pass

# Additional properties stored in DB
class UsuarioInDB(UsuarioInDBBase):
    hashed_password: str

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

class UpdatePassword(BaseModel):
    old_password: str
    new_password: str

class PasswordChangeResponse(BaseModel):
    msg: str