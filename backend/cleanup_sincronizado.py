import os

def clean_file(path, pattern, keep_first=True):
    print(f"Limpando arquivo: {path}")
    if not os.path.exists(path):
        print(f"Erro: Arquivo {path} nao encontrado.")
        return
    
    with open(path, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    found_count = 0
    for l in lines:
        if pattern in l:
            found_count += 1
            if keep_first and found_count == 1:
                print(f"Mantendo primeira ocorrencia na linha: {l.strip()}")
                new_lines.append(l)
            else:
                print(f"REMOVENDO ocorrencia redundante: {l.strip()}")
                continue
        else:
            new_lines.append(l)
            
    with open(path, 'w') as f:
        f.writelines(new_lines)

# Limpeza dos Modelos e Schemas
clean_file('backend/app/models/mobos.py', 'sincronizado = Column(Boolean')
clean_file('backend/app/schemas/mobos.py', 'sincronizado: Optional[bool]')

print("Limpeza concluida!")
