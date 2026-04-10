import os
import json
from cryptography.fernet import Fernet
from fastapi import HTTPException
import openai
import google.generativeai as genai
import anthropic

# Configuration for Encryption
# In production, ensure ENCRYPTION_KEY is set in the .env file
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

_fernet_instance = None

def get_fernet():
    global _fernet_instance
    if _fernet_instance is None:
        if not ENCRYPTION_KEY:
            # Fallback for dev only. If server restarts, keys will be unrecoverable!
            print("WARNING: ENCRYPTION_KEY not set in environment. Using a temporary key. Do not use in production!")
            temp_key = Fernet.generate_key()
            _fernet_instance = Fernet(temp_key)
        else:
            _fernet_instance = Fernet(ENCRYPTION_KEY.encode())
    return _fernet_instance

def encrypt_token(token: str) -> str:
    if not token:
        return None
    f = get_fernet()
    return f.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    if not encrypted_token:
        return None
    f = get_fernet()
    return f.decrypt(encrypted_token.encode()).decode()

def get_insights_prompt(make: str, model: str, year: int, current_km: int, history: list) -> str:
    if not history:
        history_text = "Nenhuma manutenção registrada ainda."
    else:
        history_text_lines = []
        for h in history:
            dp = h['date_performed']
            if isinstance(dp, str):
                dp_str = dp.split('T')[0]
            elif hasattr(dp, 'strftime'):
                dp_str = dp.strftime('%Y-%m-%d')
            else:
                dp_str = str(dp) or "Data desconhecida"
            km = h.get('km_performed', 0)
            m_type = h.get('maintenance_type', 'Desconhecido')
            history_text_lines.append(f"- {dp_str} ({km}km): {m_type}")
        history_text = "\n".join(history_text_lines)
    
    return f"""Aja como um mecânico especialista premium da marca {make}.
O cliente tem o veículo {make} {model} ano {year} com {current_km}km.
De acordo com o histórico de manutenções realizadas:
{history_text}

Baseado nos problemas crônicos conhecidos deste veículo e na quilometragem atual, indique as próximas manutenções preventivas urgentes e liste os problemas crônicos comuns deste modelo.

Você DEVE retornar APENAS um objeto JSON válido, sem nenhum texto adicional fora do JSON, contendo exatamente duas chaves:
{{
  "chronic_issues": ["problema 1 explicativo", "problema 2 explicativo"],
  "suggested_maintenance": ["manutenção urgente 1 descritiva", "manutenção 2 descritiva"]
}}"""

def get_normalization_prompt(input_names: list) -> str:
    names_str = "', '".join(input_names)
    return f"""Você é um sistema de normalização de dados automotivos.
O usuário quer padronizar serviços de manutenção que podem ter sido digitados de formas diferentes.
Analise a seguinte lista de entrada: ['{names_str}']

Com base nela, determine um único nome padronizado ideal, claro e conciso para este serviço (ex: "Troca do Óleo do Motor" ao invés de "trocar oleo").

Você DEVE retornar APENAS um objeto JSON válido, sem nenhum texto adicional fora do JSON, contendo exatamente a chave:
{{
  "normalized_name": "Nome Padronizado Único"
}}"""

import re

def clean_json_response(content: str) -> dict:
    content = content.strip()
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if match:
        content = match.group(0)
    try:
        return json.loads(content)
    except Exception:
        raise ValueError("Resposta não é um JSON válido.")

def call_llm(prompt: str, provider: str, api_key: str) -> dict:
    if provider == "openai":
        client = openai.OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini", # using a fast model
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        return clean_json_response(response.choices[0].message.content)
        
    elif provider == "gemini":
        genai.configure(api_key=api_key)
        # using the latest solid model
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        return clean_json_response(response.text)
        
    elif provider == "claude":
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return clean_json_response(response.content[0].text)
        
    else:
        raise HTTPException(status_code=400, detail="Provedor de IA inválido ou não suportado.")

def generate_vehicle_insights(make: str, model: str, year: int, current_km: int, history: list, provider: str, encrypted_key: str):
    decrypted_key = decrypt_token(encrypted_key)
    if not decrypted_key:
        raise HTTPException(status_code=400, detail="Chave de API não configurada.")
    prompt = get_insights_prompt(make, model, year, current_km, history)
    try:
        return call_llm(prompt, provider, decrypted_key)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao se comunicar com a IA ({provider}): {str(e)}")

def normalize_maintenance_name(input_names: list, provider: str, encrypted_key: str):
    decrypted_key = decrypt_token(encrypted_key)
    if not decrypted_key:
        raise HTTPException(status_code=400, detail="Chave de API não configurada.")
    prompt = get_normalization_prompt(input_names)
    try:
        return call_llm(prompt, provider, decrypted_key)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao se comunicar com a IA ({provider}): {str(e)}")
