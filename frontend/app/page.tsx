"use client";

import { useState } from "react";

type Score = {
  score: number;
  breakdown: Record<string, number>;
  matched: string[];
  related: string[];
  missing: string[];
  note: string;
};

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function Home() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [score, setScore] = useState<Score | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [selected, setSelected] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function scan(text = resume) {
    if (!text || !jd) return null;
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch(API + "/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: text, job_description: jd }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Scan failed");
      setScore(d);
      return d as Score;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Scan failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    setBusy(true);
    setMessage("");
    try {
      const f = new FormData();
      f.append("file", file);
      const r = await fetch(API + "/parse-resume", { method: "POST", body: f });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Upload failed");
      setResume(d.text);
      setScore(null);
      setPreviousScore(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function fix() {
    if (!selected || !jd) return;
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch(API + "/suggest-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_text: selected,
          resume_text: resume,
          job_description: jd,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "AI suggestion failed");
      setSuggestion(d.suggestion || selected);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "AI suggestion failed");
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    if (!suggestion || !selected) return;
    const nextResume = resume.replace(selected, suggestion);
    if (nextResume === resume) {
      setMessage("The selected text was not found in the resume.");
      return;
    }

    setHistory((h) => [...h, resume]);
    setFuture([]);
    setResume(nextResume);
    setSelected("");
    setSuggestion("");
    setMessage("Fix applied. Recalculating ATS score...");

    const nextScore = await scan(nextResume);
    if (nextScore && score) {
      const delta = nextScore.score - score.score;
      setPreviousScore(score.score);
      setMessage(
        delta > 0
          ? `ATS score improved by +${delta} points.`
          : delta < 0
            ? `ATS score changed by ${delta} points. Review the new wording before keeping it.`
            : "ATS score did not change. The wording was not counted as an ATS improvement."
      );
    }
  }

  function undo() {
    if (!history.length) return;
    const previous = history[history.length - 1];
    setFuture((f) => [resume, ...f]);
    setResume(previous);
    setHistory((h) => h.slice(0, -1));
    setMessage("Undo applied. Scan again to refresh the score.");
  }

  function redo() {
    if (!future.length) return;
    const next = future[0];
    setHistory((h) => [...h, resume]);
    setResume(next);
    setFuture((f) => f.slice(1));
    setMessage("Redo applied. Scan again to refresh the score.");
  }

  return (
    <main className="shell">
      <header>
        <div>
          <small>PRIVATE • LOCAL ONLY</small>
          <h1>Personal Resume ATS Optimizer</h1>
          <p>Improve your resume against a job description without inventing experience.</p>
        </div>
        <label>
          Resume PDF/DOCX
          <input type="file" accept=".pdf,.docx" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      </header>

      <section className="jd">
        <label>JOB DESCRIPTION</label>
        <textarea value={jd} onChange={(e) => { setJd(e.target.value); setScore(null); }} placeholder="Paste target job description..." />
        <button className="primary" onClick={() => scan()} disabled={!resume || !jd || busy}>
          {busy ? "Working..." : "Scan Resume"}
        </button>
      </section>

      <section className="grid">
        <div className="panel">
          <div className="bar">
            <label>RESUME</label>
            <div>
              <button onClick={undo} disabled={!history.length}>Undo</button>{" "}
              <button onClick={redo} disabled={!future.length}>Redo</button>
            </div>
          </div>
          <textarea className="resume" value={resume} onChange={(e) => { setResume(e.target.value); setScore(null); }} placeholder="Paste your resume text..." />
        </div>

        <aside className="panel">
          <label>ATS-STYLE SCORE</label>
          <div className="score">{score?.score ?? "—"}<span>/100</span></div>
          {score && (
            <>
              {previousScore !== null && (
                <div className="delta">Previous: {previousScore} → Current: {score.score}</div>
              )}
              <div className="metrics">
                {Object.entries(score.breakdown).map(([k, v]) => (
                  <div key={k}><span>{k}</span><b>{String(v)}%</b></div>
                ))}
              </div>
              <div className="chips">
                {score.matched.map((x) => <i className="good" key={x}>✓ {x}</i>)}
                {score.related.map((x) => <i className="related" key={x}>~ {x}</i>)}
                {score.missing.map((x) => <i className="missing" key={x}>⚠ {x}</i>)}
              </div>
            </>
          )}

          <label>AI COACH</label>
          <textarea value={selected} onChange={(e) => setSelected(e.target.value)} placeholder="Paste one resume bullet..." />
          <button className="primary" onClick={fix} disabled={!selected || !jd || busy}>
            {busy ? "Working..." : "Generate Fix"}
          </button>

          {suggestion && (
            <div className="suggestion">
              <label>SUGGESTED FIX</label>
              <p>{suggestion}</p>
              <button className="primary" onClick={apply} disabled={busy}>Apply Fix</button>
              <button onClick={fix} disabled={busy}>Regenerate</button>
            </div>
          )}

          {message && <p className="note">{message}</p>}
          <p className="note">ATS score is a deterministic simulation. AI is instructed not to fabricate experience.</p>
        </aside>
      </section>
    </main>
  );
}
