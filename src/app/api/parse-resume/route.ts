import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_BYTES = 12 * 1024 * 1024;

function stripHtml(input: string) {
  return input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

function stripRtf(input: string) {
  return input
    .replace(/\\'[0-9a-f]{2}/gi, " ")
    .replace(/\\(par|line)\b ?/gi, "\n")
    .replace(/\\[a-z]+-?\d* ?/gi, "")
    .replace(/[{}]/g, "")
    .replace(/\\~/g, " ")
    .trim();
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Select a resume file to upload." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File must be non-empty and no larger than 12 MB." }, { status: 413 });
    }

    const name = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";
    let previewHtml: string | undefined;

    if (name.endsWith(".pdf")) {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const result = await parser.getText();
        text = result.text || "";
      } finally {
        await parser.destroy();
      }
    } else if (name.endsWith(".docx")) {
      const result = await mammoth.convertToHtml({ buffer });
      previewHtml = `<!doctype html><html><head><meta charset="utf-8"><style>body{font:14px/1.5 Arial,sans-serif;padding:28px;color:#171717}h1,h2,h3{margin:1em 0 .4em}p{margin:.35em 0}ul,ol{padding-left:24px}</style></head><body>${result.value}</body></html>`;
      const raw = await mammoth.extractRawText({ buffer });
      text = raw.value || "";
    } else if (name.endsWith(".txt") || name.endsWith(".text") || name.endsWith(".md") || name.endsWith(".markdown")) {
      text = buffer.toString("utf8");
    } else if (name.endsWith(".html") || name.endsWith(".htm")) {
      const html = buffer.toString("utf8");
      text = stripHtml(html);
      previewHtml = `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
    } else if (name.endsWith(".rtf")) {
      text = stripRtf(buffer.toString("utf8"));
    } else if (name.endsWith(".doc")) {
      return NextResponse.json({ error: "Legacy .doc files are not supported for text extraction yet. Save the file as .docx or PDF and upload it again." }, { status: 415 });
    } else {
      return NextResponse.json({ error: "Unsupported document type. Use PDF, DOCX, TXT, MD, RTF, or HTML." }, { status: 415 });
    }

    return NextResponse.json({ text: text.replace(/\r\n?/g, "\n").trim(), previewHtml });
  } catch (error) {
    console.error("Resume parsing failed", error);
    return NextResponse.json({ error: "Could not read this document. It may be damaged, password-protected, or scanned." }, { status: 422 });
  }
}
