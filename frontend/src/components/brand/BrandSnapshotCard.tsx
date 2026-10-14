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
    <div className="relative rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl p-6 shadow-warm-md space-y-5 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        {/* Brand identity overview with Logo initials */}
        <div className="flex items-start gap-4">
          <div
            className="h-12 w-12 rounded-xl border border-border/80 flex items-center justify-center font-bold text-base shadow-warm-sm shrink-0 font-display"
            style={{ backgroundColor: palettePrimary, color: paletteNeutral }}
          >
            {brandName ? brandName.slice(0, 2).toUpperCase() : "VB"}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-display text-2xl font-normal tracking-tight text-foreground text-glow">
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
                  <Globe className="h-3 w-3 text-primary" />
                  <span className="font-mono text-[11px] truncate max-w-[160px]">
                    {websiteUrl.replace(/^https?:\/\//, "")}
                  </span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </a>
              )}
              <Badge variant="outline" className="text-[10px] font-medium border-primary/30 text-primary bg-primary/10">
                {archetype || "Technical Expert"}
              </Badge>
            </div>

            {tagline && (
              <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed italic font-serif">
                &ldquo;{tagline}&rdquo;
              </p>
            )}

            {/* Active Voice Traits */}
            {toneAttributes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {toneAttributes.map((trait) => (
                  <span
                    key={trait}
                    className="inline-flex items-center rounded-full bg-surface/80 border border-border/80 px-2.5 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur-xs"
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
          <div className="rounded-xl border border-border/70 bg-surface/60 backdrop-blur-sm p-3 space-y-2">
            <span className="text-[10px] font-mono tracking-wide uppercase text-muted-foreground block">
              Color Tokens
            </span>
            <div className="flex items-center gap-2">
              {colors.map(({ role, hex }) => {
                const isCopied = copiedColor === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => copyToClipboard(hex, role)}
                    className="group flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/70 px-2.5 py-1.5 text-left transition-all hover:border-primary/50 hover:bg-surface/80"
                    title={`Click to copy ${role} color (${hex})`}
                  >
                    <div
                      className="h-3.5 w-3.5 rounded-full border border-black/20 shadow-xs shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-muted-foreground leading-none">{role}</span>
                      <span className="font-mono text-[10px] text-foreground font-semibold leading-tight">
                        {isCopied ? "Copied" : hex}
                      </span>
                    </div>
                    {isCopied ? (
                      <Check className="h-2.5 w-2.5 text-emerald-400 ml-0.5" />
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
      <div className="flex items-center justify-between pt-3.5 border-t border-border/60 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted-foreground text-[11px]">Direct access:</span>
          <button
            type="button"
            onClick={() => onSelectTab("voice")}
            className="px-3 py-1 rounded-lg border border-border/70 bg-surface/70 hover:bg-surface hover:border-primary/40 text-foreground text-xs font-medium transition-all duration-200"
          >
            Identity & Voice
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("icp")}
            className="px-3 py-1 rounded-lg border border-border/70 bg-surface/70 hover:bg-surface hover:border-primary/40 text-foreground text-xs font-medium transition-all duration-200"
          >
            Value Props ({valuePropsCount}) & ICP ({painPointsCount})
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("compliance")}
            className="px-3 py-1 rounded-lg border border-border/70 bg-surface/70 hover:bg-surface hover:border-primary/40 text-foreground text-xs font-medium transition-all duration-200"
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
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Re-sync from site
          </Button>
        )}
      </div>
    </div>
  );
}
