import os
import sys
import base64
from dotenv import load_dotenv

# Adiciona o diretório atual ao path para importar as extensões do backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import settings
from backend.app.services.ocr_service import analyze_tire_image

def test_ai():
    # Carrega o .env manualmente
    load_dotenv()
    
    print(f"--- Testando Provedor: {settings.AI_PROVIDER} ---")
    
    # Imagem base64 de um pixel transparente (apenas para teste de estrutura)
    fake_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    
    try:
        result = analyze_tire_image(fake_image, custom_instructions="Simule uma Ordem de Serviço com 2 itens. No segundo item, use aspas na coluna 'medida'.")
        print("Sucesso!")
        print(f"Número OS: {result.get('cabecalho', {}).get('os_numero')}")
        print(f"Placa: {result.get('cabecalho', {}).get('placa')}")
        print(f"Quantidade de Itens: {len(result.get('itens', []))}")
        if result.get('itens'):
            print(f"Primeiro Item: {result['itens'][0]}")
        print(f"Vendedor: {result.get('rodape', {}).get('vendedor')}")
        print(f"JSON Completo: {result}")
    except Exception as e:
        print(f"Erro no teste: {e}")
        if settings.AI_PROVIDER == "gemini" and not settings.GOOGLE_API_KEY:
            print("DICA: Você esqueceu de configurar a GOOGLE_API_KEY no arquivo .env!")

if __name__ == "__main__":
    test_ai()
