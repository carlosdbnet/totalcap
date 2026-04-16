from backend.database import SessionLocal
from sqlalchemy import text

def check_usuario():
    db = SessionLocal()
    try:
        print("Verificando tabela usuario...")
        count = db.execute(text("SELECT COUNT(*) FROM usuario")).scalar()
        print(f"Registros em 'usuario': {count}")
        if count > 0:
            res = db.execute(text("SELECT email, nome FROM usuario")).fetchall()
            for r in res:
                print(f" - {r.email} ({r.nome})")
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_usuario()
