# Personal Resume ATS Optimizer

Score your resume for **ATS (Applicant Tracking System)** parsers, compare it to a **job description (JD)**, and generate a **tailored resume** in a side-by-side workspace.

Live repo: [github.com/Sujju-12/personal-resume-ats-optimizer](https://github.com/Sujju-12/personal-resume-ats-optimizer)

This repository contains **only** the Personal Resume ATS Optimizer web app (Next.js under `src/` plus root config). It does not include cloud-agent metadata, `node_modules`, or other unrelated projects.

## Features

- Live **ATS score** (contact, sections, formatting, verbs, metrics, length)
- **Side-by-side** resume + job description editors
- **JD keyword match** with matched vs missing terms
- **Tailor resume to JD** with before/after preview
- Copy or download the optimized resume as `.txt`
- **Load sample** resume and JD to try the app instantly

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (LTS recommended)
- npm (comes with Node)

## Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/Sujju-12/personal-resume-ats-optimizer.git
cd personal-resume-ats-optimizer
npm install
```

You must run `npm install` **inside the folder that contains `package.json`** (the repo root after clone). If you see `ENOENT ... package.json`, your folder is empty or not a full clone—use a fresh clone (steps below).

### Troubleshooting `ENOENT package.json`

On GitHub, `package.json` lives at the **root** of the repo (same level as `README.md` and `src/`). If it is missing locally:

```bash
cd /mnt/s/personal-resume-ats-optimizer
ls -la package.json README.md src
```

If `package.json` is missing, re-clone into a new directory:

```bash
cd /mnt/s
mv personal-resume-ats-optimizer personal-resume-ats-optimizer.old   # optional backup
git clone https://github.com/Sujju-12/personal-resume-ats-optimizer.git
cd personal-resume-ats-optimizer
ls package.json
npm install
npm run dev
```

If the folder is already a git repo but outdated:

```bash
git remote -v
git pull origin main
ls package.json
```

## Run the app

```bash
npm run dev
```

Open **http://localhost:43123** in your browser.

For a production build:

```bash
npm run build
npm start
```

## How to use

### 1. Add your resume

- Paste **plain text** into **Your resume** (left panel), or click **Upload .txt** for a `.txt` / `.md` file.
- Use standard headings (`EXPERIENCE`, `SKILLS`, `EDUCATION`), simple bullets (`-`), and avoid tables or images for best ATS results.

### 2. Add the job description

- Paste the full posting into **Job description** (right panel), including requirements, responsibilities, and skills.

### 3. Read your scores

- **ATS score** — how parser-friendly your resume is (updates as you type).
- **JD match** — how well your resume keywords align with the posting.

### 4. Tailor your resume

- Click **Tailor resume to this JD**.
- Open the **Optimized** tab for a **Before / After** view and a list of changes.
- Use **Copy** or **Download** to save the tailored version.

### 5. Improve further

- **ATS checks** — fix failing checklist items (email, bullets, metrics, etc.).
- **Keywords** — add missing terms naturally into experience or skills.

### Quick demo

Click **Load sample** on the home page to populate a demo resume and JD, then run **Tailor resume to this JD**.

## What's in this repo

| Area | Files |
|------|--------|
| App UI | `src/components/resume-workspace.tsx`, `src/components/score-ring.tsx` |
| ATS logic | `src/lib/ats-analyzer.ts`, `jd-matcher.ts`, `resume-optimizer.ts`, `text-utils.ts` |
| Next.js | `src/app/*`, `next.config.ts`, `package.json` |

## Tech stack

Next.js 16, TypeScript, Tailwind CSS, shadcn/ui

## License

MIT
