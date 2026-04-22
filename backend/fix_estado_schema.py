import sys, os
sys.path.insert(0, os.getcwd())

from backend.database import engine
from sqlalchemy import text, inspect

insp = inspect(engine)

# Listar colunas reais da tabela estado no banco
print("=== Colunas atuais da tabela 'estado' no banco ===")
try:
    cols = insp.get_columns('estado')
    for c in cols:
        print(f"  {c['name']} ({c['type']})")
except Exception as e:
    print(f"Erro: {e}")

# Adicionar colunas faltantes
print("\n=== Adicionando colunas faltantes ===")
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE estado ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE"))
        print("  + ativo: OK")
    except Exception as e:
        print(f"  ativo: {e}")
    try:
        conn.execute(text("ALTER TABLE estado ADD COLUMN IF NOT EXISTS userlan VARCHAR"))
        print("  + userlan: OK")
    except Exception as e:
        print(f"  userlan: {e}")
    try:
        conn.execute(text("ALTER TABLE estado ADD COLUMN IF NOT EXISTS datalan TIMESTAMP"))
        print("  + datalan: OK")
    except Exception as e:
        print(f"  datalan: {e}")
    conn.commit()

print("\nFeito!")
