from groq import Groq
import os
import json

api_key = os.getenv("GROQ_API_KEY")

if api_key is None:
    raise ValueError("GROQ_API_KEY is missing. Make sure .env is loaded.")

client = Groq(api_key=api_key)



def ask_llm(prompt: str, model: str = "llama-3.3-70b-versatile"):
  
  response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a helpful assistant that answers questions using the provided context. Cite sources by chunk index."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=400
    )
  
  raw = response.choices[0].message.content
  print(response.choices)
  try:
    parsed = json.loads(raw)
  except json.JSONDecodeError:
    # fallback: treat whole text as answer
    parsed = {
        "answer": raw,
        "sources": []
    }

  
  return parsed

