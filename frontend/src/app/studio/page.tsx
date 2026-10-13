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
    // In a real run this attaches to a post ID or creates one
    toast({
      title: "Scheduled for publication",
      description: `Post will dispatch at ${new Date(targetIso).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}.`,
      variant: "success",
    });
  };

  const currentText = completion || (variants[selectedVariantIndex] ?? "");

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Studio"
        description="Draft, inspect against brand rules, preview against LinkedIn specifications, and schedule."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBrandRulesOpen(true)}
              className="h-8 text-xs gap-1.5 border-border hover:bg-accent text-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Brand Rules</span>
            </Button>
          </div>
        }
      />

      {/* Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Simplified Brief Form */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-subtle">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xs font-semibold text-foreground">Post Parameters</h2>
              {linkedInConnected ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  LinkedIn Active
                </span>
              ) : (
                <Link
                  href="/connections"
                  className="text-[11px] font-mono text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Connect LinkedIn
                </Link>
              )}
            </div>

            {/* Brand Grounding Indicator */}
            {brandProfile ? (
              <div className="rounded-md border border-border bg-surface p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground block">
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
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  View Rules
                </button>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-surface p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>No brand guidelines active. Using standard voice.</span>
                </div>
                <Link href="/brand" className="text-primary hover:underline text-[11px] font-medium">
                  Setup
                </Link>
              </div>
            )}

            {/* Topic / Prompt Brief Input */}
            <div className="space-y-1.5">
              <Label htmlFor="post-brief" className="text-xs font-medium text-foreground">
                Topic or Outline
              </Label>
              <Textarea
                id="post-brief"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="What tactical lesson, framework, or company update would you like to publish?"
                className="min-h-[140px] text-xs leading-relaxed bg-surface border-border focus:ring-1 focus:ring-ring"
                disabled={isStreaming}
              />
            </div>

            {/* Tone Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Voice Tone</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {tones.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`px-3 py-2 rounded-md border text-left text-xs transition-colors ${
                      tone === t.id
                        ? "border-primary bg-primary/5 text-foreground font-semibold"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Example Prompts */}
            <div className="pt-2 border-t border-border space-y-1.5">
              <span className="text-[11px] font-mono text-muted-foreground uppercase font-medium">
                Example Prompts
              </span>
              <div className="space-y-1">
                {EXAMPLE_PROMPTS.map((example, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setBrief(example);
                      handleGenerate(example);
                    }}
                    className="w-full text-left p-2 rounded border border-border/80 bg-surface/60 hover:bg-accent hover:border-border text-[11px] text-muted-foreground hover:text-foreground transition-colors leading-snug"
                  >
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
            <div className="rounded-lg border border-border bg-card p-12 text-center shadow-subtle">
              <EmptyState
                icon={FileText}
                title="No draft generated yet"
                description="Enter a topic or select an example prompt on the left to stream a LinkedIn post grounded in your brand voice."
                action={
                  <Button
                    onClick={() => handleGenerate()}
                    disabled={!brief.trim()}
                    className="h-8 text-xs gap-1.5 font-medium mt-2"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate post</span>
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

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-64 right-0 z-30 border-t border-border bg-background/95 backdrop-blur px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono text-[11px] tabular-nums">
            {currentText ? `${currentText.split(/\s+/).filter(Boolean).length} words` : "Ready"}
          </span>
          <span className="hidden sm:inline">•</span>
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
              className="h-8 gap-1.5 text-xs font-medium"
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
                    className="h-8 gap-1.5 text-xs font-medium border-border hover:bg-accent text-foreground"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Regenerate</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraft}
                    className="h-8 gap-1.5 text-xs font-medium border-border hover:bg-accent text-foreground"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Draft</span>
                  </Button>

                  <SchedulePopover
                    onSchedule={handleScheduleConfirm}
                    disabled={!currentText}
                  />
                </>
              )}

              <Button
                type="button"
                size="sm"
                onClick={() => handleGenerate()}
                disabled={!brief.trim() || isStreaming}
                className="h-8 px-4 text-xs gap-1.5 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-subtle"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{currentText ? "Generate Variant" : "Generate"}</span>
              </Button>
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
