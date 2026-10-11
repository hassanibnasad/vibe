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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border">
            <Sparkles className="h-3.5 w-3.5 text-foreground" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Vercel AI SDK Engine
            </span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Content Studio
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
        <TabsList className="h-10 p-1 bg-surface border border-border rounded-lg">
          <TabsTrigger
            value="creator"
            className="rounded-md px-4 py-1.5 text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground transition-colors"
          >
            Creative Canvas
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="rounded-md px-4 py-1.5 text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground transition-colors"
          >
            Dispatch Schedule
          </TabsTrigger>
        </TabsList>

        {/* Creator View */}
        <TabsContent value="creator" className="mt-0 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Strategic Brief Parameters */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-card rounded-2xl p-7 border border-border space-y-6 shadow-subtle">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h3 className="font-display font-bold text-base text-foreground">Strategic Brief</h3>
                  <div className="flex items-center gap-2">
                    {linkedInConnected === true ? (
                      <Link
                        href="/connections"
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/20 transition-colors"
                        title="LinkedIn connected. Click to manage."
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>LinkedIn Active</span>
                      </Link>
                    ) : linkedInConnected === false ? (
                      <Link
                        href="/connections"
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/25 transition-colors"
                        title="LinkedIn not connected. Click to authorize."
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>Connect LinkedIn</span>
                      </Link>
                    ) : (
                      <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border">
                        LinkedIn B2B
                      </span>
                    )}
                  </div>
                </div>

                {/* Brand Identity Grounding Banner */}
                {brandProfile ? (
                  <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs font-semibold text-foreground">
                          {brandProfile.brand_name || "Active Brand"}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-border bg-muted text-foreground text-[10px] py-0 px-2 font-mono"
                        >
                          {brandProfile.written_identity?.archetype || "Brand Grounded"}
                        </Badge>
                      </div>
                      <Link
                        href="/brand"
                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        title="View & customize brand voice and policies"
                      >
                        <span>Brand Rules</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-surface p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>No brand voice configured. Posts use standard defaults.</span>
                    </div>
                    <Link
                      href="/brand"
                      className="text-foreground hover:underline text-[11px] font-medium flex items-center gap-1"
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
                    className="min-h-[140px] text-sm bg-surface border-border rounded-xl focus:border-ring transition-colors placeholder:text-muted-foreground/50 leading-relaxed"
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
                        className={`rounded-lg border p-2.5 text-xs text-left transition-colors ${
                          tone === t.id
                            ? "border-foreground/40 bg-accent text-foreground font-medium"
                            : "border-border bg-surface text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Visual Companion (FLUX.1 [schnell]) */}
                <div className="rounded-xl border border-border bg-surface p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground">Visual Companion</span>
                      <Badge
                        variant="outline"
                        className="border-border bg-muted text-foreground text-[10px] py-0 px-1.5 font-mono"
                      >
                        FLUX.1 [schnell]
                      </Badge>
                    </div>
                    <Switch
                      checked={generateImageEnabled}
                      onCheckedChange={setGenerateImageEnabled}
                    />
                  </div>

                  {generateImageEnabled && (
                    <div className="space-y-3 pt-2 border-t border-border text-xs">
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
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors ${
                                imageAspectRatio === ar.id
                                  ? "border-foreground/40 bg-accent text-foreground font-medium"
                                  : "border-border bg-surface text-muted-foreground hover:bg-accent/50 hover:text-foreground"
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
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors ${
                                imageStylePreset === sp.id
                                  ? "border-foreground/40 bg-accent text-foreground font-medium"
                                  : "border-border bg-surface text-muted-foreground hover:bg-accent/50 hover:text-foreground"
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
                        className="w-full h-8 text-[11px] gap-1.5 border-border hover:bg-accent text-muted-foreground hover:text-foreground"
                      >
                        {isGeneratingImage ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin text-foreground" />
                            <span>Generating FLUX Visual...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3 w-3 text-foreground" />
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
                  className="w-full h-11 rounded-lg text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-subtle disabled:opacity-50"
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
              <div className="bg-card rounded-2xl p-7 lg:p-8 border border-border min-h-[480px] flex flex-col justify-between relative overflow-hidden shadow-subtle">
                {/* Header bar */}
                <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-base text-foreground">Live Draft Stream</span>
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
                        className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? "Copied" : "Copy"}</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Streaming Content Surface */}
                <div className="flex-1 space-y-6">
                  {/* FLUX.1 Visual Companion Asset */}
                  {(isGeneratingImage || generatedImage || imageError) && (
                    <div className="rounded-xl border border-border bg-surface p-4 space-y-3 overflow-hidden shadow-subtle">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-semibold text-foreground">Visual Companion Asset</span>
                          <Badge
                            variant="outline"
                            className="border-border bg-muted text-foreground text-[10px] font-mono"
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
                              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
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
                              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                              title="Regenerate image"
                            >
                              <RefreshCw className={`h-3 w-3 ${isGeneratingImage ? "animate-spin" : ""}`} />
                              <span>Regenerate</span>
                            </Button>
                          </div>
                        )}
                      </div>

                      {isGeneratingImage ? (
                        <div className="h-60 rounded-xl border border-dashed border-border bg-muted/40 flex flex-col items-center justify-center space-y-2 animate-pulse">
                          <RefreshCw className="h-6 w-6 text-foreground animate-spin" />
                          <p className="text-xs font-mono text-muted-foreground">
                            Synthesizing on-brand visual with FLUX.1 [schnell]...
                          </p>
                        </div>
                      ) : generatedImage ? (
                        <div className="relative rounded-xl overflow-hidden border border-border group max-h-80 flex justify-center bg-black/10 dark:bg-black/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={generatedImage.url}
                            alt={generatedImage.prompt || "Generated post visual"}
                            className="object-contain max-h-80 w-full rounded-xl transition-transform duration-200 group-hover:scale-[1.01]"
                          />
                        </div>
                      ) : null}

                      {imageError && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                          {imageError}
                        </p>
                      )}
                    </div>
                  )}
                  {!completion && !isStreaming ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center space-y-3 p-8">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface border border-border text-muted-foreground">
                        <FileEdit className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-display font-semibold text-foreground text-sm">Awaiting Strategic Brief</h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          Enter your thesis and tone in the panel on the left, then trigger the stream to watch the AI craft your dispatch live.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="font-sans text-sm text-foreground whitespace-pre-wrap leading-relaxed space-y-4 font-normal">
                      {completion}
                      {isStreaming && (
                        <span className="inline-block w-1.5 h-4 ml-1 bg-foreground animate-pulse align-middle" />
                      )}
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                {completion && (
                  <div className="pt-6 border-t border-border flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2">
                      <AnimatedCheck size={14} />
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">Stream Complete</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScheduleDialogOpen(true)}
                        className="rounded-lg h-9 text-xs gap-1.5 border-border hover:bg-accent text-muted-foreground hover:text-foreground"
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
          <div className="bg-card rounded-2xl p-7 border border-border shadow-subtle">
            <div className="mb-6">
              <h3 className="font-display font-bold text-lg text-foreground">Scheduled Dispatches</h3>
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
                  <TableRow className="border-border">
                    <TableHead className="text-xs font-mono">Date</TableHead>
                    <TableHead className="text-xs font-mono">Content Excerpt</TableHead>
                    <TableHead className="text-xs font-mono">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calendarPosts.map((p) => (
                    <TableRow key={p.id} className="border-border">
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
