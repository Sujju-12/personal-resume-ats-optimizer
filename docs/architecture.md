# Architecture

The application is local-first.

1. Next.js provides the two-panel interface.
2. FastAPI receives resume text/files and job descriptions.
3. PDF/DOCX parsing converts documents into text.
4. The ATS engine calculates a deterministic score from keyword, semantic, structure, and achievement signals.
5. Ollama provides wording suggestions locally.
6. Apply Fix creates a reversible resume version.
7. No personal resume/JD data belongs in Git.