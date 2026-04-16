import os

file_path = 'frontend/src/pages/Clientes.tsx'

# Try to read with different encodings
content = None
for enc in ['utf-8', 'latin-1', 'cp1252']:
    try:
        with open(file_path, 'r', encoding=enc) as f:
            content = f.read()
            print(f"Read successful with {enc}")
            break
    except:
        continue

if content:
    # 1. Fix broken characters for 'Não'
    # It often appears as 'No' or 'N\ufffdo' or similar in corrupted UTF-8
    import re
    content = re.sub(r"N.o", "Não", content) # Simple regex for N?o

    # 2. Add 'ativo' sync in handleChange
    if "if (id === 'ativo') {" not in content:
        old_handle = """    } else {
      setFormData(prev => ({
        ...prev,
        [id]: type === 'checkbox' ? checked : value
      }));
    }"""
        new_handle = """    } else {
      setFormData(prev => ({
        ...prev,
        [id]: type === 'checkbox' ? checked : value
      }));
      
      if (id === 'ativo') {
        setFormData(prev => ({
          ...prev,
          contato: { ...prev.contato, ativo: checked }
        }));
      }
    }"""
        content = content.replace(old_handle, new_handle)

    # 3. Wrap boolean items in labels
    # We'll use a loop to find all occurrences of the switch block and wrap them
    # Pattern to find: 
    # <div className="bool-item">
    #     <span className="bool-title">(TITLE)</span>
    #     <div className="switch-wrapper">
    #         <label className="switch">
    #             <input type="checkbox" id="(ID)" checked={formData.contato.(FIELD)} onChange={handleChange} />
    #             <span className="slider"></span>
    #         </label>
    #         <span className="switch-text">{formData.contato.(FIELD) ? 'Sim' : 'Não'}</span>
    #     </div>
    # </div>

    # Simple approach: replace the common tags since they are identical
    content = content.replace('<div className="bool-item">', '<div className="bool-item-to-replace">') # temporary tag to identify
    
    # We'll target specific IDs for the htmlFor
    fields = [
        ('contribuinte', 'Contribuinte'),
        ('consumidor', 'Consumidor Final'),
        ('flagcliente', 'É Cliente'),
        ('flagfornecedor', 'É Fornecedor'),
        ('flagtranspotador', 'É Transportador'),
        ('flagcolaborador', 'É Colaborador'),
        ('flagvendedor', 'É Vendedor'),
        ('ativo', 'Cadastro Ativo')
    ]

    for field, title in fields:
        old_block = f"""                        <div className="bool-item">
                            <span className="bool-title">{title}</span>
                            <div className="switch-wrapper">
                                <label className="switch">
                                    <input type="checkbox" id="contato.{field}" checked={{formData.contato.{field}}} onChange={{handleChange}} />
                                    <span className="slider"></span>
                                </label>
                                <span className="switch-text">{{formData.contato.{field} ? 'Sim' : 'Não'}}</span>
                            </div>
                        </div>"""
        
        # Note: the actual content might have the broken 'Não' which we already replaced in step 1.
        # But wait, step 1 replaced ALL 'N.o' so it should match 'Não' now.

        new_block = f"""                        <label className="bool-item" htmlFor="contato.{field}">
                            <span className="bool-title">{title}</span>
                            <div className="switch-wrapper">
                                <div className="switch">
                                    <input type="checkbox" id="contato.{field}" checked={{formData.contato.{field}}} onChange={{handleChange}} />
                                    <span className="slider"></span>
                                </div>
                                <span className="switch-text">{{formData.contato.{field} ? 'Sim' : 'Não'}}</span>
                            </div>
                        </label>"""
        
        # To be safe, we'll try to find the block ignoring some whitespace or using the corrupted 'Não' if it failed
        if old_block in content:
            content = content.replace(old_block, new_block)
        else:
            print(f"Could not find block for {field} exactly")

    # Write back as UTF-8
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("File saved as UTF-8 with improvements.")
else:
    print("Could not read file.")
