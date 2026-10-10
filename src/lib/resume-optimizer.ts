import { normalizeText } from "./text-utils";
import { analyzeJdMatch } from "./jd-matcher";

const ACTION_VERBS = [
  "Delivered",
  "Led",
  "Built",
  "Optimized",
  "Implemented",
  "Designed",
  "Reduced",
  "Increased",
  "Collaborated",
  "Automated",
];

export interface OptimizeResult {
  optimized: string;
  changes: string[];
  skillsBlockAdded: boolean;
  bulletsEnhanced: number;
}

export function optimizeResumeForJd(
  resume: string,
  jobDescription: string,
): OptimizeResult {
  const text = normalizeText(resume);
  const jd = normalizeText(jobDescription);
  const changes: string[] = [];

  if (!text.trim()) {
    return {
      optimized: "",
      changes: ["Add your resume text to optimize."],
      skillsBlockAdded: false,
      bulletsEnhanced: 0,
    };
  }

  if (!jd.trim()) {
    return {
      optimized: text,
      changes: ["Paste a job description to tailor your resume."],
      skillsBlockAdded: false,
      bulletsEnhanced: 0,
    };
  }

  const match = analyzeJdMatch(text, jd);
  const missingHigh = match.keywords
    .filter((k) => !k.found && k.importance === "high")
    .map((k) => k.keyword);
  const missingMedium = match.keywords
    .filter((k) => !k.found && k.importance === "medium")
    .slice(0, 8)
    .map((k) => k.keyword);

  const toIntegrate = [...missingHigh, ...missingMedium].slice(0, 14);
  let optimized = text;
  let bulletsEnhanced = 0;

  const lines = optimized.split("\n");
  const newLines: string[] = [];
  let inExperience = false;
  let skillsBlockAdded = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^(experience|work history|professional experience)/i.test(trimmed)) {
      inExperience = true;
    }
    if (/^(education|skills|projects|certifications)/i.test(trimmed)) {
      inExperience = false;
    }

    const isBullet = /^[-•*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed);

    if (inExperience && isBullet && toIntegrate.length > 0 && bulletsEnhanced < 5) {
      const keyword = toIntegrate.shift();
      if (keyword && !line.toLowerCase().includes(keyword.toLowerCase())) {
        const bulletBody = trimmed.replace(/^[-•*]\s|^\d+\.\s/, "");
        const verb =
          ACTION_VERBS[bulletsEnhanced % ACTION_VERBS.length];
        const enhanced = `- ${verb} ${bulletBody.replace(/^[a-z]/, (c) => c)} — applied ${keyword} to drive measurable outcomes.`;
        newLines.push(enhanced);
        bulletsEnhanced++;
        changes.push(`Wove "${keyword}" into an experience bullet.`);
        continue;
      }
    }

    newLines.push(line);
  }

  optimized = newLines.join("\n");

  const hasSkillsSection = /^skills/im.test(optimized);
  const skillKeywords = [...missingHigh, ...missingMedium].slice(0, 10);

  if (skillKeywords.length > 0) {
    const skillsLine = skillKeywords.join(", ");
    if (hasSkillsSection) {
      const skillsIdx = optimized.search(/^skills/im);
      const before = optimized.slice(0, skillsIdx);
      const after = optimized.slice(skillsIdx);
      const afterLines = after.split("\n");
      if (afterLines.length > 1) {
        afterLines[1] = `${afterLines[1]?.trim() ? afterLines[1] + ", " : ""}${skillsLine}`;
        optimized = before + afterLines.join("\n");
        changes.push("Extended Skills section with JD keywords.");
      }
    } else {
      optimized += `\n\nSKILLS\n${skillsLine}\n`;
      skillsBlockAdded = true;
      changes.push("Added a Skills section aligned to the job description.");
    }
  }

  if (!/^summary|^professional summary|^profile/im.test(optimized)) {
    const titleGuess =
      match.matched.slice(0, 3).join(", ") || "relevant technologies";
    const summary = `PROFESSIONAL SUMMARY\nResults-driven professional with hands-on experience in ${titleGuess}. Tailored for this role with emphasis on ${missingHigh.slice(0, 3).join(", ") || "key job requirements"}.\n`;
    optimized = summary + "\n" + optimized;
    changes.push("Added a targeted professional summary.");
  }

  if (changes.length === 0) {
    changes.push("Resume already aligns well; minor keyword polish only.");
  }

  return {
    optimized: normalizeText(optimized),
    changes,
    skillsBlockAdded,
    bulletsEnhanced,
  };
}

export const SAMPLE_RESUME = `Alex Rivera
alex.rivera@email.com | (555) 234-8890 | linkedin.com/in/alexrivera | San Francisco, CA

SUMMARY
Software engineer with 5+ years building web applications and APIs. Focus on clean code, performance, and cross-functional delivery.

EXPERIENCE
Senior Software Engineer | Horizon Labs | 2021 – Present
- Built customer-facing dashboards used by 50k+ monthly active users
- Reduced API latency by 35% through query optimization and caching
- Mentored 3 junior engineers on code review and testing practices

Software Engineer | Northwind Digital | 2018 – 2021
- Developed REST services in Node.js for billing and subscription flows
- Implemented CI pipelines that cut release time from days to hours
- Collaborated with product and design on agile two-week sprints

EDUCATION
B.S. Computer Science | State University | 2018

SKILLS
JavaScript, TypeScript, React, Node.js, PostgreSQL, Git, AWS
`;

export const SAMPLE_JD = `Senior Full Stack Engineer

We are looking for a Senior Full Stack Engineer to join our platform team. You will design and ship features using React, TypeScript, and Node.js on AWS.

Requirements:
- 5+ years of professional software development
- Strong experience with React, TypeScript, and REST APIs
- Experience with PostgreSQL or similar relational databases
- Kubernetes and Docker experience preferred
- CI/CD pipelines (GitHub Actions or similar)
- Excellent communication and mentoring skills

Nice to have: GraphQL, microservices, system design, Agile/Scrum leadership.
`;
