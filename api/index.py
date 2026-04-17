import os
import sys

# Garante que a raiz do projeto e a pasta backend estão no path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from backend.main import app

# Exporta para o Vercel
# O Vercel Python runtime espera uma variável 'app' no nível superior
instance = app
