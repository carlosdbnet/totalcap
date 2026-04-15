from sqlalchemy import text
from database import engine

def check_operador_depto():
    with engine.connect() as conn:
        print("Checking 'operador' table...")
        res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'operador'"))
        rows = res.all()
        if not rows:
            print("Table 'operador' does not exist.")
        else:
            for r in rows:
                print(f"operador.{r[0]}: {r[1]}")
        
        print("\nChecking 'departamento' or 'depto' table...")
        res = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name IN ('departamento', 'depto')"))
        rows = res.all()
        if not rows:
            print("Neither 'departamento' nor 'depto' tables exist.")
        else:
            for r in rows:
                print(f"Table found: {r[0]}")
                # Check columns of the found table
                res_cols = conn.execute(text(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{r[0]}'"))
                for c in res_cols:
                    print(f"{r[0]}.{c[0]}: {c[1]}")

if __name__ == "__main__":
    check_operador_depto()
