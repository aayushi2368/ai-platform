const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

import api from "../../../lib/apiClient";

export async function uploadPdf(file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await api.post("/rag/upload", fd);
  return res.data;
}

export async function askQuestion(documentId, question, topK = 5) {
  const res = await fetch(`${BASE}/rag/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question, top_k: topK }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
