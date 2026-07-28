import io
import re
import pdfplumber


def extract_text_from_pdf(file_bytes: bytes) -> str:
    
    """
    Input: raw file bytes of a PDF.
    Output: a single cleaned text string for the whole document.
    """

    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text_parts.append(page_text)

    raw_text = "\n\n".join(text_parts)
    return _clean_text(raw_text)

def _clean_text(s: str) -> str:
    s = s.replace("-\n", "")  # join hyphenated line breaks
    s = s.replace("\r", "\n")
    s = re.sub(r"\n{3,}", "\n\n", s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"Page \d+ of \d+\s*", "", s, flags=re.IGNORECASE)
    return s.strip()

    
      
    