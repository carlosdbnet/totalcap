from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.app.services.ocr_service import analyze_tire_image

router = APIRouter()

from typing import Optional

class OCRRequest(BaseModel):
    image: str # Base64 string
    instrucoes: Optional[str] = None # Instruções extras para a IA

@router.post("/analyze")
async def analyze_ocr(request: OCRRequest):
    if not request.image:
        raise HTTPException(status_code=400, detail="Imagem não fornecida.")
    
    try:
        # Chama o serviço que integra com a OpenAI
        result = analyze_tire_image(request.image, request.instrucoes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
