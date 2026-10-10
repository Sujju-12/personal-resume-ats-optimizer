import {
  extractKeywords,
  resumeContainsKeyword,
  normalizeText,
} from "./text-utils";

export interface KeywordMatch {
  keyword: string;
  found: boolean;
  importance: "high" | "medium" | "low";
}

export interface JdMatchAnalysis {
  matchScore: number;
  matched: string[];
  missing: string[];
  keywords: KeywordMatch[];
  topGaps: string[];
}

export function analyzeJdMatch(resume: string, jobDescription: string): JdMatchAnalysis {
  const resumeNorm = normalizeText(resume).toLowerCase();
  const jdNorm = normalizeText(jobDescription);

  if (!jdNorm.trim()) {
    return {
      matchScore: 0,
      matched: [],
      missing: [],
      keywords: [],
      topGaps: [],
    };
  }

  const jdKeywords = extractKeywords(jdNorm).slice(0, 40);
  const keywords: KeywordMatch[] = jdKeywords.map((keyword, index) => {
    const found = resumeContainsKeyword(resumeNorm, keyword);
    let importance: KeywordMatch["importance"] = "low";
    if (index < 8) importance = "high";
    else if (index < 20) importance = "medium";
    return { keyword, found, importance };
  });

  const matched = keywords.filter((k) => k.found).map((k) => k.keyword);
  const missing = keywords.filter((k) => !k.found).map((k) => k.keyword);

  const weightedTotal = keywords.reduce((sum, k) => {
    const w = k.importance === "high" ? 3 : k.importance === "medium" ? 2 : 1;
    return sum + w;
  }, 0);

  const weightedMatched = keywords
    .filter((k) => k.found)
    .reduce((sum, k) => {
      const w = k.importance === "high" ? 3 : k.importance === "medium" ? 2 : 1;
      return sum + w;
    }, 0);

  const matchScore =
    weightedTotal > 0 ? Math.round((weightedMatched / weightedTotal) * 100) : 0;

  const topGaps = missing.slice(0, 12);

  return {
    matchScore,
    matched,
    missing,
    keywords,
    topGaps,
  };
}
