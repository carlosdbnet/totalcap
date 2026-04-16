import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"

endpoints = [
    '/clientes/',
    '/vendedores/',
    '/transportadoras/',
    '/medidas/',
    '/marcas/',
    '/desenhos/',
    '/servicos/',
    '/tipo-recapagem/'
]

def test_endpoints():
    print(f"Testando endpoints em {BASE_URL}...")
    for ep in endpoints:
        url = f"{BASE_URL}{ep}"
        try:
            r = requests.get(url, timeout=5)
            print(f"GET {url} -> {r.status_code}")
            if r.status_code != 200:
                print(f"  ERRO: {r.text}")
        except Exception as e:
            print(f"GET {url} -> FALHA DE CONEXÃO: {e}")

if __name__ == "__main__":
    test_endpoints()
