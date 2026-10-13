"use client";

import React, { useState } from "react";
import { ExternalLink, Copy, Check, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BrandSnapshotCardProps {
  brandName: string;
  websiteUrl: string;
  tagline: string;
  archetype: string;
  palettePrimary: string;
  paletteAccent: string;
  paletteNeutral: string;
  toneAttributes: string[];
  valuePropsCount: number;
  painPointsCount: number;
  guardrailsCount: number;
  onSelectTab: (tabId: string) => void;
  onReExtract?: () => void;
}

export function BrandSnapshotCard({
  brandName,
  websiteUrl,
  tagline,
  archetype,
  palettePrimary,
  paletteAccent,
  paletteNeutral,
  toneAttributes,
  valuePropsCount,
  painPointsCount,
  guardrailsCount,
  onSelectTab,
  onReExtract,
}: BrandSnapshotCardProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  if (!brandName && !tagline && !websiteUrl) {
    return null;
  }

  const copyToClipboard = (hex: string, role: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(role);
    setTimeout(() => setCopiedColor(null), 1800);
  };

  const colors = [
    { role: "Primary", hex: palettePrimary },
    { role: "Accent", hex: paletteAccent },
    { role: "Neutral", hex: paletteNeutral },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-subtle space-y-4">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Brand identity overview with Logo initials */}
        <div className="flex items-start gap-3.5">
          <div
            className="h-11 w-11 rounded-lg border border-border flex items-center justify-center font-bold text-base shadow-sm shrink-0"
            style={{ backgroundColor: palettePrimary, color: paletteNeutral }}
          >
            {brandName ? brandName.slice(0, 2).toUpperCase() : "VB"}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold tracking-tight text-foreground">
                {brandName || "Configured Brand"}
              </h2>
              {websiteUrl && (
                <a
                  href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 text-xs"
                  title="Visit live website"
                >
                  <Globe className="h-3 w-3" />
                  <span className="font-mono text-[11px] truncate max-w-[160px]">
                    {websiteUrl.replace(/^https?:\/\//, "")}
                  </span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </a>
              )}
              <Badge variant="outline" className="text-[10px] font-medium border-border">
                {archetype || "Technical Expert"}
              </Badge>
            </div>

            {tagline && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
                &ldquo;{tagline}&rdquo;
              </p>
            )}

            {/* Active Voice Traits */}
            {toneAttributes.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {toneAttributes.map((trait) => (
                  <span
                    key={trait}
                    className="inline-flex items-center rounded bg-surface border border-border px-2 py-0.5 text-[10px] font-medium text-foreground"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Color Palette as Roles (Primary, Accent, Neutral with Hex & Copy) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <div className="rounded-lg border border-border bg-surface p-2.5 space-y-1.5">
            <span className="text-[10px] font-medium text-muted-foreground block">
              Brand Color Tokens
            </span>
            <div className="flex items-center gap-2">
              {colors.map(({ role, hex }) => {
                const isCopied = copiedColor === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => copyToClipboard(hex, role)}
                    className="group flex items-center gap-1.5 rounded border border-border bg-card px-2 py-1 text-left transition-colors hover:border-border-strong hover:bg-accent/40"
                    title={`Click to copy ${role} color (${hex})`}
                  >
                    <div
                      className="h-3.5 w-3.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-muted-foreground leading-none">{role}</span>
                      <span className="font-mono text-[10px] text-foreground font-semibold leading-tight">
                        {isCopied ? "Copied" : hex}
                      </span>
                    </div>
                    {isCopied ? (
                      <Check className="h-2.5 w-2.5 text-emerald-500 ml-0.5" />
                    ) : (
                      <Copy className="h-2.5 w-2.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Quick Links */}
      <div className="flex items-center justify-between pt-3 border-t border-border/70 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted-foreground text-[11px]">Jump to section:</span>
          <button
            type="button"
            onClick={() => onSelectTab("voice")}
            className="px-2.5 py-1 rounded-md border border-border bg-surface hover:bg-accent text-foreground text-xs font-medium transition-colors"
          >
            Identity & Voice
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("icp")}
            className="px-2.5 py-1 rounded-md border border-border bg-surface hover:bg-accent text-foreground text-xs font-medium transition-colors"
          >
            Value Props ({valuePropsCount}) & ICP ({painPointsCount})
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("compliance")}
            className="px-2.5 py-1 rounded-md border border-border bg-surface hover:bg-accent text-foreground text-xs font-medium transition-colors"
          >
            Guardrails & Rules ({guardrailsCount})
          </button>
        </div>

        {onReExtract && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReExtract}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            Re-sync from website
          </Button>
        )}
      </div>
    </div>
  );
}
