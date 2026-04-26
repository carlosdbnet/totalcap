from backend.database import SessionLocal
from backend.app.models.dispositivo import Dispositivo

db = SessionLocal()
try:
    # Verifica se já existe
    existing = db.query(Dispositivo).filter(Dispositivo.android_id == "ABC123XYZ").first()
    if not existing:
        dev = Dispositivo(
            android_id="ABC123XYZ",
            modelo="Samsung Galaxy S21",
            usuario_logado="admin",
            autorizado=False
        )
        db.add(dev)
        db.commit()
        print("Dispositivo de teste criado: ABC123XYZ")
    else:
        print("Dispositivo de teste já existe.")
finally:
    db.close()
