"use client";

import React, { useState } from "react";
import { Globe, ArrowRight, RefreshCw, CheckCircle2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BrandExtractionWizardProps {
  brandName: string;
  setBrandName: (val: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (val: string) => void;
  extracting: boolean;
  extractionStep: string;
  extractionJobId: string | null;
  onStartExtraction: () => void;
  hasProfile: boolean;
  extractionStatus?: string | null;
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

  const canExtract = Boolean(websiteUrl.trim()) && !extracting;

  // Real extraction state label
  const stateLabel = extracting
    ? "Reading site & extracting guidelines..."
    : extractionStatus === "complete"
    ? `Done · Last synced ${lastExtractedAt ? new Date(lastExtractedAt).toLocaleDateString() : "recently"}`
    : extractionStatus === "failed"
    ? "Failed · Check URL or retry"
    : "Idle · Ready to extract";

  // When profile is configured and not extracting, show a compact secondary bar
  if (hasProfile && !isExpanded && !extracting) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-3 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface text-foreground border border-border">
            <Globe className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Website brand synchronization</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-medium ${
                  extractionStatus === "complete"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : extractionStatus === "failed"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-surface text-muted-foreground"
                }`}
              >
                {extractionStatus === "complete" && <CheckCircle2 className="h-2.5 w-2.5" />}
                {extractionStatus === "failed" && <AlertCircle className="h-2.5 w-2.5" />}
                {stateLabel}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Source: <span className="text-foreground font-mono">{websiteUrl || "Not specified"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="border-border hover:bg-accent text-xs h-7 gap-1"
          >
            <span>Re-extract from website</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-subtle space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            {hasProfile ? "Re-extract brand from website" : "Extract brand guidelines from website"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Enter your landing page URL to scan colors, positioning archetype, and core value propositions.
          </p>
        </div>

        {hasProfile && !extracting && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-xs text-muted-foreground hover:text-foreground h-7 gap-1"
          >
            <span>Cancel</span>
            <ChevronUp className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
        <div className="sm:col-span-4 space-y-1.5">
          <Label htmlFor="quickBrandName" className="text-xs font-medium text-foreground">
            Brand Name
          </Label>
          <Input
            id="quickBrandName"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. Acme Corp"
            disabled={extracting}
            className="bg-background border-border text-xs h-9 rounded-md focus:border-ring"
          />
        </div>

        <div className="sm:col-span-5 space-y-1.5">
          <Label htmlFor="quickWebsiteUrl" className="text-xs font-medium text-foreground">
            Website URL
          </Label>
          <div className="relative">
            <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="quickWebsiteUrl"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={extracting}
              className="bg-background border-border text-xs h-9 pl-8 rounded-md focus:border-ring"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <Button
            type="button"
            onClick={onStartExtraction}
            disabled={!canExtract}
            className="w-full h-9 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium text-xs gap-1.5 transition-colors shadow-subtle disabled:opacity-50"
          >
            {extracting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Reading site...</span>
              </>
            ) : (
              <>
                <span>Extract guidelines</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {extracting && (
        <div className="rounded-lg border border-border bg-surface p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
            <div>
              <span className="font-medium text-foreground">Extracting brand tokens</span>
              <p className="text-[11px] text-muted-foreground">{extractionStep || "Analyzing page content..."}</p>
            </div>
          </div>
          {extractionJobId && (
            <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
              Job: {extractionJobId.slice(0, 8)}...
            </span>
          )}
        </div>
      )}
    </div>
  );
}
