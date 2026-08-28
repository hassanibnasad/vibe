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

