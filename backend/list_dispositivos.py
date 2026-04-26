from backend.database import SessionLocal
from backend.app.models.dispositivo import Dispositivo

db = SessionLocal()
try:
    dispositivos = db.query(Dispositivo).all()
    print(f"Total de dispositivos: {len(dispositivos)}")
    for d in dispositivos:
        print(f"ID: {d.id} | Android_ID: {d.android_id} | Modelo: {d.modelo} | Autorizado: {d.autorizado}")
finally:
    db.close()
