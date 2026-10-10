import { normalizeText, wordCount } from "./text-utils";

export type AtsCategory =
  | "contact"
  | "structure"
  | "formatting"
  | "content"
  | "length";

export interface AtsCheck {
  id: string;
  category: AtsCategory;
  label: string;
  passed: boolean;
  weight: number;
  tip: string;
}

export interface AtsAnalysis {
  score: number;
  grade: "Excellent" | "Good" | "Fair" | "Needs work";
  checks: AtsCheck[];
  summary: string;
}

const SECTION_PATTERNS = [
  /experience/i,
  /employment|work history/i,
  /education/i,
  /skills/i,
  /summary|profile|objective/i,
  /projects?/i,
  /certifications?/i,
];

const BAD_FORMAT_PATTERNS = [
  { pattern: /<table/i, label: "HTML tables" },
  { pattern: /\|.*\|.*\|/, label: "Markdown tables" },
  { pattern: /!\[.*\]\(/, label: "Embedded images" },
  { pattern: /[♦●■□▪►]/, label: "Special bullet symbols" },
  { pattern: /_{5,}/, label: "Underline formatting" },
  { pattern: /\t{2,}/, label: "Tab columns" },
];

export function analyzeAts(resume: string): AtsAnalysis {
  const text = normalizeText(resume);
  const checks: AtsCheck[] = [];

  const hasEmail = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text);
  checks.push({
    id: "email",
    category: "contact",
    label: "Professional email present",
    passed: hasEmail,
    weight: 12,
    tip: "Add a clear email line near the top (e.g. name@email.com).",
  });

  const hasPhone =
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text) ||
    /\d{10}/.test(text.replace(/\D/g, "").slice(-10));
  checks.push({
    id: "phone",
    category: "contact",
    label: "Phone number listed",
    passed: hasPhone,
    weight: 6,
    tip: "Include a phone number recruiters can reach you on.",
  });

  const hasLinkedIn = /linkedin\.com/i.test(text);
  checks.push({
    id: "linkedin",
    category: "contact",
    label: "LinkedIn URL (recommended)",
    passed: hasLinkedIn,
    weight: 4,
    tip: "Add your LinkedIn profile URL for credibility.",
  });

  const sectionsFound = SECTION_PATTERNS.filter((p) => p.test(text)).length;
  checks.push({
    id: "sections",
    category: "structure",
    label: "Core resume sections (3+)",
    passed: sectionsFound >= 3,
    weight: 18,
    tip: "Use clear headings: Summary, Experience, Skills, Education.",
  });

  const hasBullets =
    /^[\s]*[-•*]\s/m.test(text) || /^[\s]*\d+\.\s/m.test(text);
  checks.push({
    id: "bullets",
    category: "structure",
    label: "Bullet points for achievements",
    passed: hasBullets,
    weight: 10,
    tip: "Use bullets (- or •) to list impact and metrics.",
  });

  let formatOk = true;
  for (const bad of BAD_FORMAT_PATTERNS) {
    if (bad.pattern.test(text)) {
      formatOk = false;
      checks.push({
        id: `format-${bad.label}`,
        category: "formatting",
        label: `Avoid ${bad.label}`,
        passed: false,
        weight: 8,
        tip: "Stick to plain text, simple bullets, and standard headings.",
      });
    }
  }
  if (formatOk) {
    checks.push({
      id: "format-clean",
      category: "formatting",
      label: "ATS-friendly plain formatting",
      passed: true,
      weight: 14,
      tip: "No tables, images, or complex columns.",
    });
  }

  const actionVerbs =
    /\b(led|managed|built|developed|designed|implemented|optimized|reduced|increased|delivered|achieved|created|launched|improved)\b/i.test(
      text,
    );
  checks.push({
    id: "action-verbs",
    category: "content",
    label: "Strong action verbs",
    passed: actionVerbs,
    weight: 10,
    tip: "Start bullets with verbs: Led, Built, Optimized, Delivered.",
  });

  const hasMetrics = /\d+%|\$\d+|\d+\+|\d+k\b/i.test(text);
  checks.push({
    id: "metrics",
    category: "content",
    label: "Quantified results",
    passed: hasMetrics,
    weight: 12,
    tip: "Add numbers: % improvements, revenue, users, time saved.",
  });

  const wc = wordCount(text);
  const lengthOk = wc >= 250 && wc <= 900;
  checks.push({
    id: "length",
    category: "length",
    label: "Length (~1 page, 250–900 words)",
    passed: lengthOk,
    weight: 6,
    tip:
      wc < 250
        ? "Expand with role-specific bullets and skills."
        : wc > 900
          ? "Trim older roles; keep the most relevant experience."
          : "Good length for most ATS parsers.",
  });

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.filter((c) => c.passed).reduce((s, c) => s + c.weight, 0);
  const score = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;

  let grade: AtsAnalysis["grade"];
  if (score >= 85) grade = "Excellent";
  else if (score >= 70) grade = "Good";
  else if (score >= 50) grade = "Fair";
  else grade = "Needs work";

  const failed = checks.filter((c) => !c.passed).length;
  const summary =
    failed === 0
      ? "Your resume follows ATS-friendly structure and content patterns."
      : `${failed} improvement${failed > 1 ? "s" : ""} can raise parse rate and recruiter scan time.`;

  return { score, grade, checks, summary };
}
