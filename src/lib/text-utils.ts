const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "need",
  "our",
  "your",
  "their",
  "this",
  "that",
  "these",
  "those",
  "we",
  "you",
  "they",
  "it",
  "its",
  "who",
  "which",
  "what",
  "when",
  "where",
  "why",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "about",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "any",
  "work",
  "working",
  "role",
  "position",
  "job",
  "team",
  "company",
  "experience",
  "years",
  "year",
  "including",
  "ability",
  "strong",
  "excellent",
  "preferred",
  "required",
  "responsibilities",
  "qualifications",
  "description",
]);

export function normalizeText(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s+#.\-/]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export function extractKeywords(text: string, minLength = 2): string[] {
  const tokens = tokenize(text);
  const freq = new Map<string, number>();

  for (const token of tokens) {
    if (STOP_WORDS.has(token) || token.length < minLength) continue;
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }

  const phrases = extractPhrases(text);
  for (const phrase of phrases) {
    freq.set(phrase, (freq.get(phrase) ?? 0) + 2);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
}

/** Multi-word tech terms and title-case skill phrases from JD */
function extractPhrases(text: string): string[] {
  const phrases: string[] = [];
  const patterns = [
    /\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
    /\b(?:[a-z]+(?:\s+[a-z]+){0,2})\s*(?:\.js|\.ts|\.net|#)\b/gi,
    /\b(?:AWS|GCP|Azure|CI\/CD|Kubernetes|Docker|Python|JavaScript|TypeScript|React|Node\.js|SQL|NoSQL|GraphQL|REST|API|ML|AI|LLM|Agile|Scrum)\b/g,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern) ?? [];
    for (const m of matches) {
      phrases.push(m.toLowerCase().replace(/\s+/g, " ").trim());
    }
  }

  return phrases;
}

export function resumeContainsKeyword(resumeLower: string, keyword: string): boolean {
  const k = keyword.toLowerCase();
  if (resumeLower.includes(k)) return true;
  const alt = k.replace(/\./g, "");
  return resumeLower.includes(alt);
}
