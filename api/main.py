from fastapi import FastAPI

app = FastAPI()

@app.get("/api/health")
def health():
    return {"status": "ok", "source": "direct_main_py"}

@app.get("/api/v1/ping")
def ping():
    return {"status": "ok", "message": "API Main is alive!"}

@app.post("/api/v1/login/access-token")
def mock_login():
    return {"status": "debug", "message": "Routing to login is working!"}
