import bcrypt
from passlib.context import CryptContext

def test_bcrypt():
    pwd = "admin123"
    print(f"Testing bcrypt with password: '{pwd}'")
    
    # Direct bcrypt test
    try:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pwd.encode('utf-8'), salt)
        print(f"Direct bcrypt hash: {hashed}")
        
        matches = bcrypt.checkpw(pwd.encode('utf-8'), hashed)
        print(f"Direct bcrypt match: {matches}")
    except Exception as e:
        print(f"Direct bcrypt error: {e}")

    # Passlib test
    try:
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed = pwd_context.hash(pwd)
        print(f"Passlib BCCRYPT hash: {hashed}")
        
        matches = pwd_context.verify(pwd, hashed)
        print(f"Passlib match: {matches}")
    except Exception as e:
        print(f"Passlib error: {e}")

if __name__ == "__main__":
    test_bcrypt()
