import chardet

with open('frontend/src/pages/Clientes.tsx', 'rb') as f:
    result = chardet.detect(f.read())
    print(result)
