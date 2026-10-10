"use client";

import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  label: string;
  sublabel?: string;
  size?: "sm" | "lg";
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-rose-500";
}

export function ScoreRing({
  score,
  label,
  sublabel,
  size = "lg",
}: ScoreRingProps) {
  const dim = size === "lg" ? 112 : 80;
  const stroke = size === "lg" ? 8 : 6;
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/40"
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-500", scoreColor(score))}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span
            className={cn(
              "font-semibold tabular-nums tracking-tight",
              size === "lg" ? "text-3xl" : "text-xl",
              scoreColor(score),
            )}
          >
            {score}
          </span>
          <span className="text-[10px] uppercase text-muted-foreground">
            / 100
          </span>
        </div>
      </div>
      <p className="text-sm font-medium">{label}</p>
      {sublabel && (
        <p className="text-xs text-muted-foreground text-center max-w-[140px]">
          {sublabel}
        </p>
      )}
    </div>
  );
}
