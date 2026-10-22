import { NextResponse } from "next/server";
import HTMLtoDOCX from "html-to-docx";
import { plainTextToResumeHtml } from "@/lib/plain-to-resume-html";
import type { ExportFormat } from "@/lib/resume-document";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function printHtmlDocument(displayHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Tailored resume</title><style>
        @page { margin: 0.7in; }
        body { font-family: Georgia, "Times New Roman", serif; font-size: 11pt; line-height: 1.35; margin: 0.75in; color: #111; }
        .resume-heading, h1, h2, h3 { font-size: 12pt; font-weight: bold; margin: 14px 0 6px; }
        .resume-line, p { margin: 0 0 4px; }
        ul.resume-list, ul { margin: 4px 0 8px 18px; padding: 0; }
        ul.resume-list li, li { margin-bottom: 4px; }
      </style></head><body>${displayHtml}</body></html>`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const format = (body.format as ExportFormat) || "txt";
    const fileName = (body.fileName as string) || "resume-tailored.txt";
    const plainText = (body.plainText as string) || "";
    const displayHtml =
      (body.displayHtml as string) || plainTextToResumeHtml(plainText);

    if (!plainText.trim()) {
      return NextResponse.json({ error: "Empty resume" }, { status: 400 });
    }

    if (format === "docx") {
      const docxBuffer = await HTMLtoDOCX(
        `<!DOCTYPE html><html><body>${displayHtml}</body></html>`,
        null,
        {
          table: { row: { cantSplit: true } },
          footer: false,
          header: false,
        },
      );
      const bytes =
        docxBuffer instanceof ArrayBuffer
          ? docxBuffer
          : new Uint8Array(docxBuffer as Buffer);
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": DOCX_MIME,
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

    if (format === "pdf" || format === "html") {
      const html = printHtmlDocument(displayHtml);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName.replace(/\.pdf$/i, ".html")}"`,
        },
      });
    }

    if (format === "md") {
      return new NextResponse(plainText, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

    return new NextResponse(plainText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
