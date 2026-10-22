"use client";

import { useMemo, useRef, useState } from "react";
import { FileText, Upload, Download, Copy, Sparkles, X, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import { analyzeAts } from "@/lib/ats-analyzer";
import { analyzeJdMatch } from "@/lib/jd-matcher";
import { optimizeResumeForJd, SAMPLE_JD, SAMPLE_RESUME } from "@/lib/resume-optimizer";
import { ScoreRing } from "@/components/score-ring";
import { extensionToFormat, tailoredFileName, type ExportFormat, type ResumeFormat } from "@/lib/resume-document";

type UploadedResume = {
  file: File;
  format: ResumeFormat;
  previewUrl: string;
  previewHtml?: string;
};

const ACCEPTED = ".pdf,.docx,.doc,.txt,.text,.md,.markdown,.rtf,.html,.htm,.png,.jpg,.jpeg,.webp,.gif";
const MAX_FILE_BYTES = 12 * 1024 * 1024;

function formatLabel(format: ResumeFormat) {
  return ({ pdf: "PDF", docx: "Word DOCX", doc: "Word DOC", txt: "Text", md: "Markdown", rtf: "Rich Text", html: "HTML", image: "Image", other: "Document" } as Record<ResumeFormat, string>)[format];
}

export function ResumeWorkspace() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [resume, setResume] = useState(SAMPLE_RESUME);
  const [jobDescription, setJobDescription] = useState(SAMPLE_JD);
  const [tailored, setTailored] = useState("");
  const [changes, setChanges] = useState<string[]>([]);
  const [uploaded, setUploaded] = useState<UploadedResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const ats = useMemo(() => analyzeAts(resume), [resume]);
  const match = useMemo(() => analyzeJdMatch(resume, jobDescription), [resume, jobDescription]);
  const tailoredAts = useMemo(() => analyzeAts(tailored || resume), [tailored, resume]);
  const tailoredMatch = useMemo(() => analyzeJdMatch(tailored || resume, jobDescription), [tailored, resume, jobDescription]);

  function clearUploaded() {
    if (uploaded) URL.revokeObjectURL(uploaded.previewUrl);
    setUploaded(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function handleFile(file?: File) {
    if (!file) return;
    setError("");
    setNotice("");
    if (file.size > MAX_FILE_BYTES) {
      setError("Choose a file smaller than 12 MB.");
      return;
    }
    const format = extensionToFormat(file.name);
    if (format === "other") {
      setError("Unsupported file type. Upload PDF, DOC/DOCX, TXT, MD, RTF, HTML, or an image.");
      return;
    }
    setLoading(true);
    const previewUrl = URL.createObjectURL(file);
    try {
      if (format === "image") {
        setUploaded({ file, format, previewUrl });
        setNotice("Image preview loaded. Images do not contain extractable resume text here; paste or enter the text below for ATS analysis.");
        return;
      }
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/parse-resume", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not read this document.");
      if (!data.text?.trim()) throw new Error("No selectable text was found. This may be a scanned PDF; use OCR or paste the resume text manually.");
      setResume(data.text);
      setTailored("");
      setChanges([]);
      setUploaded({ file, format, previewUrl, previewHtml: data.previewHtml });
      setNotice("Resume imported. The original file is shown on the left; the tailored version will appear on the right after you tailor it.");
    } catch (e) {
      URL.revokeObjectURL(previewUrl);
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  function tailor() {
    const result = optimizeResumeForJd(resume, jobDescription);
    setTailored(result.optimized);
    setChanges(result.changes);
    setNotice("Tailored resume generated. Review every change for accuracy before using it.");
  }

  async function exportResume(format: ExportFormat) {
    const text = tailored || resume;
    if (!text.trim()) return;
    try {
      const response = await fetch("/api/export-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, fileName: tailoredFileName(uploaded?.file.name || "resume", format), plainText: text }),
      });
      if (!response.ok) throw new Error("Export failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = tailoredFileName(uploaded?.file.name || "resume", format);
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not export this resume. Please try again.");
    }
  }

  async function copyResume() {
    try {
      await navigator.clipboard.writeText(tailored || resume);
      setNotice("Resume copied to clipboard.");
    } catch {
      setError("Clipboard access was blocked by your browser.");
    }
  }

  function loadSample() {
    clearUploaded();
    setResume(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JD);
    setTailored("");
    setChanges([]);
    setError("");
    setNotice("Sample resume and job description loaded.");
  }

  const originalPreview = uploaded && (
    uploaded.format === "pdf" || uploaded.format === "image" ? (
      uploaded.format === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={uploaded.previewUrl} alt="Uploaded resume original" className="mx-auto max-h-[680px] max-w-full object-contain" />
      ) : <iframe title="Original uploaded resume" src={uploaded.previewUrl} className="h-[680px] w-full rounded-lg bg-white" />
    ) : uploaded.previewHtml ? (
      <iframe title="Formatted Word resume preview" srcDoc={uploaded.previewHtml} sandbox="" className="h-[680px] w-full rounded-lg bg-white" />
    ) : uploaded.format === "html" ? (
      <iframe title="Original HTML resume" src={uploaded.previewUrl} sandbox="" className="h-[680px] w-full rounded-lg bg-white" />
    ) : (
      <pre className="min-h-[400px] whitespace-pre-wrap break-words p-5 text-sm leading-6">{resume}</pre>
    )
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"><Sparkles size={14} /> Career toolkit</div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Resume ATS Optimizer</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Import your resume, compare it beside the tailored version, and align it to a specific job description.</p>
        </div>
        <button onClick={loadSample} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">Load sample</button>
      </header>

      {notice && <div role="status" className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{notice}</div>}
      {error && <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}

      <section className="mb-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><Upload size={18} /><h2 className="font-semibold">Upload your resume</h2></div>
          <input ref={fileInput} type="file" accept={ACCEPTED} className="sr-only" onChange={(e) => void handleFile(e.target.files?.[0])} />
          <button onClick={() => fileInput.current?.click()} disabled={loading} className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-7 text-center transition hover:border-primary hover:bg-muted/40 disabled:opacity-60">
            <FileText size={30} className="mb-2 text-muted-foreground" />
            <span className="font-semibold">{loading ? "Reading document…" : "Choose a resume file"}</span>
            <span className="mt-1 text-xs text-muted-foreground">PDF, DOCX, DOC, TXT, MD, RTF, HTML, PNG, JPG · Max 12 MB</span>
          </button>
          {uploaded && <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2 text-sm"><span className="min-w-0 truncate"><strong>{uploaded.file.name}</strong> · {formatLabel(uploaded.format)}</span><button onClick={clearUploaded} aria-label="Remove uploaded file" className="rounded-md p-1 hover:bg-background"><X size={16} /></button></div>}
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Your original file stays in this browser session. For formats browsers cannot render natively, the preview uses extracted document content; exact layout can vary.</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2"><FileText size={18} /><h2 className="font-semibold">Job description</h2></div>
          <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the complete job description…" className="min-h-[180px] w-full resize-y rounded-lg border bg-background p-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={tailor} disabled={!resume.trim() || !jobDescription.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"><Sparkles size={16} />Tailor resume to this job</button>
        </div>
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-5 rounded-2xl border bg-card p-4"><ScoreRing score={ats.score} label="Original ATS score" size="sm" /><div className="min-w-0"><p className="font-semibold">{ats.grade}</p><p className="mt-1 text-xs text-muted-foreground">{ats.summary}</p><p className="mt-2 text-xs">JD match: <strong>{match.matchScore}%</strong></p></div></div>
        <div className="flex items-center gap-5 rounded-2xl border bg-card p-4"><ScoreRing score={tailored ? tailoredAts.score : 0} label="Tailored ATS score" size="sm" /><div className="min-w-0"><p className="font-semibold">{tailored ? tailoredAts.grade : "Not generated yet"}</p><p className="mt-1 text-xs text-muted-foreground">{tailored ? tailoredAts.summary : "Tailor the resume to see the updated score."}</p><p className="mt-2 text-xs">JD match: <strong>{tailored ? tailoredMatch.matchScore : 0}%</strong></p></div></div>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-2">
        <article className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Original</p><h2 className="mt-1 font-semibold">Uploaded resume</h2></div><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{uploaded ? uploaded.file.name : "Editable text"}</span></div>
          <div className="p-3 sm:p-5">
            {originalPreview || <textarea value={resume} onChange={(e) => setResume(e.target.value)} aria-label="Original resume text" className="min-h-[560px] w-full resize-y rounded-lg border bg-background p-4 font-mono text-sm leading-6 outline-none focus:ring-2 focus:ring-ring" />}
            {uploaded && <details className="mt-3"><summary className="cursor-pointer text-sm font-medium text-muted-foreground">View / edit extracted text</summary><textarea value={resume} onChange={(e) => setResume(e.target.value)} className="mt-3 min-h-[260px] w-full rounded-lg border bg-background p-3 font-mono text-xs leading-5" aria-label="Extracted original resume text" /></details>}
          </div>
        </article>

        <article className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tailored</p><h2 className="mt-1 font-semibold">Resume for this job</h2></div><div className="flex flex-wrap gap-2"><button onClick={() => void copyResume()} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted"><Copy size={14} />Copy</button><button onClick={() => void exportResume("docx")} disabled={!tailored} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-40"><Download size={14} />DOCX</button><button onClick={() => void exportResume("txt")} disabled={!tailored} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-40"><Download size={14} />TXT</button></div></div>
          <div className="p-3 sm:p-5">
            {tailored ? <textarea value={tailored} onChange={(e) => setTailored(e.target.value)} aria-label="Tailored resume text" className="min-h-[560px] w-full resize-y rounded-lg border bg-background p-4 font-mono text-sm leading-6 outline-none focus:ring-2 focus:ring-ring" /> : <div className="flex min-h-[560px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"><Eye size={32} className="mb-3 text-muted-foreground" /><p className="font-semibold">Your tailored resume will appear here</p><p className="mt-2 max-w-sm text-sm text-muted-foreground">Paste a job description and select “Tailor resume to this job” to compare both versions side by side.</p></div>}
          </div>
        </article>
      </section>

      {tailored && <section className="mt-5 rounded-2xl border bg-card p-5"><h2 className="font-semibold">What changed</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2">{changes.map((change, index) => <li key={index} className="flex gap-2 text-sm leading-6"><CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-600" />{change}</li>)}</ul><p className="mt-4 text-xs text-muted-foreground">Review every suggested keyword and bullet. Never keep skills, achievements, or metrics that do not accurately reflect your experience.</p></section>}

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">ATS checklist</h2><div className="mt-3 space-y-2">{ats.checks.map((check) => <div key={check.id} className="flex items-start gap-2 text-sm"><span className={check.passed ? "text-emerald-600" : "text-amber-600"}>{check.passed ? "✓" : "•"}</span><div><p>{check.label}</p>{!check.passed && <p className="text-xs text-muted-foreground">{check.tip}</p>}</div></div>)}</div></div>
        <div className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">JD keywords</h2><p className="mt-1 text-sm text-muted-foreground">{match.matched.length} matched · {match.missing.length} missing</p><div className="mt-3 flex flex-wrap gap-2">{match.keywords.slice(0, 30).map((item) => <span key={item.keyword} className={item.found ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-800" : "rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-900"}>{item.keyword}</span>)}</div></div>
      </section>
      <footer className="mt-8 border-t pt-4 text-xs text-muted-foreground">ATS scores are heuristic estimates, not a guarantee of how a specific employer’s ATS will rank a resume.</footer>
    </div>
  );
}
