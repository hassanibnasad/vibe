"use client";

import React, { useState } from "react";
import {
  FileEdit,
  Send,
  Calendar as CalendarIcon,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { generatePost, Post } from "@/lib/api-client";

export default function ContentStudioPage() {
  const [brief, setBrief] = useState(
    "Announce our autonomous B2B marketing agent architecture. Focus on how it solves the 4-hour inbound response delay and qualifies leads via BANT without human intervention."
  );
  const [tone, setTone] = useState("thought_leadership");
  const platform = "linkedin";
  const [variantsCount, setVariantsCount] = useState(2);
  const [useRAG, setUseRAG] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<Post[]>([]);
  const [activeVariantIdx, setActiveVariantIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  const tones = [
    { id: "thought_leadership", label: "Thought Leadership", desc: "Executive hooks & frameworks" },
    { id: "professional", label: "Professional & Authoritative", desc: "Enterprise technical credibility" },
    { id: "conversational", label: "Conversational & Founder", desc: "Direct authentic journey tone" },
    { id: "contrarian", label: "Contrarian & Provocative", desc: "Challenging industry dogmas" },
  ];

  const handleGenerate = async () => {
    if (!brief.trim() || generating) return;
    setGenerating(true);
    setScheduledSuccess(false);

    try {
      const posts = await generatePost(brief, tone, platform, variantsCount);
      setGeneratedPosts(posts);
      setActiveVariantIdx(0);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedPosts[activeVariantIdx]) {
      navigator.clipboard.writeText(generatedPosts[activeVariantIdx].content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentPost = generatedPosts[activeVariantIdx];

  const mockCalendarSlots = [
    {
      id: "slot-1",
      date: "Today, 15:00 UTC",
      platform: "LinkedIn",
      title: "Autonomous Agents in B2B Pipeline Execution",
      status: "Scheduled",
    },
    {
      id: "slot-2",
      date: "Tomorrow, 09:30 UTC",
      platform: "LinkedIn",
      title: "Why Speed-to-Lead Beats Manual SDR Cadences",
      status: "Scheduled",
    },
    {
      id: "slot-3",
      date: "Yesterday, 14:00 UTC",
      platform: "LinkedIn",
      title: "Architecture Deep-Dive: PostgreSQL + Hatchet + LiteLLM",
      status: "Published",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h1 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
            <FileEdit className="h-4 w-4 text-foreground" />
            <span>Content Studio & Publishing Calendar</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Draft channel-optimized marketing posts grounded in vector knowledge docs and scheduled workflows.
          </p>
        </div>
      </div>

      <Tabs defaultValue="creator" className="space-y-4">
        <TabsList className="h-8">
          <TabsTrigger value="creator" className="text-xs">Post Creator</TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs">Publishing Calendar</TabsTrigger>
        </TabsList>

        {/* Tab 1: Post Creator (Split-Pane) */}
        <TabsContent value="creator" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Pane: Form Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card>
                <CardHeader className="p-4 pb-3 border-b border-border">
                  <CardTitle className="text-xs font-semibold">Campaign Brief & Parameters</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Brief Input with Persistent Label */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="brief" className="text-xs">Campaign Brief & Topic</Label>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {brief.length} chars
                      </span>
                    </div>
                    <Textarea
                      id="brief"
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      placeholder="Specify campaign goal, target persona, and core narrative..."
                      className="min-h-[100px] text-xs"
                    />
                  </div>

                  {/* Tone Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tone & Voice Angle</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {tones.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTone(t.id)}
                          className={`rounded-md border p-2 text-left transition-colors ${
                            tone === t.id
                              ? "border-primary bg-accent/60 text-accent-foreground font-medium"
                              : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                          }`}
                        >
                          <div className="text-xs text-foreground font-medium">{t.label}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RAG Grounding & Variants Controls */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between rounded-md border border-border p-2.5">
                      <div>
                        <Label className="text-xs block">RAG Grounding</Label>
                        <span className="text-[10px] text-muted-foreground">pgvector cosine</span>
                      </div>
                      <Switch checked={useRAG} onCheckedChange={setUseRAG} />
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-border p-2.5">
                      <div>
                        <Label className="text-xs block">Variants Count</Label>
                        <span className="text-[10px] text-muted-foreground">Generate options</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setVariantsCount(num)}
                            className={`h-6 w-6 rounded border text-xs font-mono transition-colors ${
                              variantsCount === num
                                ? "border-primary bg-primary text-primary-foreground font-semibold"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Generate Button with explicit loading state */}
                  <Button
                    onClick={handleGenerate}
                    disabled={!brief.trim() || generating}
                    className="w-full gap-2 h-9 text-xs"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Generating {variantsCount} variants with LiteLLM...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Generate post variants</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Pane: Generated Post Preview (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {generatedPosts.length === 0 ? (
                <Card className="h-full min-h-[380px] flex flex-col items-center justify-center p-8 text-center border-dashed">
                  <FileEdit className="h-8 w-8 text-muted-foreground mb-3" />
                  <div className="text-sm font-medium text-foreground">No draft generated yet</div>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Enter a brief on the left and click &ldquo;Generate post variants&rdquo; to create grounded copy.
                  </p>
                </Card>
              ) : (
                <Card className="space-y-0">
                  {/* Variant Tabs Header */}
                  <CardHeader className="p-3 pb-2 border-b border-border flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">Generated Variants</span>
                      <div className="flex gap-1 ml-2">
                        {generatedPosts.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveVariantIdx(idx)}
                            className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                              activeVariantIdx === idx
                                ? "bg-accent text-accent-foreground border border-border"
                                : "text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Variant {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="h-7 text-xs gap-1"
                      >
                        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copied ? "Copied" : "Copy text"}</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setScheduleDialogOpen(true)}
                        className="h-7 text-xs gap-1"
                      >
                        <CalendarIcon className="h-3 w-3" />
                        <span>Schedule post</span>
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    {/* Rendered LinkedIn Post Box */}
                    {currentPost && (
                      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">LinkedIn Corporate Channel</span>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono py-0 h-4">
                              {currentPost.tone}
                            </Badge>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {currentPost.content.length} chars • ~{Math.ceil(currentPost.content.split(" ").length / 200)} min read
                          </span>
                        </div>

                        <div className="whitespace-pre-line text-xs leading-relaxed text-foreground font-sans">
                          {currentPost.content}
                        </div>

                        {/* Hashtag List */}
                        {currentPost.hashtags && currentPost.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2 border-t border-border">
                            {currentPost.hashtags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px] py-0 h-4">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {scheduledSuccess && (
                      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Post queued in Hatchet scheduler. Target dispatch at 15:00 UTC.</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Publishing Calendar */}
        <TabsContent value="calendar" className="mt-0">
          <Card>
            <CardHeader className="p-4 pb-3 border-b border-border">
              <CardTitle className="text-xs font-semibold">Scheduled & Published Queue</CardTitle>
              <CardDescription className="text-[11px]">
                Active dispatches managed by Hatchet workflow engine
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Scheduled Timestamp</TableHead>
                    <TableHead>Post Title / Content Hook</TableHead>
                    <TableHead className="w-[100px]">Channel</TableHead>
                    <TableHead className="w-[100px] text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCalendarSlots.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {slot.date}
                      </TableCell>
                      <TableCell className="font-medium text-foreground text-xs">
                        {slot.title}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {slot.platform}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={slot.status === "Published" ? "success" : "secondary"}
                          className="text-[10px] py-0 h-4"
                        >
                          {slot.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Confirmation Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Schedule Post for Dispatch</DialogTitle>
            <DialogDescription className="text-xs">
              Confirm target publication time on LinkedIn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Target Date & Time</Label>
              <div className="rounded-md border border-border bg-muted/40 p-2.5 font-mono text-xs text-foreground">
                Today at 15:00 UTC (Optimal engagement window)
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dispatch Worker</Label>
              <div className="text-[11px] text-muted-foreground">
                Hatchet `publish-linkedin-post` workflow with 3 automatic retries.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScheduleDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setScheduleDialogOpen(false);
                setScheduledSuccess(true);
              }}
              className="text-xs"
            >
              Confirm and schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
