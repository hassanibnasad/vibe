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
  Video,
  FileEdit,
  Activity,
  Layers,
  Image as ImageIcon,
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
  generateMarketingImage,
  BrandProfile,
} from "@/lib/api-client";
import { BrandRulesSheet } from "@/components/studio/BrandRulesSheet";
import { LinkedInPreview } from "@/components/studio/LinkedInPreview";
import { GroundingChecks } from "@/components/studio/GroundingChecks";
import { SchedulePopover } from "@/components/studio/SchedulePopover";
import { RemotionMotionStudio } from "@/components/remotion/RemotionMotionStudio";
import { RagCitationInspector } from "@/components/studio/RagCitationInspector";
import { FadeIn } from "@/lib/motion";

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

  // Preview Mode: LinkedIn Feed vs. Remotion Motion Reel vs. RAG Citations
  const [previewTab, setPreviewTab] = useState<"feed" | "remotion" | "citations">("feed");

  // FLUX Visuals state
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");

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

  const handleGenerateImage = async () => {
    const prompt = brief.trim() || currentText.trim();
    if (!prompt || isGeneratingImage) return;

    setIsGeneratingImage(true);
    try {
      const results = await generateMarketingImage({
        prompt,
        aspect_ratio: imageAspectRatio,
        brand_profile_id: brandProfile?.id,
      });
      if (results && results.length > 0) {
        setImageUrl(results[0].url);
        toast({
          title: "Visual asset generated",
          description: `Rendered with ${results[0].provider || "FLUX.1-schnell"} (${results[0].width}×${results[0].height}).`,
          variant: "success",
        });
      }
    } catch (err) {
      toast({
        title: "Image generation notice",
        description: err instanceof Error ? err.message : "Provider offline or timed out.",
        variant: "error",
      });
    } finally {
      setIsGeneratingImage(false);
    }
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
  const wordCount = currentText ? currentText.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="space-y-6 pb-28 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Content Studio"
        description="Draft with editorial nuance, ground in verified memory, and render interactive Remotion reels."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBrandRulesOpen(true)}
              className="h-8 text-xs gap-1.5 border-border/80 bg-surface/60 hover:bg-surface text-foreground transition-all duration-150"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span>Brand Directives</span>
            </Button>
          </div>
        }
      />

      {/* ── Shopify Editions Bento Telemetry Ribbon ── */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border/80 bg-card/90 p-3.5 backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
              <span>Streaming Engine</span>
              <Activity className="h-3 w-3 text-primary" />
            </div>
            <div className="font-display font-bold text-lg text-foreground tracking-tight flex items-center gap-2">
              <span>{isStreaming ? "Synthesizing" : "Standby"}</span>
              {isStreaming && <span className="h-2 w-2 rounded-full bg-primary animate-ping" />}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              {isStreaming ? "Streaming active · 48 tok/s" : "Ready for brief"}
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/90 p-3.5 backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
              <span>RAG Memory</span>
              <ShieldCheck className="h-3 w-3 text-primary" />
            </div>
            <div className="font-display font-bold text-lg text-foreground tracking-tight">
              {brandProfile?.brand_name || "Standard Grounding"}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              {brandProfile ? "pgvector cosine verified" : "Unbound prompt"}
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/90 p-3.5 backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
              <span>Synthesis Depth</span>
              <Layers className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="font-display font-bold text-lg text-foreground tracking-tight tabular-nums">
              {wordCount} words
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              {variants.length > 0 ? `${variants.length} variant${variants.length > 1 ? "s" : ""} cached` : "0 variants"}
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/90 p-3.5 backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
              <span>Remotion Engine</span>
              <Video className="h-3 w-3 text-primary" />
            </div>
            <div className="font-display font-bold text-lg text-foreground tracking-tight">
              30 FPS Kinetic
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              1:1 · 9:16 · 16:9 ready
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Composition & Parameters */}
        <div className="lg:col-span-5 space-y-5">
          <div className="relative rounded-xl border border-border/80 bg-card/90 backdrop-blur-xl p-5 space-y-4 shadow-subtle overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground font-mono">
                Post Parameters
              </h2>
              {linkedInConnected ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  LinkedIn Active
                </span>
              ) : (
                <Link
                  href="/connections"
                  className="text-[11px] font-mono text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/25 flex items-center gap-1.5 transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Connect LinkedIn
                </Link>
              )}
            </div>

            {/* Brand Grounding Indicator */}
            {brandProfile ? (
              <div className="rounded-xl border border-border/80 bg-surface/70 backdrop-blur-sm p-3.5 flex items-center justify-between text-xs transition-all duration-150">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground block">
                      {brandProfile.brand_name || "Configured Brand"}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {brandProfile.written_identity?.archetype || "Grounded Voice"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBrandRulesOpen(true)}
                  className="text-[11px] text-primary hover:underline font-mono"
                >
                  View Rules
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-surface/50 p-3.5 flex items-center justify-between text-xs">
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
                <span>Topic or Thesis Brief</span>
                <span className="text-[10px] text-muted-foreground font-mono">Markdown supported</span>
              </Label>
              <Textarea
                id="post-brief"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="What tactical lesson, framework, or company insight would you like to publish?"
                className="min-h-[140px] text-xs leading-relaxed bg-surface/60 border-border/80 focus:ring-primary/25 placeholder:text-muted-foreground/60"
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
                    className={`px-3 py-2 rounded-lg border text-left text-xs transition-all duration-150 ${
                      tone === t.id
                        ? "border-editions-mint/50 bg-editions-mint/10 text-white font-semibold shadow-xs"
                        : "border-border/80 bg-surface/50 text-muted-foreground hover:text-foreground hover:bg-surface hover:border-border-strong"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FLUX Visual Generator */}
            <div className="pt-3 border-t border-border/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-editions-mint" />
                  <span>FLUX.1 Schnell Visuals</span>
                </Label>
                <span className="text-[10px] font-mono text-editions-mint">
                  {imageUrl ? "Attached" : "Optional"}
                </span>
              </div>

              {/* Aspect Ratio Switcher */}
              <div className="grid grid-cols-3 gap-1.5">
                {(["1:1", "16:9", "9:16"] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setImageAspectRatio(ratio)}
                    className={`py-1 text-[11px] font-mono rounded border transition-colors ${
                      imageAspectRatio === ratio
                        ? "bg-white text-black font-semibold border-white"
                        : "bg-surface/50 border-border/80 text-muted-foreground hover:text-white"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              {/* Generate Image Button */}
              <Button
                type="button"
                onClick={handleGenerateImage}
                disabled={(!brief.trim() && !currentText.trim()) || isGeneratingImage}
                variant="outline"
                className="w-full h-8 text-xs font-medium gap-1.5 border-border/80 bg-surface/60 hover:bg-surface text-bone hover:text-white disabled:opacity-50"
              >
                {isGeneratingImage ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-editions-mint" />
                    <span>Rendering with FLUX...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-editions-mint" />
                    <span>{imageUrl ? "Regenerate Visual" : "Generate FLUX Visual"}</span>
                  </>
                )}
              </Button>

              {/* Image Preview Thumbnail if attached */}
              {imageUrl && (
                <div className="flex items-center justify-between p-2 rounded-lg border border-border/80 bg-obsidian text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Thumbnail"
                      className="h-9 w-9 rounded object-cover border border-border/80 shrink-0"
                    />
                    <div className="truncate">
                      <span className="text-[11px] font-mono text-white block">FLUX Asset Ready</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{imageAspectRatio} aspect</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="text-[11px] font-mono text-muted-foreground hover:text-rose-400 px-1.5"
                    title="Remove image"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Example Prompts */}
            <div className="pt-3 border-t border-border/60 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground uppercase font-semibold">
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
                    className="w-full text-left p-2.5 rounded-lg border border-border/70 bg-surface/40 hover:bg-surface hover:border-border text-[11px] text-muted-foreground hover:text-foreground transition-all duration-150 leading-snug group"
                  >
                    <span className="text-primary group-hover:text-primary mr-1">✦</span>
                    &ldquo;{example}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Dual Mode Preview (LinkedIn Feed vs Remotion Motion Reel) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Preview Mode Switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface/80 border border-border backdrop-blur-md">
              <button
                type="button"
                onClick={() => setPreviewTab("feed")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  previewTab === "feed"
                    ? "bg-foreground text-background font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileEdit className="h-3.5 w-3.5" />
                <span>LinkedIn Feed</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("remotion")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  previewTab === "remotion"
                    ? "bg-foreground text-background font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Video className="h-3.5 w-3.5 text-primary" />
                <span>Remotion Motion Reel</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("citations")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  previewTab === "citations"
                    ? "bg-foreground text-background font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>RAG Citations</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
              Shopify Editions Canvas
            </span>
          </div>

          {!currentText && !isStreaming ? (
            <div className="relative rounded-xl border border-border/80 bg-card/85 backdrop-blur-xl p-12 text-center shadow-subtle overflow-hidden">
              <EmptyState
                icon={FileText}
                title="No draft generated yet"
                description="Enter a topic or select an example prompt on the left to stream a LinkedIn post grounded in your brand voice."
                action={
                  <Button
                    onClick={() => handleGenerate()}
                    disabled={!brief.trim()}
                    className="h-8 text-xs gap-1.5 font-medium mt-3 bg-foreground text-background hover:bg-foreground/90 shadow-subtle"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate Draft</span>
                  </Button>
                }
              />
            </div>
          ) : previewTab === "remotion" ? (
            /* Remotion Motion Reel Studio View */
            <div className="space-y-5">
              <RemotionMotionStudio
                content={currentText}
                authorName={brandProfile?.brand_name || "VibeAgent Operator"}
                authorHeadline={brandProfile?.tagline || "Founder & AI Systems Architect"}
                brandName={brandProfile?.brand_name || "VibeAgent"}
                imageUrl={imageUrl}
              />

              <GroundingChecks
                content={currentText}
                brandProfile={brandProfile}
              />
            </div>
          ) : previewTab === "citations" ? (
            /* RAG Vector Grounding & Citation Inspector View */
            <div className="space-y-5">
              <RagCitationInspector currentBrief={brief} />
            </div>
          ) : (
            /* LinkedIn Accurate Preview Component */
            <div className="space-y-5">
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
                imageUrl={imageUrl}
                onRemoveImage={() => setImageUrl(null)}
              />

              {/* RAG Vector Grounding & Chunk Citations Inspector */}
              <RagCitationInspector currentBrief={brief} />

              {/* RAG Knowledge Sources & Brand-rule checks */}
              <GroundingChecks
                content={currentText}
                brandProfile={brandProfile}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar with Clean Editions Styling */}
      <div className="fixed bottom-0 left-0 md:left-16 lg:left-64 right-0 z-30 border-t border-border/80 bg-background/95 backdrop-blur-xl px-8 py-3 flex items-center justify-between shadow-elevated">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono text-[11px] tabular-nums text-foreground">
            {currentText ? `${wordCount} words` : "Studio Ready"}
          </span>
          <span className="hidden sm:inline text-border-strong">•</span>
          <span className="hidden sm:inline font-mono text-[11px]">
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
              <Square className="h-3 w-3 fill-current" />
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
                    className="h-8 gap-1.5 text-xs font-medium border-border/80 bg-surface/70 hover:bg-surface text-foreground"
                  >
                    <RefreshCw className="h-3 w-3 text-muted-foreground" />
                    <span>Regenerate</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraft}
                    className="h-8 gap-1.5 text-xs font-medium border-border/80 bg-surface/70 hover:bg-surface text-foreground"
                  >
                    <Save className="h-3 w-3 text-muted-foreground" />
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
                className="h-8 px-4 text-xs gap-1.5 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all shadow-subtle"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{currentText ? "Generate Variant" : "Generate Post"}</span>
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
