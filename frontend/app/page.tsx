"use client";

import { useMemo, useRef, useState } from "react";

type Score = {
  score: number;
  breakdown: Record<string, number>;
  matched: string[];
  related: string[];
  missing: string[];
  note: string;
  jd_intelligence?: {
    required_skills: string[];
    preferred_skills: string[];
    general_skills: string[];
    required_matched: string[];
    required_missing: string[];
    preferred_matched: string[];
    preferred_missing: string[];
    role_titles: string[];
    responsibilities: string[];
  };
  optimization_plan?: { priority: string; area: string; action: string; items: string[] }[];
};

type Version = {
  id: number;
  label: string;
  text: string;
  score: number | null;
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
  const [versions, setVersions] = useState<Version[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const resumeRef = useRef<HTMLTextAreaElement>(null);

  const bullets = useMemo(
    () =>
      resume
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length >= 30 && /^(?:[-•*▪◦]|\d+[.)])\s+/.test(line)),
    [resume]
  );

  async function scan(text = resume, compareTo: number | null = null) {
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
      if (compareTo !== null) setPreviousScore(compareTo);
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
      setVersions([{ id: 1, label: "Uploaded resume", text: d.text, score: null }]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function selectBullet(bullet: string) {
    setSelected(bullet);
    setSuggestion("");
    const textarea = resumeRef.current;
    if (!textarea) return;
    const start = resume.indexOf(bullet);
    if (start >= 0) {
      textarea.focus();
      textarea.setSelectionRange(start, start + bullet.length);
    }
  }

  function handleResumeSelect() {
    const textarea = resumeRef.current;
    if (!textarea) return;
    const value = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd).trim();
    if (value) {
      setSelected(value);
      setSuggestion("");
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

    const beforeScore = score?.score ?? null;
    setHistory((h) => [...h, resume]);
    setFuture([]);
    setResume(nextResume);
    setSelected("");
    setSuggestion("");
    setMessage("Fix applied. Recalculating ATS score...");

    const nextScore = await scan(nextResume, beforeScore);

    if (nextScore) {
      setVersions((v) => [
        ...v,
        {
          id: v.length + 1,
          label: nextScore.score > (beforeScore ?? -1) ? "Improved AI fix" : "Applied AI fix",
          text: nextResume,
          score: nextScore.score,
        },
      ]);
      if (beforeScore !== null) {
        const delta = nextScore.score - beforeScore;
        setMessage(
          delta > 0
            ? `ATS score improved by +${delta} points.`
            : delta < 0
              ? `ATS score changed by ${delta} points. Review the wording or undo it.`
              : "ATS score did not change. This wording produced no measurable ATS improvement."
        );
      }
    }
  }

  async function undo() {
    if (!history.length || busy) return;
    const previous = history[history.length - 1];
    const currentScore = score?.score ?? null;
    setFuture((f) => [resume, ...f]);
    setResume(previous);
    setHistory((h) => h.slice(0, -1));
    setSelected("");
    setSuggestion("");
    setMessage("Undo applied. Recalculating ATS score...");
    await scan(previous, currentScore);
  }

  async function redo() {
    if (!future.length || busy) return;
    const next = future[0];
    const currentScore = score?.score ?? null;
    setHistory((h) => [...h, resume]);
    setResume(next);
    setFuture((f) => f.slice(1));
    setSelected("");
    setSuggestion("");
    setMessage("Redo applied. Recalculating ATS score...");
    await scan(next, currentScore);
  }

  async function restoreVersion(version: Version) {
    if (busy) return;
    const currentScore = score?.score ?? null;
    setHistory((h) => [...h, resume]);
    setFuture([]);
    setResume(version.text);
    setSelected("");
    setSuggestion("");
    setMessage(`Restored version ${version.id}: ${version.label}. Recalculating...`);
    await scan(version.text, currentScore);
  }

  function downloadResume() {
    if (!resume) return;
    const blob = new Blob([resume], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "optimized-resume.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetAll() {
    if (busy) return;
    setResume("");
    setJd("");
    setScore(null);
    setPreviousScore(null);
    setSelected("");
    setSuggestion("");
    setHistory([]);
    setFuture([]);
    setVersions([]);
    setMessage("");
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
        <div className="actions">
          <button className="primary" onClick={() => scan(resume, score?.score ?? null)} disabled={!resume || !jd || busy}>
          {busy ? "Working..." : "Scan Resume"}
          </button>
          <button onClick={downloadResume} disabled={!resume || busy}>Export TXT</button>
          <button onClick={resetAll} disabled={busy}>Reset</button>
        </div>
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
          <p className="hint">Select text directly, or choose a detected bullet below.</p>
          <textarea
            ref={resumeRef}
            className="resume"
            value={resume}
            onChange={(e) => { setResume(e.target.value); setScore(null); }}
            onSelect={handleResumeSelect}
            placeholder="Paste your resume text..."
          />

          {bullets.length > 0 && (
            <div className="bullet-picker">
              <label>DETECTED RESUME BULLETS</label>
              {bullets.map((bullet, index) => (
                <button className={selected === bullet ? "bullet active" : "bullet"} key={index} onClick={() => selectBullet(bullet)}>
                  {bullet}
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="panel">
          <label>ATS-STYLE SCORE</label>
          <div className="score">{score?.score ?? "—"}<span>/100</span></div>

          {score && (
            <>
              {previousScore !== null && (
                <div className="delta">Previous: {previousScore} → Current: {score.score} ({score.score - previousScore >= 0 ? "+" : ""}{score.score - previousScore})</div>
              )}
              <div className="metrics">
                {Object.entries(score.breakdown).map(([k, v]) => (
                  <div key={k}><span>{k.replace("_", " ")}</span><b>{String(v)}%</b></div>
                ))}
              </div>
              <div className="chips">
                {score.matched.map((x) => <i className="good" key={x}>✓ {x}</i>)}
                {score.related.map((x) => <i className="related" key={x}>~ {x}</i>)}
                {score.missing.map((x) => <i className="missing" key={x}>⚠ {x}</i>)}
              </div>
              {score.optimization_plan && score.optimization_plan.length > 0 && (
                <div className="optimization-plan">
                  <label>OPTIMIZATION PLAN</label>
                  {score.optimization_plan.map((item, index) => (
                    <div className="plan-item" key={index}>
                      <div><b>{item.priority.toUpperCase()}</b> · {item.area.replace("_", " ")}</div>
                      <p>{item.action}</p>
                      {item.items.length > 0 && <span>{item.items.join(", ")}</span>}
                    </div>
                  ))}
                </div>
              )}
              {score.jd_intelligence && (
                <div className="jd-intel">
                  <label>JOB INTELLIGENCE</label>
                  {score.jd_intelligence.role_titles.length > 0 && <p><b>Role:</b> {score.jd_intelligence.role_titles.join(", ")}</p>}
                  <div className="intel-grid">
                    <div><b>Required</b><span>{score.jd_intelligence.required_matched.length} matched · {score.jd_intelligence.required_missing.length} missing</span></div>
                    <div><b>Preferred</b><span>{score.jd_intelligence.preferred_matched.length} matched · {score.jd_intelligence.preferred_missing.length} missing</span></div>
                  </div>
                  {score.jd_intelligence.required_missing.length > 0 && <p className="intel-warning">Required gaps: {score.jd_intelligence.required_missing.join(", ")}</p>}
                </div>
              )}
            </>
          )}

          <label>AI COACH</label>
          <textarea value={selected} onChange={(e) => setSelected(e.target.value)} placeholder="Select or paste one resume bullet..." />
          <button className="primary" onClick={fix} disabled={!selected || !jd || busy}>
            {busy ? "Working..." : "Generate Fix"}
          </button>

          {suggestion && (
            <div className="suggestion">
              <label>BEFORE</label>
              <p>{selected}</p>
              <label>AI SUGGESTED AFTER</label>
              <p>{suggestion}</p>
              <button className="primary" onClick={apply} disabled={busy}>Apply Fix</button>{" "}
              <button onClick={fix} disabled={busy}>Regenerate</button>
            </div>
          )}

          {versions.length > 0 && (
            <div className="versions">
              <label>VERSION HISTORY</label>
              {versions.slice().reverse().map((version) => (
                <div className="version" key={version.id}>
                  <span><b>v{version.id}</b> {version.label} {version.score !== null ? `• ${version.score}/100` : ""}</span>
                  <button onClick={() => restoreVersion(version)}>Restore</button>
                </div>
              ))}
            </div>
          )}

          {message && <p className="note">{message}</p>}
          <p className="note">ATS score is a deterministic simulation. AI is instructed not to fabricate experience.</p>
        </aside>
      </section>
    </main>
  );
}
