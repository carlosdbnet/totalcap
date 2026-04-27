import os
import json
import base64
from openai import OpenAI
import google.generativeai as genai
from backend.config import settings

def analyze_tire_image(base64_image: str, custom_instructions: str = None, tipo_documento: str = 'pneu'):
    """
    Analisa uma imagem de Ordem de Serviço (OS) ou Cupom Fiscal e extrai dados estruturados.
    """
    # Se a imagem vier com o prefixo 'data:image/jpeg;base64,', removemos
    if "," in base64_image:
        base64_image = base64_image.split(",")[1]

    if tipo_documento == 'despesa':
        prompt = (
            "Aja como um assistente de departamento financeiro especializado em ler cupons fiscais e recibos, "
            "especialmente Cupons Fiscais de Posto de Gasolina e despesas de viagem.\n"
            "Se for um cupom fiscal de posto de gasolina, procure a placa do veículo se estiver impressa e converta a quantidade abastecida. No topo do documento existe um CNPJ que será sempre o do Fornecedor. Se existir um outro CPF ou CNPJ no rodapé do documento (consumidor), este será o do cliente e não deve ser confundido com o do Fornecedor.\n"
            "Analise a imagem do comprovante e extraia os dados ESTRITAMENTE para o formato JSON abaixo.\n\n"
            "O que você precisa encontrar:\n"
            "1. CABEÇALHO: 'nome' (Razão Social ou Fantasia do posto/restaurante), 'cpfcnpj' (CNPJ do emissor), 'data' (Data de emissão), 'veiculo' ou 'placa', 'km' (Quilometragem se houver).\n"
            "   - No campo 'tipo', identifique se a despesa primária é: Combustível, Pedágio, Refeição, Manutenção ou Outros.\n"
            "2. ITENS: Para cada produto/serviço, extraia os valores buscando também por abreviações:\n"
            "   - 'descricao': nome do produto/serviço\n"
            "   - 'quantidade': busque por campos como 'qtde', 'quant', 'quantidade', 'lts' ou 'litros'\n"
            "   - 'valor_unitario': busque por 'valor unitário', 'valor unit', 'vl unit' ou preço por litro\n"
            "   - 'valor_total': busque por 'valor', 'valor total', 'total' ou 'vtotal'\n"
            "   - 'tipo': classifique (Combustível, Pedágio, etc)\n"
            "   - IMPORTANTE: Para postos de gasolina, procure e diferencie itens como: Gasolina, Álcool, Etanol, Diesel, S10.\n"
            "3. RODAPÉ: O 'valor_total' informando o Total/Valor Final pago na nota fiscal.\n\n"
            "REGRAS DE CNPJ/CPF:\n"
            "- O CNPJ localizado no TOPO do documento é sempre o do Fornecedor (Emissor).\n"
            "- Se houver um CPF ou CNPJ no RODAPÉ (comumente identificado como Consumidor), este é o do CLIENTE e NÃO deve ser usado no campo 'cpfcnpj' do cabeçalho.\n\n"
            "REGRAS GERAIS:\n"
            "- Se não encontrar ou não tiver certeza, deixe a string vazia: \"\".\n"
            "- Converta os valores monetários e quantidades mas pode retornar em string (ex: '150.50').\n"
            "- Você DEVE retornar EXATAMENTE esta estrutura JSON:\n"
            "{\n"
            "  \"cabecalho\": {\n"
            "    \"nome\": \"\", \"cpfcnpj\": \"\", \"data\": \"\", \"veiculo\": \"\", \"km\": \"\", \"tipo\": \"\"\n"
            "  },\n"
            "  \"itens\": [\n"
            "    {\"descricao\": \"\", \"quantidade\": \"\", \"valor_unitario\": \"\", \"valor_total\": \"\", \"tipo\": \"\"}\n"
            "  ],\n"
            "  \"rodape\": {\"valor_total\": \"\"},\n"
            "  \"raw_text\": \"Explique rapidamente se teve dificuldade\"\n"
            "}\n"
        )
    else:
        # Prompt padrão para pneus
        prompt = (
            "Aja como um assistente super atento especializado em leitura de Ordens de Serviço (OS) de pneus. "
            "Analise a imagem e transcreva os dados ESTRITAMENTE para o formato JSON abaixo.\n\n"
            
            "O que você precisa encontrar (fique muito atento a números e códigos):\n"
            "1. CABEÇALHO: 'numos', 'cpfcnpj', 'nome' (do cliente), 'endereco', 'cidade', 'uf', 'fone', 'veiculo' (Placa), 'formapagto', 'vendedor_ocr', 'servicocomgarantia' (Sim/Não), 'tipoveiculo' (Caminhão, Carro, etc).\n"
            "   - Fique atento a etiquetas como 'somentesepar' ou 'podealterardesenho' and marque se presentes.\n"
            "2. ITENS (Pneus): Para cada linha de pneu, extraia: 'medida', 'marca', 'numserie', 'numfogo', 'desenho'.\n"
            "   - IMPORTANTE: Se o conteúdo de uma célula for um sinal de aspas duplas (\"), repita o valor da linha superior!!\n"
            "   - FORMATO DE MEDIDA: Remova todos os espaços (ex: 295/80R22.5).\n"
            "3. RODAPÉ: O 'vendedor_ocr' (se não estiver no topo) e observações extras.\n\n"
            
            "REGRAS:\n"
            "- Se não encontrar ou não tiver certeza absoluta, deixe a string vazia: \"\".\n"
            "- Você DEVE retornar EXATAMENTE esta estrutura JSON:\n"
            "{\n"
            "  \"cabecalho\": {\n"
            "    \"numos\": \"\", \"cpfcnpj\": \"\", \"nome\": \"\", \"endereco\": \"\", \"cidade\": \"\", \"uf\": \"\", \"fone\": \"\",\n"
            "    \"veiculo\": \"\", \"formapagto\": \"\", \"vendedor_ocr\": \"\", \"servicocomgarantia\": \"\", \"tipoveiculo\": \"\",\n"
            "    \"somentesepar\": \"\", \"podealterardesenho\": \"\"\n"
            "  },\n"
            "  \"itens\": [\n"
            "    {\"medida\": \"\", \"marca\": \"\", \"numserie\": \"\", \"numfogo\": \"\", \"desenho\": \"\", \"dot\": \"\"}\n"
            "  ],\n"
            "  \"rodape\": {\"vendedor_assinatura\": \"\", \"obs_final\": \"\"},\n"
            "  \"raw_text\": \"Explique rapidamente se teve dificuldade com algum campo\"\n"
            "}\n"
        )

    if custom_instructions:
        prompt += f"\n\nInstruções Adicionais do Usuário: {custom_instructions}"

    try:
        if settings.AI_PROVIDER == "gemini":
            result = _analyze_with_gemini(base64_image, prompt)
        else:
            result = _analyze_with_openai(base64_image, prompt)
            
        # Compatibilidade com o Frontend Antigo:
        # Pega a primeira linha de itens e coloca no nível raiz do JSON
        if result.get("itens") and len(result["itens"]) > 0:
            first_item = result["itens"][0]
            for key, value in first_item.items():
                if key not in result:
                    result[key] = value
        
        result["provedor"] = settings.AI_PROVIDER
        return result
    except Exception as e:
        print(f"Erro no OCR Service ({settings.AI_PROVIDER}): {e}")
        raise e

def _analyze_with_openai(base64_image: str, prompt: str):
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY não configurada. Se estiver no Vercel, configure esta variável no Dashboard do Projeto.")
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        },
                    },
                ],
            }
        ],
        max_tokens=1000,
        response_format={ "type": "json_object" }
    )
    result_content = response.choices[0].message.content
    return json.loads(result_content)

def _analyze_with_gemini(base64_image: str, prompt: str):
    if not settings.GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY não configurada. Se estiver no Vercel, configure esta variável no Dashboard do Projeto.")
        
    # Log da chave para conferência (apenas os primeiros caracteres)
    masked_key = settings.GOOGLE_API_KEY[:6] + "..." + settings.GOOGLE_API_KEY[-4:]
    print(f"--- [OCR DEBUG] Usando API Key: {masked_key} ---")
    print(f"--- [OCR DEBUG] Iniciando chamada para o Gemini ({len(base64_image)} bytes de imagem) ---")
    
    # Força o uso de REST em vez de GRPC (mais estável em alguns ambientes Windows)
    genai.configure(api_key=settings.GOOGLE_API_KEY, transport='rest')
    
    # Configuração de Segurança
    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
    ]

    try:
        model = genai.GenerativeModel(
            model_name='gemini-flash-latest',
            generation_config={"response_mime_type": "application/json"},
            safety_settings=safety_settings
        )
        
        image_part = {
            "mime_type": "image/jpeg",
            "data": base64_image
        }
        
        print("--- [OCR DEBUG] Aguardando resposta da IA... ---")
        response = model.generate_content([prompt, image_part])
        
        # Verifica se houve resposta válida
        if not response.candidates:
            print("--- [OCR DEBUG] ERRO: Nenhuma resposta gerada pela IA (posssível bloqueio). ---")
            raise ValueError("A IA não gerou uma resposta válida para esta imagem.")

        print("--- [OCR DEBUG] Resposta recebida com sucesso. ---")
        
        # Limpeza e extração robusta do objeto JSON
        text_response = response.text.strip()
        
        # Remove eventuais marcações de bloco de código markdown
        if "```json" in text_response:
            text_response = text_response.split("```json")[-1].split("```")[0].strip()
        elif "```" in text_response:
            text_response = text_response.split("```")[-1].split("```")[0].strip()
            
        # Tenta encontrar o início do objeto JSON
        start_idx = text_response.find('{')
        if start_idx == -1:
            raise ValueError(f"A IA não retornou um objeto JSON válido: {text_response[:100]}")
            
        text_to_decode = text_response[start_idx:]
        
        try:
            # raw_decode ignora qualquer texto que venha após o primeiro objeto JSON completo
            decoder = json.JSONDecoder()
            obj, _ = decoder.raw_decode(text_to_decode)
            return obj
        except json.JSONDecodeError as jde:
            print(f"--- [OCR DEBUG] Falha no raw_decode: {jde} ---")
            # Fallback para o comportamento padrão se for um erro simples
            return json.loads(text_to_decode)
        
    except Exception as e:
        print(f"--- [OCR DEBUG] ERRO NO GEMINI: {str(e)} ---")
        # Se o erro for de JSON malformado, tenta extrair o texto puro caso exista
        try:
             if hasattr(response, 'text'):
                print(f"--- [OCR DEBUG] Texto Bruto da Falha: {response.text[:1000]}... ---")
        except:
            pass
        raise e
