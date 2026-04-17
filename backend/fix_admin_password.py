from backend.database import SessionLocal
from backend.app.models.usuario import Usuario
from backend.app.core.security import get_password_hash
from backend.config import settings

def fix_admin():
    db = SessionLocal()
    try:
        user = db.query(Usuario).filter(Usuario.email == settings.FIRST_SUPERUSER).first()
        if user:
            print(f"Redefinindo senha para {user.email}...")
            user.hashed_password = get_password_hash(settings.FIRST_SUPERUSER_PASSWORD)
            db.commit()
            print("Senha redefinida com sucesso para 'admin123'")
        else:
            print(f"Usuario {settings.FIRST_SUPERUSER} nao encontrado.")
            print("Criando usuario administrador...")
            admin_user = Usuario(
                email=settings.FIRST_SUPERUSER,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                nome="Admin Totalcap",
                is_superuser=True,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Usuario administrador criado com sucesso.")
    except Exception as e:
        print(f"Erro ao redefinir senha: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_admin()
