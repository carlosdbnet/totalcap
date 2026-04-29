import sys
import os

# Adiciona a raiz ao path
sys.path.append(os.getcwd())

from backend.database import engine, Base
import backend.app.models as models

def init_remote():
    print("Iniciando criação de tabelas no NEON...")
    try:
        # Garante que todos os modelos no __init__.py foram carregados
        Base.metadata.create_all(bind=engine)
        print("Tabelas criadas com sucesso!")
        
        # Criar admin inicial se nao existir
        from backend.database import SessionLocal
        from backend.app.core.security import get_password_hash
        from backend.config import settings
        from backend.app.models.usuario import Usuario
        
        db = SessionLocal()
        admin = db.query(Usuario).filter(Usuario.email == settings.FIRST_SUPERUSER).first()
        if not admin:
            print(f"Criando admin: {settings.FIRST_SUPERUSER}")
            new_admin = Usuario(
                nome="Admin Totalcap",
                email=settings.FIRST_SUPERUSER,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                is_active=True,
                is_superuser=True
            )
            db.add(new_admin)
            db.commit()
            print("Admin criado!")
        else:
            print("Admin já existe.")
        db.close()
        
    except Exception as e:
        print(f"ERRO: {e}")

if __name__ == "__main__":
    init_remote()
