from backend.database import SessionLocal
from backend.app.models.usuario import Usuario
import sys
import os

# Add current dir to path
sys.path.append(os.getcwd())

def debug_users():
    db = SessionLocal()
    try:
        users = db.query(Usuario).all()
        print(f"Total users: {len(users)}")
        for u in users:
            print(f"ID: {u.id} | Email: '{u.email}' | Active: {u.is_active} | Super: {u.is_superuser}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_users()
