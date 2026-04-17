
import sys
import os

# Adiciona o diretório atual ao sys.path para encontrar o pacote backend
sys.path.append(os.getcwd())

from backend.app.core.security import verify_password, get_password_hash
from backend.database import SessionLocal
from backend.app.models.usuario import Usuario

def check():
    db = SessionLocal()
    try:
        admin = db.query(Usuario).filter(Usuario.email == 'admin@totalcap.com').first()
        if not admin:
            print("ERRO: Usuário admin@totalcap.com não encontrado no banco!")
            return
        
        print(f"Usuário encontrado: {admin.email}")
        print(f"Hash no banco: {admin.hashed_password}")
        
        test_pw = "admin123"
        is_valid = verify_password(test_pw, admin.hashed_password)
        print(f"Verificação de '{test_pw}': {'SUCESSO' if is_valid else 'FALHA'}")
        
        if not is_valid:
            print("Reparando senha para 'admin123'...")
            admin.hashed_password = get_password_hash(test_pw)
            db.commit()
            print("Senha reparada com sucesso!")
    finally:
        db.close()

if __name__ == "__main__":
    check()
