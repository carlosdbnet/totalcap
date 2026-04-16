import os
import sys

# Garante que a raiz do projeto est no path para que o 'backend' seja encontrado
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.main import app as handler

# A Vercel procura por uma variavel 'app' ou 'handler'
app = handler
