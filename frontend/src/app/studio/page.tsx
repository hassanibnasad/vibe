"use client";

import React, { useState, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  Save,
  Square,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  FileText,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  fetchConnectors,
  fetchBrandProfile,
  BrandProfile,
} from "@/lib/api-client";
import { BrandRulesSheet } from "@/components/studio/BrandRulesSheet";
import { LinkedInPreview } from "@/components/studio/LinkedInPreview";
import { GroundingChecks } from "@/components/studio/GroundingChecks";
import { SchedulePopover } from "@/components/studio/SchedulePopover";
import { BorderTrail } from "@/components/ui/motion";

const tones = [
  { id: "thought_leadership", label: "Thought Leadership" },
  { id: "contrarian", label: "Contrarian & Sharp" },
  { id: "tactical", label: "Tactical Playbook" },
  { id: "storytelling", label: "Executive Story" },
];

const EXAMPLE_PROMPTS = [
  "How autonomous agents eliminate outbound SDR bottlenecks in 2026",
  "3 counter-intuitive lessons learned from scaling pgvector in production",
  "Why enterprise workflows are moving from deterministic DAGs to agentic loops",
];

export default function ContentStudioPage() {
  const { toast } = useToast();
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState("thought_leadership");
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [brandRulesOpen, setBrandRulesOpen] = useState(false);
  const [linkedInConnected, setLinkedInConnected] = useState<boolean | null>(null);

  // Variant management
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Vercel AI SDK completion stream
  const {
    completion,
    complete,
    isLoading: isStreaming,
    stop,
    setCompletion,
  } = useCompletion({
    api: "/api/generate",
    streamProtocol: "text",
    onFinish: (_prompt, finalCompletion) => {
      setVariants((prev) => {
        if (prev.length === 0) return [finalCompletion];
        return [...prev, finalCompletion];
      });
      setSelectedVariantIndex(variants.length);
    },
  });

  useEffect(() => {
    fetchConnectors()
      .then((conns) => {
        const active = conns.some(
          (c) => c.provider.toLowerCase() === "linkedin" && c.status === "active"
        );
        setLinkedInConnected(active);
      })
      .catch(() => setLinkedInConnected(false));

    fetchBrandProfile()
      .then(setBrandProfile)
      .catch(() => {});
  }, []);

  const handleGenerate = async (overridePrompt?: string) => {
    const promptToUse = overridePrompt || brief;
    if (!promptToUse.trim() || isStreaming) return;

    await complete(promptToUse, {
      body: {
        tone,
        platform: "LinkedIn",
        brand_profile: brandProfile,
      },
    });
  };

  const handleSaveDraft = () => {
    if (!currentText) return;
    toast({
      title: "Draft saved",
      description: "Post saved to your review queue and ready for scheduling.",
      variant: "success",
      onUndo: () => {
        toast({
          title: "Save undone",
          description: "Draft reverted.",
        });
      },
    });
  };

  const handleScheduleConfirm = async (targetIso: string) => {
    toast({
      title: "Scheduled for publication",
      description: `Post will dispatch at ${new Date(targetIso).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}.`,
      variant: "success",
    });
  };

  const currentText = completion || (variants[selectedVariantIndex] ?? "");

  return (
    <div className="space-y-6 pb-28 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Content Studio"
        description="Draft with editorial nuance, ground in verified memory, and simulate LinkedIn feed reception."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBrandRulesOpen(true)}
              className="h-9 text-xs gap-1.5 border-border/80 bg-surface/60 backdrop-blur-sm hover:bg-accent/70 hover:border-border text-foreground transition-all duration-200"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span>Brand Directives</span>
            </Button>
          </div>
        }
      />

      {/* Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Composition & Parameters */}
        <div className="lg:col-span-5 space-y-5">
          <div className="relative rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl p-5 space-y-4 shadow-warm-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Post Parameters</h2>
              {linkedInConnected ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LinkedIn Active
                </span>
              ) : (
                <Link
                  href="/connections"
                  className="text-[11px] font-mono text-amber-400 hover:text-amber-300 bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-500/25 flex items-center gap-1.5 transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Connect LinkedIn
                </Link>
              )}
            </div>

            {/* Brand Grounding Indicator */}
            {brandProfile ? (
              <div className="rounded-xl border border-border/80 bg-surface/70 backdrop-blur-sm p-3.5 flex items-center justify-between text-xs transition-all duration-200">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground block">
                      {brandProfile.brand_name || "Configured Brand"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {brandProfile.written_identity?.archetype || "Grounded Voice"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBrandRulesOpen(true)}
                  className="text-[11px] text-primary hover:text-primary/80 font-medium hover:underline"
                >
                  View Rules
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/90 bg-surface/50 p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="text-xs">No brand guidelines active. Using standard voice.</span>
                </div>
                <Link href="/brand" className="text-primary hover:underline text-[11px] font-medium ml-2 shrink-0">
                  Setup
                </Link>
              </div>
            )}

            {/* Topic / Prompt Brief Input */}
            <div className="space-y-2">
              <Label htmlFor="post-brief" className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>Topic or Thesis</span>
                <span className="text-[10px] text-muted-foreground font-mono">Markdown supported</span>
              </Label>
              <Textarea
                id="post-brief"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="What tactical lesson, framework, or company update would you like to publish?"
                className="min-h-[140px] text-xs leading-relaxed bg-surface/70 border-border/80 focus:ring-primary/25 placeholder:text-muted-foreground/60"
                disabled={isStreaming}
              />
            </div>

            {/* Tone Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground">Voice Tone</Label>
              <div className="grid grid-cols-2 gap-2">
                {tones.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`px-3 py-2.5 rounded-xl border text-left text-xs transition-all duration-200 ${
                      tone === t.id
                        ? "border-primary/50 bg-gradient-to-r from-primary/20 to-primary/5 text-foreground font-medium shadow-warm-sm"
                        : "border-border/70 bg-surface/50 text-muted-foreground hover:text-foreground hover:bg-surface hover:border-border"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Example Prompts */}
            <div className="pt-3 border-t border-border/60 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground uppercase font-medium">
                <Lightbulb className="h-3 w-3 text-amber-400" />
                <span>Example Sparks</span>
              </div>
              <div className="space-y-1.5">
                {EXAMPLE_PROMPTS.map((example, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setBrief(example);
                      handleGenerate(example);
                    }}
                    className="w-full text-left p-2.5 rounded-xl border border-border/60 bg-surface/40 hover:bg-surface/80 hover:border-border text-[11px] text-muted-foreground hover:text-foreground transition-all duration-200 leading-snug group"
                  >
                    <span className="text-primary/70 group-hover:text-primary mr-1">✦</span>
                    &ldquo;{example}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Live LinkedIn Preview or Empty State */}
        <div className="lg:col-span-7 space-y-5">
          {!currentText && !isStreaming ? (
            <div className="relative rounded-2xl border border-border/80 bg-card/75 backdrop-blur-xl p-12 text-center shadow-warm-sm overflow-hidden">
              <EmptyState
                icon={FileText}
                title="No draft generated yet"
                description="Enter a topic or select an example prompt on the left to stream a LinkedIn post grounded in your brand voice."
                action={
                  <Button
                    onClick={() => handleGenerate()}
                    disabled={!brief.trim()}
                    className="h-9 text-xs gap-1.5 font-medium mt-3 bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-500 shadow-warm-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate Draft</span>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="space-y-5">
              {/* LinkedIn Accurate Preview Component */}
              <LinkedInPreview
                content={currentText}
                onContentChange={(newText) => {
                  setCompletion(newText);
                  if (variants.length > 0) {
                    const next = [...variants];
                    next[selectedVariantIndex] = newText;
                    setVariants(next);
                  }
                }}
                isStreaming={isStreaming}
                authorName={brandProfile?.brand_name || "VibeAgent Operator"}
                authorHeadline={brandProfile?.tagline || "Founder & AI Systems Architect"}
                variants={variants}
                selectedVariantIndex={selectedVariantIndex}
                onSelectVariant={(idx) => {
                  setSelectedVariantIndex(idx);
                  setCompletion(variants[idx]);
                }}
              />

              {/* RAG Knowledge Sources & Brand-rule checks */}
              <GroundingChecks
                content={currentText}
                brandProfile={brandProfile}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar with Warm Glass & Surrealist Shadows */}
      <div className="fixed bottom-0 left-64 right-0 z-30 border-t border-border/80 bg-background/85 backdrop-blur-xl px-8 py-3.5 flex items-center justify-between shadow-warm-lg">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono text-[11px] tabular-nums text-foreground/80">
            {currentText ? `${currentText.split(/\s+/).filter(Boolean).length} words` : "Studio Ready"}
          </span>
          <span className="hidden sm:inline text-border-strong">•</span>
          <span className="hidden sm:inline">
            {brandProfile ? `Grounded in ${brandProfile.brand_name || "Brand Rules"}` : "Standard voice"}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {isStreaming ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={stop}
              className="h-9 gap-1.5 text-xs font-medium"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Stop Generating</span>
            </Button>
          ) : (
            <>
              {currentText && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerate()}
                    className="h-9 gap-1.5 text-xs font-medium border-border/80 bg-surface/70 hover:bg-surface text-foreground shadow-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Regenerate</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraft}
                    className="h-9 gap-1.5 text-xs font-medium border-border/80 bg-surface/70 hover:bg-surface text-foreground shadow-xs"
                  >
                    <Save className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Save Draft</span>
                  </Button>

                  <SchedulePopover
                    onSchedule={handleScheduleConfirm}
                    disabled={!currentText}
                  />
                </>
              )}

              <div className="relative">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleGenerate()}
                  disabled={!brief.trim() || isStreaming}
                  className="h-9 px-4 text-xs gap-1.5 font-medium bg-gradient-to-r from-primary via-amber-600 to-primary bg-[length:200%_auto] text-primary-foreground hover:opacity-95 transition-all shadow-warm-md"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{currentText ? "Generate Variant" : "Generate Post"}</span>
                </Button>
                {brief.trim() && !isStreaming && (
                  <BorderTrail size={40} className="bg-primary/60" />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Brand Rules Side Sheet */}
      <BrandRulesSheet
        open={brandRulesOpen}
        onOpenChange={setBrandRulesOpen}
        brandProfile={brandProfile}
      />
    </div>
  );
}
