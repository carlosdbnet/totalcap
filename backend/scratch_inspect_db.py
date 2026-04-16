from sqlalchemy import create_engine, inspect
import sys
import os

# Adapt path to find config
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))
from backend.config import settings

engine = create_engine(settings.POSTGRES_URL)
inspector = inspect(engine)

def get_columns(table_name):
    print(f"--- Columns for {table_name} ---")
    columns = inspector.get_columns(table_name)
    for column in columns:
        print(f"{column['name']}: {column['type']}")

try:
    get_columns('cidade')
    get_columns('estado')
    get_columns('clientes')
    get_columns('contato')
except Exception as e:
    print(f"Error: {e}")
