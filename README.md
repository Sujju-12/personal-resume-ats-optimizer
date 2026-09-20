# Personal Resume ATS Optimizer

Private, local-first ATS-style resume optimization tool.

## Features
- PDF/DOCX resume parsing
- Job-description analysis
- Deterministic ATS-style scoring
- Matched, related, and missing skills
- Local Ollama AI suggestions
- Apply Fix, Undo/Redo, and version history
- No hosted database or resume uploads

> The score is an ATS-style simulation, not an employer's proprietary ATS score.

## Architecture

Next.js + TypeScript UI -> FastAPI -> Parser / ATS Engine / Local Ollama

## Run

Backend:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

Optional local AI:
```bash
ollama pull qwen2.5:3b
```

Never commit personal resumes or job descriptions.