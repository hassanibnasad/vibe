"use client";

import React from "react";
import { ExternalLink, ShieldAlert, Target, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
}: BrandSnapshotCardProps) {
  if (!brandName && !tagline && !websiteUrl) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c0e14]/70 p-5 backdrop-blur-md">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Brand identity overview */}
        <div className="md:col-span-6 space-y-2">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-bold tracking-tight text-foreground font-display">
              {brandName || "Untitled Brand"}
            </h3>
            {websiteUrl && (
              <a
                href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-cyan-400 transition-colors inline-flex items-center gap-1 text-xs"
                title="Open website in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
            >
              {archetype || "Technical Expert"}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">
            &ldquo;{tagline || "No tagline specified."}&rdquo;
          </p>

          {/* Tone attribute preview */}
          {toneAttributes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {toneAttributes.slice(0, 4).map((attr) => (
                <span
                  key={attr}
                  className="inline-flex items-center rounded-md bg-white/[0.04] border border-white/10 px-2 py-0.5 text-[11px] font-medium text-foreground/80"
                >
                  {attr}
                </span>
              ))}
              {toneAttributes.length > 4 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{toneAttributes.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Visual Colors & Quick Metric Badges */}
        <div className="md:col-span-6 flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-5">
          {/* Color Palette Display */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
              Color Palette
            </span>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5 overflow-hidden p-0.5">
                <div
                  className="h-7 w-7 rounded-full border-2 border-[#0c0e14] shadow"
                  style={{ backgroundColor: palettePrimary }}
                  title={`Primary: ${palettePrimary}`}
                />
                <div
                  className="h-7 w-7 rounded-full border-2 border-[#0c0e14] shadow"
                  style={{ backgroundColor: paletteAccent }}
                  title={`Accent: ${paletteAccent}`}
                />
                <div
                  className="h-7 w-7 rounded-full border-2 border-[#0c0e14] shadow"
                  style={{ backgroundColor: paletteNeutral }}
                  title={`Neutral: ${paletteNeutral}`}
                />
              </div>
              <div className="text-[11px] font-mono text-muted-foreground flex gap-1">
                <span className="text-xs text-foreground font-semibold">3</span> tokens
              </div>
            </div>
          </div>

          {/* Quick Category Stat Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectTab("icp")}
              className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] p-2.5 min-w-[70px] transition-all text-center group"
            >
              <Target className="h-3.5 w-3.5 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-foreground font-mono">{valuePropsCount}</span>
              <span className="text-[9px] text-muted-foreground uppercase font-mono">Props</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab("icp")}
              className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] p-2.5 min-w-[70px] transition-all text-center group"
            >
              <Layers className="h-3.5 w-3.5 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-foreground font-mono">{painPointsCount}</span>
              <span className="text-[9px] text-muted-foreground uppercase font-mono">Hooks</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab("compliance")}
              className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] p-2.5 min-w-[70px] transition-all text-center group"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-foreground font-mono">{guardrailsCount}</span>
              <span className="text-[9px] text-muted-foreground uppercase font-mono">Rules</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
