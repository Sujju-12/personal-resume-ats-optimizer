# Personal Resume ATS Optimizer

A private, local-first ATS-style resume optimization workbench.

## What it does

1. Upload a PDF/DOCX resume or paste resume text.
2. Paste a target job description.
3. Run a deterministic ATS-style scan.
4. Inspect:
   - overall score and weighted breakdown;
   - matched, related, and missing skills;
   - required vs preferred JD skills;
   - target role terminology;
   - detected responsibilities;
   - deterministic optimization plan.
5. Select a resume bullet and ask local Ollama for an ATS-focused rewrite.
6. Apply the rewrite.
7. Automatically rescan the full resume.
8. See the real score delta produced by the change.
9. Undo, redo, restore versions, or export the current resume as TXT.

## Safety model

The local AI is a wording assistant, not the scoring authority. It is instructed not to invent tools, employers, metrics, projects, certifications, or responsibilities.

Missing JD technologies are not automatically inserted. A skill should only be added when the resume already contains truthful evidence for it.

## ATS score

The score is a deterministic simulation, not an employer's proprietary ATS score.

- Keywords: 45%
- Semantic similarity: 20%
- Structure: 10%
- Achievement evidence: 10%
- Experience alignment: 10%
- Job-title alignment: 5%

Every applied AI rewrite is rescanned. A rewrite is not treated as an improvement unless the deterministic score actually changes upward.

## Architecture

```
Next.js + TypeScript
        |
        v
FastAPI
  |       |       |
Parser  ATS     Ollama
  |      Engine    |
PDF/    scoring   local AI
DOCX      |
          v
     Optimization Plan
```

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### Local AI

Install Ollama separately and run:

```bash
ollama pull qwen2.5:3b
ollama serve
```

Optional environment variables are documented in `backend/.env.example`.

## Privacy

The application is designed for personal/local use. Resume and JD files are not committed to Git by the repository's `.gitignore`.

No hosted database is required.

## Limitations

This is an ATS-style simulation. Real employers use different ATS products, parsing rules, ranking systems, recruiter workflows, and job-specific configurations.

PDF/DOCX parsing extracts text; visual resume layout is not scored.

Version history is currently in browser memory and is not persisted to a database.

## Project structure

```
frontend/   Next.js UI
backend/    FastAPI, parser, scorer, local AI
docs/       architecture, scoring, AI guardrails
data/       local ignored workspace
```
