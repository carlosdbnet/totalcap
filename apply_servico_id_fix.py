from sqlalchemy import text
from backend.database import engine

def apply_fix():
    sql = """
    DO $$ 
    BEGIN 
        -- Create sequence if not exists
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'servico_id_seq') THEN
            CREATE SEQUENCE servico_id_seq START WITH 1;
        END IF;

        -- Set default for id column
        ALTER TABLE servico ALTER COLUMN id SET DEFAULT nextval('servico_id_seq');

        -- Allow NULL in technical fields
        ALTER TABLE servico ALTER COLUMN id_medida DROP NOT NULL;
        ALTER TABLE servico ALTER COLUMN id_desenho DROP NOT NULL;
        ALTER TABLE servico ALTER COLUMN id_recap DROP NOT NULL;

        -- Sync sequence with current max ID (in case it wasn't None)
        PERFORM setval('servico_id_seq', COALESCE((SELECT MAX(id) FROM servico), 0) + 1, false);
        
        -- Link sequence to column
        ALTER SEQUENCE servico_id_seq OWNED BY servico.id;
    END $$;
    """
    
    with engine.connect() as conn:
        print("Applying SQL fix for auto-increment on 'servico.id'...")
        conn.execute(text(sql))
        conn.commit()
        print("Fix applied successfully.")

if __name__ == "__main__":
    apply_fix()
