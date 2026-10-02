"use client";

import React, { useState } from "react";
import { Sparkles, RefreshCw, Globe, ArrowRight, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BrandExtractionWizardProps {
  brandName: string;
  setBrandName: (v: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (v: string) => void;
  extracting: boolean;
  extractionStep: string;
  extractionJobId: string | null;
  onStartExtraction: () => void;
  hasProfile: boolean;
  extractionStatus?: string;
  lastExtractedAt?: string | null;
}

export function BrandExtractionWizard({
  brandName,
  setBrandName,
  websiteUrl,
  setWebsiteUrl,
  extracting,
  extractionStep,
  extractionJobId,
  onStartExtraction,
  hasProfile,
  extractionStatus,
  lastExtractedAt,
}: BrandExtractionWizardProps) {
  const [isExpanded, setIsExpanded] = useState(!hasProfile);

  const canExtract = websiteUrl.trim().length > 0 && brandName.trim().length > 0 && !extracting;

  // When profile is configured and not extracting, show an uncluttered compact bar with expand option
  if (hasProfile && !isExpanded && !extracting) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0c0e14]/60 px-5 py-3.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">AI Brand Auto-Extraction</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ${
                extractionStatus === "complete"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : extractionStatus === "failed"
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {extractionStatus === "complete" && <CheckCircle2 className="h-2.5 w-2.5" />}
                {extractionStatus || "Configured"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Connected to <span className="font-mono text-foreground">{websiteUrl || "No website"}</span>
              {lastExtractedAt && ` · Synced ${new Date(lastExtractedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="border-white/10 hover:bg-white/5 text-xs h-8 gap-1.5"
          >
            Re-sync from Website
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 via-[#0c0e14]/80 to-[#0c0e14]/90 p-6 backdrop-blur-xl shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              Instant Setup
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground font-display">
            {hasProfile ? "Re-Extract Brand from Website" : "One-Click Brand & Voice Extraction"}
          </h2>
          <p className="text-xs text-muted-foreground max-w-xl">
            Enter your landing page URL. VibeAgent automatically scans your site, discovers your visual color palette, synthesizes your voice archetype, and extracts core value propositions in under a minute.
          </p>
        </div>

        {hasProfile && !extracting && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-xs text-muted-foreground hover:text-white h-7 gap-1"
          >
            Collapse
            <ChevronUp className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
        <div className="sm:col-span-4 space-y-1.5">
          <Label htmlFor="quickBrandName" className="text-xs font-medium text-foreground">
            Brand Name
          </Label>
          <Input
            id="quickBrandName"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. Stripe, Linear, Acme AI"
            disabled={extracting}
            className="bg-black/40 border-white/10 text-sm h-10 rounded-xl focus:border-cyan-400/50"
          />
        </div>

        <div className="sm:col-span-5 space-y-1.5">
          <Label htmlFor="quickWebsiteUrl" className="text-xs font-medium text-foreground">
            Website URL
          </Label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="quickWebsiteUrl"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={extracting}
              className="bg-black/40 border-white/10 text-sm h-10 pl-9 rounded-xl focus:border-cyan-400/50"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <Button
            type="button"
            onClick={onStartExtraction}
            disabled={!canExtract}
            className="w-full h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {extracting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Auto-Extract Brand</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {extracting && (
        <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="h-4 w-4 text-cyan-400 animate-spin shrink-0" />
            <div>
              <span className="font-medium text-cyan-200">Autonomous Crawl & Synthesis</span>
              <p className="text-[11px] text-cyan-300/70">{extractionStep || "Processing..."}</p>
            </div>
          </div>
          {extractionJobId && (
            <span className="text-[10px] font-mono text-cyan-400/60 hidden sm:inline">
              Job: {extractionJobId.slice(0, 8)}...
            </span>
          )}
        </div>
      )}
    </div>
  );
}
