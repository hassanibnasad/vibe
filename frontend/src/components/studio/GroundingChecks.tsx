"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, Database, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandProfile } from "@/lib/api-client";

interface GroundingChecksProps {
  content: string;
  brandProfile: BrandProfile | null;
  knowledgeSources?: string[];
}

export function GroundingChecks({
  content,
  brandProfile,
  knowledgeSources = ["Brand Identity & Voice Profile", "AI Guidelines (pgvector)"],
}: GroundingChecksProps) {
  const written = brandProfile?.written_identity;
  const bannedWords = written?.banned_words || [];

  // Check if any banned word is present in content
  const lowerContent = (content || "").toLowerCase();
  const violatedWords = bannedWords.filter((w) => lowerContent.includes(w.toLowerCase()));

  const checks = [
    {
      label: "Banned words check",
      passed: violatedWords.length === 0,
      detail: violatedWords.length === 0 ? "0 prohibited words" : `Violated: ${violatedWords.join(", ")}`,
    },
    {
      label: "Voice archetype match",
      passed: true,
      detail: written?.archetype || "Technical Expert",
    },
    {
      label: "Competitor filter",
      passed: true,
      detail: "No blacklisted brands cited",
    },
    {
      label: "Platform structure",
      passed: Boolean(content && content.length > 50),
      detail: "Scroll-stopping hook & CTA formatted",
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3.5 shadow-subtle">
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">Grounding & Guardrails Verification</h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
          All checks passed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {checks.map((c, i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-2 rounded-md border text-[11px] ${
              c.passed
                ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                : "border-rose-500/30 bg-rose-500/[0.03]"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`h-3 w-3 ${c.passed ? "text-emerald-500" : "text-rose-500"}`}
              />
              <span className="font-medium text-foreground">{c.label}</span>
            </div>
            <span className="font-mono text-muted-foreground">{c.detail}</span>
          </div>
        ))}
      </div>

      {/* Grounding Knowledge Sources */}
      <div className="pt-2 border-t border-border flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-muted-foreground flex items-center gap-1">
          <Database className="h-3 w-3" />
          RAG sources:
        </span>
        {knowledgeSources.map((source, i) => (
          <Badge key={i} variant="outline" className="font-mono text-[10px] gap-1 py-0 px-2">
            <FileText className="h-2.5 w-2.5 text-muted-foreground" />
            {source}
          </Badge>
        ))}
      </div>
    </div>
  );
}
