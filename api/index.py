import sys
import os


# Adiciona o diretório raiz ao path para que "backend" possa ser importado
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Importa o FastAPI app do backend.main
from backend.main import app as handler

# Isso garante que o Vercel encontre o app como 'app' por padrão
app = handler
