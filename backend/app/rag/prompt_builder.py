def build_rag_prompt(question: str, chunks: list) -> str:
    """
    Construct a strict, production-grade RAG prompt.
    """

    # Build context block
    context = ""
    for c in chunks:
        context += f"[Chunk {c['chunk_index']}]\n{c['text']}\n\n"

    prompt = f"""
You are an AI assistant for a Retrieval-Augmented Generation (RAG) system.

Your rules:
1. You MUST answer using ONLY the information contained in the CONTEXT.
2. If the CONTEXT does not include the answer, reply EXACTLY:
   "I cannot find this information in the provided documents."
3. You MUST cite sources using [Chunk X] whenever you provide an answer.
4. Do NOT use external knowledge.
5. Do NOT guess or infer details that are not explicitly in the CONTEXT.
6. Keep the answer concise and factual.

CONTEXT:
{context}

QUESTION:
{question}

Provide the answer in **valid JSON** with this format only:

{{
  "answer": "<your answer here>",
  "sources": ["Chunk X", "Chunk Y"]
}}

Do not add any explanation outside the JSON.
"""
    return prompt
