from backend.database import SessionLocal
from backend.app.models.regiao import Regiao

def seed_regiao():
    db = SessionLocal()
    try:
        if db.query(Regiao).count() == 0:
            print("Semeando regiao de teste...")
            r = Regiao(codigo="TEST01", nome="Regiao de Teste", ativo=True)
            db.add(r)
            db.commit()
            print("OK!")
        else:
            print(f"Ja existem {db.query(Regiao).count()} registros.")
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_regiao()
