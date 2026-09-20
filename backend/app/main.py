from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.parser import parse_resume
from app.services.scorer import analyze_resume
from app.services.ai import suggest_fix

app = FastAPI(title="Personal Resume ATS Optimizer", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])

class AnalyzeRequest(BaseModel):
    resume_text: str
    job_description: str

class SuggestRequest(BaseModel):
    current_text: str
    resume_text: str
    job_description: str

@app.get("/health")
def health():
    return {"status": "ok", "local_only": True}

@app.post("/parse-resume")
async def parse(file: UploadFile = File(...)):
    try:
        text = parse_resume(file.filename or "", await file.read())
        return {"filename": file.filename, "text": text}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    return analyze_resume(req.resume_text, req.job_description)

@app.post("/suggest-fix")
def fix(req: SuggestRequest):
    return suggest_fix(req.current_text, req.resume_text, req.job_description)
