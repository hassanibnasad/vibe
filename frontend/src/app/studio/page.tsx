"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Send,
  Calendar,
  Copy,
  Check,
  Globe,
  Clock,
  Database,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  const tones = [
    { id: "thought_leadership", label: "Thought Leadership", desc: "Arresting hooks & high-impact frameworks" },
    { id: "professional", label: "Professional & Authoritative", desc: "Corporate credibility and precision" },
    { id: "conversational", label: "Conversational & Story", desc: "Authentic founder journey tone" },
    { id: "contrarian", label: "Contrarian & Provocative", desc: "Challenging conventional industry dogmas" },
  ];

  const handleGenerate = async () => {
    if (!brief.trim()) return;
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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-400" />
          <span>AI Content Studio & Calendar</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Generate channel-optimized marketing posts grounded in brand knowledge docs.
        </p>
      </div>

      <Tabs defaultValue="creator" className="space-y-6">
        <TabsList>
          <TabsTrigger value="creator" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Post Creator</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span>Content Calendar</span>
          </TabsTrigger>
        </TabsList>

        {/* Post Creator Tab */}
        <TabsContent value="creator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Brief Input Form */}
            <div className="lg:col-span-5 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">1. Strategic Campaign Brief</CardTitle>
                  <CardDescription>
                    Provide high-level topic or requirements for the AI generator
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">
                      Topic, Key Takeaways & Target Audience
                    </label>
                    <Textarea
                      rows={5}
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      placeholder="What should this post be about?"
                      className="resize-none"
                    />
                  </div>

                  {/* Tone Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">
                      Tone & Persona Style
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {tones.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTone(t.id)}
                          className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                            tone === t.id
                              ? "border-purple-500/50 bg-purple-950/30 text-white"
                              : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <span className="text-xs font-semibold text-slate-200">{t.label}</span>
                          <span className="text-[11px] text-slate-400">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Options: Variants and RAG */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-slate-300">Ground with RAG Context</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={useRAG}
                        onChange={(e) => setUseRAG(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400">Generate A/B Test Variants</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setVariantsCount(num)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                              variantsCount === num
                                ? "bg-purple-600 text-white border-purple-500"
                                : "border-slate-800 text-slate-400 hover:bg-slate-800"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generating || !brief.trim()}
                    className="w-full h-11 gap-2 rounded-xl text-sm font-semibold"
                  >
                    <Sparkles className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                    <span>{generating ? "Generating via LiteLLM..." : "Generate Post Copy"}</span>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Live Output & Variants */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="min-h-[520px] flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="h-4 w-4 text-purple-400" />
                        <span>Generated Draft Preview (LinkedIn)</span>
                      </CardTitle>
                      <CardDescription>
                        Review, refine, and dispatch directly to social channels
                      </CardDescription>
                    </div>

                    {generatedPosts.length > 1 && (
                      <div className="flex gap-1.5 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
                        {generatedPosts.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveVariantIdx(idx)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                              activeVariantIdx === idx
                                ? "bg-purple-600 text-white"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            Variant {String.fromCharCode(65 + idx)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-5">
                  {currentPost ? (
                    <div className="space-y-4">
                      {/* Confidence and Metadata Bar */}
                      <div className="flex items-center justify-between rounded-xl bg-slate-950/60 p-3 border border-slate-800 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">AI Confidence:</span>
                          <Badge variant="success">
                            {Math.round(currentPost.confidence_score * 100)}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-7 text-xs gap-1"
                          >
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>{copied ? "Copied" : "Copy"}</span>
                          </Button>
                        </div>
                      </div>

                      {/* Content Edit Area */}
                      <Textarea
                        rows={10}
                        value={currentPost.content}
                        onChange={(e) => {
                          const updated = [...generatedPosts];
                          updated[activeVariantIdx].content = e.target.value;
                          setGeneratedPosts(updated);
                        }}
                        className="font-mono text-xs leading-relaxed bg-slate-950/80 border-slate-800"
                      />

                      {/* Hashtags */}
                      {currentPost.hashtags && currentPost.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {currentPost.hashtags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-purple-300 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Call to Action preview */}
                      {currentPost.cta && (
                        <div className="rounded-lg bg-purple-950/20 p-3 border border-purple-500/20 text-xs text-purple-200">
                          <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1">
                            Conversation Starter CTA:
                          </span>
                          {currentPost.cta}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-80 flex-col items-center justify-center text-center text-slate-500">
                      <Sparkles className="h-10 w-10 text-slate-700 mb-3" />
                      <p className="text-sm font-medium text-slate-400">No content generated yet</p>
                      <p className="text-xs max-w-sm mt-1">
                        Enter your campaign brief on the left and click &quot;Generate Post Copy&quot; to craft platform-ready posts.
                      </p>
                    </div>
                  )}
                </CardContent>

                {/* Publish & Schedule Actions */}
                {currentPost && (
                  <div className="p-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/40 rounded-b-xl">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Ready for dispatch</span>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setScheduledSuccess(true)}
                        className="rounded-xl flex-1 sm:flex-none"
                      >
                        Schedule for Later
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setScheduledSuccess(true)}
                        className="rounded-xl flex-1 sm:flex-none gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Publish to LinkedIn</span>
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {scheduledSuccess && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
                  <span>✅ Post approved and scheduled for automated dispatch!</span>
                  <Badge variant="success">Scheduled</Badge>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Content Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Upcoming Publishing Schedule</CardTitle>
                  <CardDescription>Visual content slots across LinkedIn</CardDescription>
                </div>
                <Badge variant="outline">August 2026</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-3 text-center text-xs">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="font-semibold text-slate-400 py-2">
                    {d}
                  </div>
                ))}

                {Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    className={`min-h-[100px] rounded-xl border p-2 text-left flex flex-col justify-between ${
                      i === 3 || i === 8
                        ? "border-purple-500/40 bg-purple-950/20"
                        : "border-slate-800/80 bg-slate-900/40 text-slate-500"
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-300">{i + 1}</span>
                    {i === 3 && (
                      <div className="rounded bg-purple-600/30 border border-purple-500/40 p-1 text-[10px] text-purple-200">
                        <span className="font-bold block">10:00 AM</span>
                        <span>B2B Growth Agent</span>
                      </div>
                    )}
                    {i === 8 && (
                      <div className="rounded bg-emerald-600/30 border border-emerald-500/40 p-1 text-[10px] text-emerald-200">
                        <span className="font-bold block">02:30 PM</span>
                        <span>Lead Scoring Rubric</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
