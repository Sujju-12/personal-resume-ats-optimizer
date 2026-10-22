"use client";

import { useCallback, useMemo, useState } from "react";
import * as mammoth from "mammoth/mammoth.browser";
import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist/legacy/build/pdf.mjs";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();
import {
  Sparkles,
  Upload,
  Copy,
  Download,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ScoreRing } from "@/components/score-ring";
import { analyzeAts } from "@/lib/ats-analyzer";
import { analyzeJdMatch } from "@/lib/jd-matcher";
import {
  optimizeResumeForJd,
  SAMPLE_JD,
  SAMPLE_RESUME,
} from "@/lib/resume-optimizer";

export function ResumeWorkspace() {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [optimized, setOptimized] = useState("");
  const [lastChanges, setLastChanges] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const ats = useMemo(() => analyzeAts(resume), [resume]);
  const atsOptimized = useMemo(
    () => (optimized ? analyzeAts(optimized) : null),
    [optimized],
  );
  const jdMatch = useMemo(
    () => analyzeJdMatch(resume, jobDescription),
    [resume, jobDescription],
  );
  const jdMatchOptimized = useMemo(
    () =>
      optimized && jobDescription
        ? analyzeJdMatch(optimized, jobDescription)
        : null,
    [optimized, jobDescription],
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadError("");
      try {
        let result = "";
        const extension = file.name.split(".").pop()?.toLowerCase();

        if (extension === "pdf") {
          const data = new Uint8Array(await file.arrayBuffer());
          const pdf = await getDocument({ data }).promise;
          const pages = await Promise.all(
            Array.from({ length: pdf.numPages }, async (_, index) => {
              const page = await pdf.getPage(index + 1);
              const content = await page.getTextContent();
              return content.items
                .map((item) => ("str" in item ? item.str : ""))
                .join(" ");
            }),
          );
          result = pages.join("\n\n");
        } else if (extension === "docx") {
          const extracted = await mammoth.extractRawText({
            arrayBuffer: await file.arrayBuffer(),
          });
          result = extracted.value;
        } else if (extension === "doc") {
          throw new Error("Legacy .doc files are not supported. Save it as .docx or PDF and try again.");
        } else {
          result = await file.text();
        }

        if (!result.trim()) throw new Error("No readable text was found in this file.");
        setResume(result);
        setOptimized("");
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Could not read this file.");
      } finally {
        e.target.value = "";
      }
    },
    [],
  );

  const runOptimize = useCallback(() => {
    const result = optimizeResumeForJd(resume, jobDescription);
    setOptimized(result.optimized);
    setLastChanges(result.changes);
  }, [resume, jobDescription]);

  const loadSamples = useCallback(() => {
    setResume(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JD);
    setOptimized("");
    setLastChanges([]);
  }, []);

  const copyOptimized = useCallback(async () => {
    if (!optimized) return;
    await navigator.clipboard.writeText(optimized);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [optimized]);

  const downloadOptimized = useCallback(() => {
    if (!optimized) return;

    const escapeHtml = (value: string) =>
      value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = optimized
      .split("\\n")
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return "<p>&nbsp;</p>";
        if (/^[-•*]\s+/.test(trimmed)) {
          return `<li>${escapeHtml(trimmed.replace(/^[-•*]\s+/, ""))}</li>`;
        }
        if (/^\d+\.\s+/.test(trimmed)) {
          return `<li>${escapeHtml(trimmed.replace(/^\d+\.\s+/, ""))}</li>`;
        }
        if (/^(PROFESSIONAL SUMMARY|SUMMARY|EXPERIENCE|WORK HISTORY|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS)$/i.test(trimmed)) {
          return `<h2>${escapeHtml(trimmed)}</h2>`;
        }
        return `<p>${escapeHtml(trimmed)}</p>`;
      })
      .join("")
      .replace(/<li>/g, '<p style="margin-left:24px">• ')
      .replace(/<\/li>/g, "</p>");

    const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Tailored Resume</title><style>body{font-family:Arial,sans-serif;line-height:1.45;color:#111;max-width:760px;margin:40px auto;padding:0 24px}h2{font-size:14px;letter-spacing:.08em;border-bottom:1px solid #bbb;padding-bottom:4px;margin:20px 0 8px}p{margin:5px 0}ul{margin:5px 0 10px;padding-left:24px}li{margin:4px 0}</style></head><body>${html}</body></html>`;
    const blob = new Blob([documentHtml], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tailored-resume.doc";
    link.click();
    URL.revokeObjectURL(url);
  }, [optimized]);

  const failedChecks = ats.checks.filter((c) => !c.passed);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <Badge variant="secondary" className="font-normal">
              ATS + JD Tailoring
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Resume ATS Optimizer
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Score how parsers read your resume, compare it to any job
            description, and generate a tailored version—side by side.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadSamples}>
            Load sample
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResume("");
              setJobDescription("");
              setOptimized("");
              setLastChanges([]);
            }}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Clear
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col items-center justify-center py-6">
          <ScoreRing score={ats.score} label="ATS score" sublabel={ats.grade} />
        </Card>
        <Card className="flex flex-col items-center justify-center py-6">
          <ScoreRing
            score={jdMatch.matchScore}
            label="JD match"
            sublabel={
              jobDescription.trim() ? "Keyword alignment" : "Paste a JD"
            }
          />
        </Card>
        <Card className="col-span-1 flex flex-col justify-center px-6 py-4 sm:col-span-2 lg:col-span-2">
          <p className="text-sm font-medium">Quick read</p>
          <p className="mt-1 text-sm text-muted-foreground">{ats.summary}</p>
          {jobDescription.trim() && jdMatch.topGaps.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Top gaps:{" "}
              <span className="text-foreground">
                {jdMatch.topGaps.slice(0, 5).join(", ")}
              </span>
              {jdMatch.topGaps.length > 5 ? "…" : ""}
            </p>
          )}
          {atsOptimized && jdMatchOptimized && (
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
              After optimize: ATS {atsOptimized.score} (+{atsOptimized.score - ats.score}), JD{" "}
              {jdMatchOptimized.matchScore}% (+{jdMatchOptimized.matchScore - jdMatch.matchScore})
            </p>
          )}
        </Card>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Start with your resume file</p>
          <p className="text-sm text-muted-foreground">Upload a PDF, Word document, text file, or Markdown file to extract its content.</p>
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
          <input
            type="file"
            accept=".txt,.md,.text,.pdf,.doc,.docx, text/plain, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Upload className="h-4 w-4" />
          Upload resume
        </label>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your resume</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <Textarea
              placeholder="Paste your resume here (plain text works best for ATS)…"
              className="min-h-[320px] resize-y font-mono text-sm leading-relaxed"
              value={resume}
              onChange={(e) => {
                setResume(e.target.value);
                setOptimized("");
              }}
            />
            <p className="text-xs text-muted-foreground">
              Supports PDF, DOCX, DOC, TXT, and Markdown files. PDF and DOCX text is extracted automatically.
            </p>
            {uploadError && (
              <p role="alert" className="text-xs text-destructive">
                {uploadError}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col border-amber-500/30 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Job description</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <Textarea
              placeholder="Paste the full job posting—requirements, skills, and responsibilities…"
              className="min-h-[320px] resize-y text-sm leading-relaxed"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <Button
              className="w-full sm:w-auto"
              onClick={runOptimize}
              disabled={!resume.trim() || !jobDescription.trim()}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Tailor resume to this JD
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="optimized" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="optimized">Optimized</TabsTrigger>
          <TabsTrigger value="ats">ATS checks</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
        </TabsList>

        <TabsContent value="optimized" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">Tailored output</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!optimized}
                  onClick={copyOptimized}
                >
                  <Copy className="mr-1.5 h-4 w-4" />
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!optimized}
                  onClick={downloadOptimized}
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Before
                </p>
                <ScrollArea className="h-[280px] rounded-md border bg-muted/30 p-3">
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {resume || "—"}
                  </pre>
                </ScrollArea>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  After
                </p>
                <ScrollArea className="h-[280px] rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                  {optimized ? (
                    <div className="text-sm leading-relaxed">
                      {optimized.split("\\n").map((line, index) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <div key={index} className="h-2" />;
                        const bullet = trimmed.match(/^[-•*]\\s+(.+)/)?.[1] ?? trimmed.match(/^\\d+\\.\\s+(.+)/)?.[1];
                        const heading = /^(PROFESSIONAL SUMMARY|SUMMARY|EXPERIENCE|WORK HISTORY|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS)$/i.test(trimmed);
                        if (bullet) {
                          return (
                            <div key={index} className="flex gap-2 py-0.5">
                              <span aria-hidden="true" className="shrink-0">•</span>
                              <span>{bullet}</span>
                            </div>
                          );
                        }
                        return heading ? (
                          <h3 key={index} className="mt-3 border-b border-emerald-600/30 pb-1 text-xs font-bold uppercase tracking-wider first:mt-0">{trimmed}</h3>
                        ) : (
                          <p key={index} className="py-0.5">{trimmed}</p>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Run “Tailor resume to this JD” to see your optimized version here.
                    </p>
                  )}
                </ScrollArea>
              </div>
              {lastChanges.length > 0 && (
                <div className="lg:col-span-2">
                  <Separator className="mb-4" />
                  <p className="mb-2 text-sm font-medium">Changes made</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {lastChanges.map((c, i) => (
                      <li key={i} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ats" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ATS compatibility checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {ats.checks.map((check) => (
                  <li
                    key={check.id}
                    className="flex gap-3 rounded-lg border p-3 text-sm"
                  >
                    {check.passed ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium">{check.label}</p>
                      {!check.passed && (
                        <p className="mt-0.5 text-muted-foreground">
                          {check.tip}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {failedChecks.length > 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Fix {failedChecks.length} item
                  {failedChecks.length > 1 ? "s" : ""} above, then re-scan by
                  editing your resume.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Keyword map</CardTitle>
            </CardHeader>
            <CardContent>
              {!jobDescription.trim() ? (
                <p className="text-sm text-muted-foreground">
                  Paste a job description to see matched and missing keywords.
                </p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Matched ({jdMatch.matched.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {jdMatch.matched.length === 0 ? (
                        <span className="text-sm text-muted-foreground">None yet</span>
                      ) : (
                        jdMatch.matched.map((k) => (
                          <Badge key={k} variant="secondary">{k}</Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-rose-600 dark:text-rose-400">
                      Missing ({jdMatch.missing.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {jdMatch.missing.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          Great coverage
                        </span>
                      ) : (
                        jdMatch.missing.map((k) => (
                          <Badge key={k} variant="outline">{k}</Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
