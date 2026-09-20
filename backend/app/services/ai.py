import os
import httpx

def suggest_fix(current, resume, jd):
    base = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    prompt = f"""You are a resume wording assistant.

Rewrite ONLY the CURRENT resume point for stronger ATS relevance to the JOB DESCRIPTION.

STRICT RULES:
- Never invent experience, tools, metrics, employers, projects, certifications, or responsibilities.
- Only use facts explicitly supported by the FULL RESUME.
- Do not add a missing JD technology unless the FULL RESUME already proves the user used it.
- Prefer concrete action + technology + outcome wording when those facts exist.
- Preserve the original meaning.
- Return only one improved resume bullet, with no explanation.

JOB DESCRIPTION:
{jd}

FULL RESUME:
{resume}

CURRENT:
{current}
"""
    try:
        r = httpx.post(
            f"{base}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=120,
        )
        r.raise_for_status()
        suggestion = r.json().get("response", "").strip()
        return {"suggestion": suggestion or current, "provider": "ollama"}
    except Exception as exc:
        return {"suggestion": current, "provider": "unavailable", "error": str(exc)}
