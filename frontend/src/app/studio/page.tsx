"use client";

import React, { useState, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";
import {
  Send,
  Calendar as CalendarIcon,
  Copy,
  Check,
  Sparkles,
  FileEdit,
  RefreshCw,
  Clock,
  Layers,
  ImageIcon,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import {
  fetchPosts,
  schedulePost,
  Post,
  fetchConnectors,
  SocialConnection,
  fetchBrandProfile,
  BrandProfile,
  generateImage,
  ImageResult,
} from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/utils";
import { FadeIn } from "@/lib/motion";
import { AnimatedCheck, PulseBeacon } from "@/components/ui/AnimatedCheck";
import { ShieldCheck, ShieldAlert, ExternalLink } from "lucide-react";

const tones = [
  { id: "thought_leadership", label: "Thought Leadership" },
  { id: "contrarian", label: "Contrarian & Sharp" },
  { id: "tactical", label: "Tactical Playbook" },
  { id: "storytelling", label: "Executive Story" },
];

export default function ContentStudioPage() {
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState("thought_leadership");
  const [copied, setCopied] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [linkedInConnected, setLinkedInConnected] = useState<boolean | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);

  // FLUX.1 [schnell] visual companion state
  const [generateImageEnabled, setGenerateImageEnabled] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState("1:1");
  const [imageStylePreset, setImageStylePreset] = useState("editorial_photography");
  const [generatedImage, setGeneratedImage] = useState<ImageResult | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    fetchConnectors()
      .then((conns) => {
        const active = conns.some(
          (c) => c.provider.toLowerCase() === "linkedin" && c.status === "active"
        );
        setLinkedInConnected(active);
      })
      .catch(() => {
        setLinkedInConnected(false);
      });

    fetchBrandProfile()
      .then((bp) => {
        setBrandProfile(bp);
      })
      .catch(() => {
        // Silently continue if backend offline
      });
  }, []);

  // Calendar tab data
  const [calendarPosts, setCalendarPosts] = useState<Post[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Vercel AI SDK completion stream
  const {
    completion,
    complete,
    isLoading: isStreaming,
  } = useCompletion({
    api: "/api/generate",
    streamProtocol: "text",
  });

  const loadCalendarPosts = () => {
    setCalendarLoading(true);
    fetchPosts()
      .then((posts) => {
        setCalendarPosts(posts);
        setCalendarLoading(false);
      })
      .catch(() => {
        setCalendarPosts([]);
        setCalendarLoading(false);
      });
  };

  const handleGenerateImage = async () => {
    if (!brief.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setImageError(null);
    try {
      const results = await generateImage({
        prompt: brief,
        aspect_ratio: imageAspectRatio,
        style_preset: imageStylePreset,
        brand_profile_id: brandProfile?.id,
        n: 1,
      });
      if (results && results.length > 0) {
        setGeneratedImage(results[0]);
      } else {
        setImageError("No visual returned by provider.");
      }
    } catch (err: any) {
      setImageError(err.message || "Failed to generate visual asset.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleStreamGenerate = async () => {
    if (!brief.trim() || isStreaming) return;
    if (generateImageEnabled) {
      handleGenerateImage();
    }
    await complete(brief, {
      body: {
        tone,
        platform: "LinkedIn",
        brand_profile: brandProfile,
      },
    });
  };

  const handleCopy = () => {
    const textToCopy = completion || "";
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const wordCount = completion ? completion.trim().split(/\s+/).length : 0;
  const charCount = completion ? completion.length : 0;

  return (
    <div className="space-y-10 pb-16">
      {/* Editorial Header */}
      <FadeIn>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Vercel AI SDK Engine
            </span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Content <span className="text-gradient-cyan">Studio</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Stream high-conversion social narratives, optimize scroll-stopping hooks, and schedule multi-platform dispatches.
          </p>
        </div>
      </FadeIn>

      <Tabs
        defaultValue="creator"
        className="space-y-8"
        onValueChange={(v) => {
          if (v === "calendar") loadCalendarPosts();
        }}
      >
        <TabsList className="h-11 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl backdrop-blur-xl">
          <TabsTrigger
            value="creator"
            className="rounded-lg px-5 py-2 text-xs font-medium data-[state=active]:bg-white/[0.08] data-[state=active]:text-white transition-all"
          >
            Creative Canvas
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="rounded-lg px-5 py-2 text-xs font-medium data-[state=active]:bg-white/[0.08] data-[state=active]:text-white transition-all"
          >
            Dispatch Schedule
          </TabsTrigger>
        </TabsList>

        {/* Creator View */}
        <TabsContent value="creator" className="mt-0 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Strategic Brief Parameters */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-panel rounded-3xl p-7 border border-white/[0.08] space-y-6">
                <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
                  <h3 className="font-display font-bold text-base text-white">Strategic Brief</h3>
                  <div className="flex items-center gap-2">
                    {linkedInConnected === true ? (
                      <Link
                        href="/connections"
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/20 transition-colors"
                        title="LinkedIn connected. Click to manage."
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>LinkedIn Active</span>
                      </Link>
                    ) : linkedInConnected === false ? (
                      <Link
                        href="/connections"
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/25 transition-colors"
                        title="LinkedIn not connected. Click to authorize."
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>Connect LinkedIn</span>
                      </Link>
                    ) : (
                      <span className="text-[11px] font-mono text-cyan-400 bg-cyan-400/10 px-2.5 py-0.5 rounded-full border border-cyan-400/20">
                        LinkedIn B2B
                      </span>
                    )}
                  </div>
                </div>

                {/* Brand Identity Grounding Banner */}
                {brandProfile ? (
                  <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span className="text-xs font-semibold text-white">
                          {brandProfile.brand_name || "Active Brand"}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-cyan-400/30 bg-cyan-400/10 text-cyan-300 text-[10px] py-0 px-2 font-mono"
                        >
                          {brandProfile.written_identity?.archetype || "Brand Grounded"}
                        </Badge>
                      </div>
                      <Link
                        href="/brand"
                        className="text-[11px] text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
                        title="View & customize brand voice and policies"
                      >
                        <span>Brand Rules</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>

                    {/* Quick Insertion Chips */}
                    {((brandProfile.core_value_props && brandProfile.core_value_props.length > 0) ||
                      (brandProfile.conversion_assets?.cta_templates &&
                        brandProfile.conversion_assets.cta_templates.length > 0)) && (
                      <div className="pt-2 border-t border-white/[0.05] flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mr-1">
                          Inject:
                        </span>
                        {brandProfile.core_value_props?.slice(0, 2).map((vp, idx) => (
                          <button
                            key={`prop-${idx}`}
                            type="button"
                            onClick={() => {
                              setBrief((prev) =>
                                prev
                                  ? `${prev}\n\nKey Value Proposition: "${vp}"`
                                  : `Key Value Proposition: "${vp}"`
                              );
                            }}
                            className="text-[10px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-muted-foreground hover:text-white px-2 py-0.5 rounded-md transition-colors truncate max-w-[190px]"
                            title={`Click to append value prop: ${vp}`}
                          >
                            + Prop: {vp}
                          </button>
                        ))}
                        {brandProfile.conversion_assets?.cta_templates?.slice(0, 2).map((cta, idx) => (
                          <button
                            key={`cta-${idx}`}
                            type="button"
                            onClick={() => {
                              setBrief((prev) =>
                                prev ? `${prev}\n\nCall To Action: "${cta}"` : `Call To Action: "${cta}"`
                              );
                            }}
                            className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md transition-colors truncate max-w-[190px]"
                            title={`Click to append CTA hook: ${cta}`}
                          >
                            + CTA: {cta}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>No brand voice configured. Posts use standard defaults.</span>
                    </div>
                    <Link
                      href="/brand"
                      className="text-cyan-400 hover:underline text-[11px] font-medium flex items-center gap-1"
                    >
                      <span>Configure</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}

                {/* Brief Input */}
                <div className="space-y-2">
                  <Label htmlFor="brief" className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Core Thesis & Target Goals
                  </Label>
                  <Textarea
                    id="brief"
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="e.g. Why AI outbound fails without real-time BANT intent qualification. Target Series A founders and VPs of Sales..."
                    className="min-h-[140px] text-sm bg-black/40 border-white/[0.08] rounded-xl focus:border-cyan-400/50 transition-colors placeholder:text-muted-foreground/50 leading-relaxed"
                  />
                </div>

                {/* Tone Pill Selectors */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Narrative Voice
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {tones.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTone(t.id)}
                        className={`rounded-xl border p-2.5 text-xs text-left transition-all ${
                          tone === t.id
                            ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-200 font-medium shadow-[0_0_15px_-3px_rgba(56,189,248,0.2)]"
                            : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Visual Companion (FLUX.1 [schnell]) */}
                <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs font-semibold text-white">Visual Companion</span>
                      <Badge
                        variant="outline"
                        className="border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-[10px] py-0 px-1.5 font-mono"
                      >
                        FLUX.1 [schnell]
                      </Badge>
                    </div>
                    <Switch
                      checked={generateImageEnabled}
                      onCheckedChange={setGenerateImageEnabled}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500 data-[state=checked]:to-indigo-500"
                    />
                  </div>

                  {generateImageEnabled && (
                    <div className="space-y-3 pt-2 border-t border-white/[0.06] text-xs">
                      {/* Aspect Ratio */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                          Aspect Ratio
                        </Label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: "1:1", label: "1:1 Square" },
                            { id: "16:9", label: "16:9 Banner" },
                            { id: "4:5", label: "4:5 Portrait" },
                          ].map((ar) => (
                            <button
                              key={ar.id}
                              type="button"
                              onClick={() => setImageAspectRatio(ar.id)}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-all ${
                                imageAspectRatio === ar.id
                                  ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
                                  : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04]"
                              }`}
                            >
                              {ar.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Style Preset */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                          Visual Style Preset
                        </Label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: "editorial_photography", label: "Editorial Photo" },
                            { id: "minimalist_3d", label: "Minimalist 3D" },
                            { id: "modern_vector", label: "Modern Vector" },
                            { id: "dark_cyberpunk", label: "Dark Tech" },
                          ].map((sp) => (
                            <button
                              key={sp.id}
                              type="button"
                              onClick={() => setImageStylePreset(sp.id)}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-all ${
                                imageStylePreset === sp.id
                                  ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-200"
                                  : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04]"
                              }`}
                            >
                              {sp.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Standalone Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateImage}
                        disabled={!brief.trim() || isGeneratingImage}
                        className="w-full h-8 text-[11px] gap-1.5 border-white/[0.08] hover:bg-white/[0.06] text-muted-foreground hover:text-white"
                      >
                        {isGeneratingImage ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
                            <span>Generating FLUX Visual...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3 w-3 text-cyan-400" />
                            <span>Generate Visual Asset Only</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Stream Trigger Button */}
                <Button
                  onClick={handleStreamGenerate}
                  disabled={!brief.trim() || isStreaming}
                  className="w-full h-12 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white shadow-[0_0_25px_-5px_rgba(56,189,248,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {isStreaming ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Streaming Generation...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Stream Post with AI SDK
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right: Live Generative Output Canvas */}
            <div className="lg:col-span-7">
              <div className="glass-panel rounded-3xl p-7 lg:p-8 border border-white/[0.08] min-h-[480px] flex flex-col justify-between relative overflow-hidden">
                {/* Header bar */}
                <div className="flex items-center justify-between border-b border-white/[0.07] pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-base text-white">Live Draft Stream</span>
                    {isStreaming && <PulseBeacon status="live" />}
                  </div>

                  {completion && (
                    <div className="flex items-center gap-3">
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {wordCount} words · {charCount} chars
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-white hover:bg-white/[0.06]"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? "Copied" : "Copy"}</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Streaming Content Surface */}
                <div className="flex-1 space-y-6">
                  {/* FLUX.1 Visual Companion Asset */}
                  {(isGeneratingImage || generatedImage || imageError) && (
                    <div className="rounded-2xl border border-white/[0.08] bg-black/50 p-4 space-y-3 overflow-hidden backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-cyan-400" />
                          <span className="text-xs font-semibold text-white">Visual Companion Asset</span>
                          <Badge
                            variant="outline"
                            className="border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-[10px] font-mono"
                          >
                            FLUX.1 [schnell]
                          </Badge>
                          {generatedImage?.provider && (
                            <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
                              · {generatedImage.provider}
                            </span>
                          )}
                        </div>
                        {generatedImage && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(generatedImage.url, "_blank")}
                              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-white gap-1"
                              title="Open image full size"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>View Full</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleGenerateImage}
                              disabled={isGeneratingImage}
                              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-white gap-1"
                              title="Regenerate image"
                            >
                              <RefreshCw className={`h-3 w-3 ${isGeneratingImage ? "animate-spin" : ""}`} />
                              <span>Regenerate</span>
                            </Button>
                          </div>
                        )}
                      </div>

                      {isGeneratingImage ? (
                        <div className="h-60 rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center space-y-2 animate-pulse">
                          <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
                          <p className="text-xs font-mono text-muted-foreground">
                            Synthesizing on-brand visual with FLUX.1 [schnell]...
                          </p>
                        </div>
                      ) : generatedImage ? (
                        <div className="relative rounded-xl overflow-hidden border border-white/10 group max-h-80 flex justify-center bg-black/80">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={generatedImage.url}
                            alt={generatedImage.prompt || "Generated post visual"}
                            className="object-contain max-h-80 w-full rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
                          />
                        </div>
                      ) : null}

                      {imageError && (
                        <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                          {imageError}
                        </p>
                      )}
                    </div>
                  )}
                  {!completion && !isStreaming ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center space-y-3 p-8">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] text-muted-foreground/60">
                        <FileEdit className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-display font-semibold text-white text-sm">Awaiting Strategic Brief</h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          Enter your thesis and tone in the panel on the left, then trigger the stream to watch the AI craft your dispatch live.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="font-sans text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed space-y-4 font-normal selection:bg-cyan-500/30">
                      {completion}
                      {isStreaming && (
                        <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                      )}
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                {completion && (
                  <div className="pt-6 border-t border-white/[0.07] flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2">
                      <AnimatedCheck size={14} />
                      <span className="text-xs font-mono text-emerald-400">Stream Complete</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScheduleDialogOpen(true)}
                        className="rounded-xl h-9 text-xs gap-1.5 border-white/[0.08] hover:bg-white/[0.06] text-muted-foreground hover:text-white"
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        Schedule Dispatch
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Schedule View */}
        <TabsContent value="calendar" className="mt-0">
          <div className="glass-panel rounded-3xl p-7 border border-white/[0.08]">
            <div className="mb-6">
              <h3 className="font-display font-bold text-lg text-white">Scheduled Dispatches</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upcoming social publications verified by operators
              </p>
            </div>

            {calendarLoading ? (
              <div className="py-12 text-center text-xs font-mono text-muted-foreground">
                Querying dispatch ledger...
              </div>
            ) : calendarPosts.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground max-w-sm mx-auto space-y-2">
                <Clock className="h-6 w-6 text-muted-foreground/50 mx-auto" />
                <p>No dispatches scheduled in the queue.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.07]">
                    <TableHead className="text-xs font-mono">Date</TableHead>
                    <TableHead className="text-xs font-mono">Content Excerpt</TableHead>
                    <TableHead className="text-xs font-mono">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calendarPosts.map((p) => (
                    <TableRow key={p.id} className="border-white/[0.05]">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.scheduled_at ? formatRelativeTime(p.scheduled_at) : "Draft"}
                      </TableCell>
                      <TableCell className="text-sm text-foreground line-clamp-1">
                        {p.content}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
