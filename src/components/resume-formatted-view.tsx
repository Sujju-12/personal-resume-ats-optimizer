"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { ResumeFormat } from "@/lib/resume-document";
import { canEmbedOriginal } from "@/lib/resume-document";

interface ResumeFormattedViewProps {
  html: string | null;
  originalPreviewUrl?: string | null;
  originalFormat?: ResumeFormat | null;
  originalMime?: string;
  originalFileName?: string;
  preferOriginal?: boolean;
  plainTextFallback?: string;
  className?: string;
  minHeight?: string;
}

export function ResumeFormattedView({
  html,
  originalPreviewUrl,
  originalFormat,
  originalMime = "",
  originalFileName = "resume",
  preferOriginal = false,
  plainTextFallback,
  className = "",
  minHeight = "320px",
}: ResumeFormattedViewProps) {
  const showOriginal =
    preferOriginal &&
    originalPreviewUrl &&
    originalFormat &&
    canEmbedOriginal(originalFormat, originalMime);

  if (showOriginal && originalPreviewUrl) {
    if (originalFormat === "image" || originalMime.startsWith("image/")) {
      return (
        <ScrollArea
          className={`rounded-md border bg-white ${className}`}
          style={{ minHeight }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={originalPreviewUrl}
            alt={originalFileName}
            className="mx-auto max-h-[min(640px,80vh)] w-auto max-w-full object-contain p-2"
          />
        </ScrollArea>
      );
    }

    return (
      <div
        className={`overflow-hidden rounded-md border bg-white ${className}`}
        style={{ minHeight }}
      >
        <iframe
          title={`Original ${originalFileName}`}
          src={originalPreviewUrl}
          className="h-[min(560px,75vh)] w-full min-h-[320px] border-0 bg-white"
        />
      </div>
    );
  }

  if (html) {
    return (
      <ScrollArea
        className={`rounded-md border bg-white p-4 dark:bg-zinc-950 ${className}`}
        style={{ minHeight }}
      >
        <div
          className="resume-document-root text-sm leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </ScrollArea>
    );
  }

  return (
    <ScrollArea
      className={`rounded-md border bg-muted/30 p-3 ${className}`}
      style={{ minHeight }}
    >
      <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
        {plainTextFallback || "—"}
      </pre>
    </ScrollArea>
  );
}
