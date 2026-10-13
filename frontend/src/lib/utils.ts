import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export interface ConfidenceDisplay {
  percentage: string;
  label: string;
  raw: string;
  variant: "success" | "warning" | "review" | "default";
  description: string;
}

export function formatConfidence(score: number, threshold: number = 0.85): ConfidenceDisplay {
  const percentage = `${Math.round(score * 100)}%`;
  const raw = score.toFixed(2);

  if (score >= threshold) {
    return {
      percentage,
      label: "High confidence",
      raw,
      variant: "success",
      description: `Automated confidence score ${raw} exceeds the ${threshold.toFixed(2)} verification threshold.`,
    };
  }
  if (score >= 0.80) {
    return {
      percentage,
      label: "Borderline",
      raw,
      variant: "warning",
      description: `Automated confidence score ${raw} is below the ${threshold.toFixed(2)} threshold. Operator review recommended.`,
    };
  }
  return {
    percentage,
    label: "Needs review",
    raw,
    variant: "review",
    description: `Automated confidence score ${raw} is below the ${threshold.toFixed(2)} threshold. Manual approval required before dispatch.`,
  };
}

export function humanizeTitle(title: string): string {
  if (!title) return "";
  // Strip common file extensions
  const clean = title.replace(/\.(md|txt|pdf|docx|html)$/i, "");
  // Replace underscores and hyphens with spaces
  const words = clean.replace(/[_-]+/g, " ").trim().split(/\s+/);

  const ACRONYMS = new Set([
    "ai",
    "api",
    "rag",
    "icp",
    "bant",
    "crm",
    "sql",
    "mql",
    "url",
    "ui",
    "ux",
    "faq",
    "roi",
    "b2b",
    "llm",
  ]);

  return words
    .map((word) => {
      const lower = word.toLowerCase();
      if (ACRONYMS.has(lower)) {
        return lower.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
