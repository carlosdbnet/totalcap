import os
import datetime
from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()

class LogEntry(BaseModel):
    level: str = "ERROR"
    message: str
    stack: str = ""
    url: str = ""
    userAgent: str = ""
    timestamp: str = ""

@router.post("/")
async def create_log(entry: LogEntry):
    # Salva os logs na pasta raiz do projeto ou onde o servidor está rodando
    log_file = "frontend_errors.log"
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    log_content = (
        f"[{timestamp}] [{entry.level}] {entry.message}\n"
        f"URL: {entry.url}\n"
        f"UA: {entry.userAgent}\n"
        f"Stack: {entry.stack}\n"
        f"{'-'*50}\n"
    )
    
    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(log_content)
    except Exception as e:
        print(f"Erro ao escrever no arquivo de log: {e}")
        return {"status": "error", "message": str(e)}
        
    return {"status": "success"}
