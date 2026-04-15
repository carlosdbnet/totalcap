from sqlalchemy import text
from database import engine

def sync_schema():
    with engine.connect() as conn:
        print("Checking columns for table 'servico'...")
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'servico'"))
        columns = [r[0] for r in res]
        print(f"Current columns: {columns}")

        new_columns = [
            ("cod_servico", "VARCHAR"),
            ("piso", "VARCHAR"),
            ("id_medida", "INTEGER"),
            ("id_desenho", "INTEGER"),
            ("id_marca", "INTEGER"),
            ("id_recap", "INTEGER")
        ]

        for col_name, col_type in new_columns:
            if col_name not in columns:
                print(f"Adding column {col_name} to table 'servico'...")
                try:
                    conn.execute(text(f"ALTER TABLE servico ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    print(f"Column {col_name} added.")
                except Exception as e:
                    print(f"Error adding {col_name}: {e}")
            else:
                print(f"Column {col_name} already exists.")

if __name__ == "__main__":
    sync_schema()
