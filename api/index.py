import sys
import os


# Adiciona o diretório raiz ao path para que "backend" possa ser importado
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    # Importa o FastAPI app do backend.main
    from backend.main import app as handler
    # Isso garante que o Vercel encontre o app como 'app' por padrão
    app = handler
except Exception as e:
    from fastapi import FastAPI
    app = FastAPI()
    @app.get("/api/v1/ping")
    @app.get("/api/v1/status")
    def error_debug():
        import traceback
        return {
            "status": "error",
            "message": "Falha ao carregar o backend",
            "error": str(e),
            "traceback": traceback.format_exc()
        }
