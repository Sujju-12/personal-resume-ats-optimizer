function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function plainTextToResumeHtml(plainText: string): string {
  const lines = plainText.replace(/\r\n?/g, "\n").split("\n");
  const blocks: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push(`<ul class="resume-list">${listItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    const bullet = line.match(/^[-•*]\s+(.*)$/);
    if (bullet) {
      listItems.push(bullet[1]);
      continue;
    }
    flushList();
    const heading = /^(SUMMARY|PROFESSIONAL SUMMARY|EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK HISTORY|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS)$/i.test(line);
    blocks.push(heading
      ? `<h2 class="resume-heading">${escapeHtml(line)}</h2>`
      : `<p class="resume-line">${escapeHtml(line)}</p>`);
  }
  flushList();
  return blocks.join("\n");
}
