from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Totalcap"
    API_V1_STR: str = "/api/v1"
    
    # URL padrao vindo do Neon Database (pode ser sobrescrita pelo arquivo .env)
    POSTGRES_URL: str = "postgresql://neondb_owner:npg_TBWgl4SM1Ejn@ep-morning-water-acsrbm4u-pooler.sa-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

    # Configuracoes de seguranca
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7" # Mudar em producao
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 dias

    # Usuario Admin Padrao
    FIRST_SUPERUSER: str = "admin@totalcap.com"
    FIRST_SUPERUSER_PASSWORD: str = "admin123"
    
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    AI_PROVIDER: str = "gemini" # Default para Gemini se nao especificado no .env/vercel

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"), 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
