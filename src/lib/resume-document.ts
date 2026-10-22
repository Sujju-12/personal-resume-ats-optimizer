export type ResumeFormat =
  | "txt"
  | "md"
  | "docx"
  | "pdf"
  | "doc"
  | "html"
  | "rtf"
  | "image"
  | "other";

export type ExportFormat = "docx" | "pdf" | "txt" | "md" | "html";

export interface ResumeDocument {
  format: ResumeFormat;
  fileName: string;
  mimeType: string;
  plainText: string;
  displayHtml: string | null;
  originalPreviewUrl: string | null;
  originalFile: File | null;
}

export function extensionToFormat(fileName: string): ResumeFormat {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  switch (ext) {
    case "txt":
    case "text":
      return "txt";
    case "md":
    case "markdown":
      return "md";
    case "docx":
      return "docx";
    case "doc":
      return "doc";
    case "pdf":
      return "pdf";
    case "html":
    case "htm":
      return "html";
    case "rtf":
      return "rtf";
    case "png":
    case "jpg":
    case "jpeg":
    case "webp":
    case "gif":
      return "image";
    default:
      return "other";
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function tailoredFileName(
  originalName: string,
  exportFormat: ExportFormat,
  suffix = "tailored",
): string {
  const dot = originalName.lastIndexOf(".");
  const base = dot === -1 ? originalName : originalName.slice(0, dot);
  const ext = exportFormat === "pdf" ? "html" : exportFormat;
  return `${base}-${suffix}.${ext}`;
}

export function canEmbedOriginal(format: ResumeFormat, mimeType: string): boolean {
  if (format === "pdf" || format === "txt" || format === "md" || format === "html") {
    return true;
  }
  if (format === "image" || mimeType.startsWith("image/")) return true;
  if (mimeType.startsWith("text/")) return true;
  return false;
}
