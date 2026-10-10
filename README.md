# Personal Resume ATS Optimizer

A web app to **score your resume for ATS (Applicant Tracking System) parsers**, compare it against a **job description**, and **generate a tailored resume** in a side-by-side workspace.

## Features

- **Live ATS score** — contact info, sections, formatting, action verbs, metrics, and length
- **Side-by-side editors** — resume on the left, job description on the right
- **JD keyword match** — matched vs missing terms with weighted match percentage
- **One-click tailoring** — summary, skills, and experience bullets aligned to the JD
- **Before / after preview** — compare original and optimized text
- **Export** — copy or download optimized resume as `.txt`
- **Sample data** — load a demo resume and JD to try the flow instantly

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- TypeScript, Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43123](http://localhost:43123).

## License

MIT
