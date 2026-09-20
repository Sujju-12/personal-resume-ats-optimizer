import os
import httpx

def suggest_fix(current, resume, jd):
    base=os.getenv("OLLAMA_BASE_URL","http://localhost:11434")
    model=os.getenv("OLLAMA_MODEL","qwen2.5:3b")
    prompt=f"""Rewrite the CURRENT resume point for ATS relevance against the JOB DESCRIPTION.
Never invent experience, tools, metrics, employers, projects, certifications, or responsibilities.
Only use facts supported by the FULL RESUME. Return only the improved point.

JOB DESCRIPTION:
{jd}

FULL RESUME:
{resume}

CURRENT:
{current}
"""
    try:
        r=httpx.post(f"{base}/api/generate",json={"model":model,"prompt":prompt,"stream":False},timeout=120)
        r.raise_for_status()
        return {"suggestion":r.json().get("response","").strip(),"provider":"ollama"}
    except Exception as exc:
        return {"suggestion":current,"provider":"unavailable","error":str(exc)}
