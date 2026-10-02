"use client";

import React, { useState } from "react";
import {
  Palette,
  ExternalLink,
  Plus,
  Cpu,
  Compass,
  Hammer,
  Flame,
  Briefcase,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ARCHETYPE_CONFIGS = [
  {
    name: "Technical Expert",
    icon: Cpu,
    tagline: "Architecture-first, precise, code-aware & authoritative",
    badge: "Engineering",
  },
  {
    name: "Visionary Leader",
    icon: Compass,
    tagline: "Strategic foresight, future trends & high-level paradigm shifts",
    badge: "Executive",
  },
  {
    name: "Pragmatic Operator",
    icon: Hammer,
    tagline: "Tactical, battle-tested, ROI-driven lessons from production",
    badge: "Operations",
  },
  {
    name: "Challenger / Contrarian",
    icon: Flame,
    tagline: "Counter-intuitive takes, calling out industry hype & dogma",
    badge: "Provocative",
  },
  {
    name: "Consultative Strategist",
    icon: Briefcase,
    tagline: "Structured frameworks, maturity models & advisory guidance",
    badge: "Strategy",
  },
  {
    name: "Product Specialist",
    icon: Layers,
    tagline: "Feature breakdowns, teardowns & workflow UX optimizations",
    badge: "Product",
  },
];

const SUGGESTED_TONES = [
  "Pragmatic",
  "Authoritative",
  "Data-Dense",
  "Direct",
  "No-Fluff",
  "Conversational",
  "Analytical",
  "Provocative",
];

interface BrandIdentityVoiceTabProps {
  brandName: string;
  setBrandName: (v: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (v: string) => void;
  tagline: string;
  setTagline: (v: string) => void;
  aestheticSummary: string;
  setAestheticSummary: (v: string) => void;
  palettePrimary: string;
  setPalettePrimary: (v: string) => void;
  paletteAccent: string;
  setPaletteAccent: (v: string) => void;
  paletteNeutral: string;
  setPaletteNeutral: (v: string) => void;
  imageryStyle: string;
  setImageryStyle: (v: string) => void;
  negativePrompts: string;
  setNegativePrompts: (v: string) => void;
  archetype: string;
  setArchetype: (v: string) => void;
  toneAttributes: string[];
  setToneAttributes: React.Dispatch<React.SetStateAction<string[]>>;
  formattingRules: string;
  setFormattingRules: (v: string) => void;
}

export function BrandIdentityVoiceTab({
  brandName,
  setBrandName,
  websiteUrl,
  setWebsiteUrl,
  tagline,
  setTagline,
  aestheticSummary,
  setAestheticSummary,
  palettePrimary,
  setPalettePrimary,
  paletteAccent,
  setPaletteAccent,
  paletteNeutral,
  setPaletteNeutral,
  imageryStyle,
  setImageryStyle,
  negativePrompts,
  setNegativePrompts,
  archetype,
  setArchetype,
  toneAttributes,
  setToneAttributes,
  formattingRules,
  setFormattingRules,
}: BrandIdentityVoiceTabProps) {
  const [newToneInput, setNewToneInput] = useState("");

  const addTone = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!toneAttributes.includes(trimmed)) {
      setToneAttributes([...toneAttributes, trimmed]);
    }
    setNewToneInput("");
  };

  const removeTone = (target: string) => {
    setToneAttributes(toneAttributes.filter((t) => t !== target));
  };

  return (
    <div className="space-y-6">
      {/* 1. Core Profile & Visual Palette */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Basic Brand Info */}
        <Card className="md:col-span-7 border-white/10 bg-[#0c0e14]/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Core Identity
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              High-level positioning and website link used for grounding content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="brandName" className="text-xs font-medium text-foreground">
                  Brand Name
                </Label>
                <Input
                  id="brandName"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="bg-black/30 border-white/10 text-sm h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="websiteUrl" className="text-xs font-medium text-foreground">
                  Website URL
                </Label>
                <div className="relative">
                  <Input
                    id="websiteUrl"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://acme.ai"
                    className="bg-black/30 border-white/10 text-sm h-9 pr-8"
                  />
                  {websiteUrl && (
                    <a
                      href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-white"
                      title="Visit website"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tagline" className="text-xs font-medium text-foreground">
                Tagline / Positioning Statement
              </Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Autonomous social marketing infrastructure for enterprise B2B teams"
                className="bg-black/30 border-white/10 text-sm h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="aestheticSummary" className="text-xs font-medium text-foreground">
                Market Summary & Description
              </Label>
              <Textarea
                id="aestheticSummary"
                rows={3}
                value={aestheticSummary}
                onChange={(e) => setAestheticSummary(e.target.value)}
                placeholder="Brief summary of your design aesthetic, product category, and positioning tone extracted from website."
                className="bg-black/30 border-white/10 text-xs resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Visual Palette */}
        <Card className="md:col-span-5 border-white/10 bg-[#0c0e14]/70">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">
                Color Palette & Visuals
              </CardTitle>
              <Palette className="h-4 w-4 text-cyan-400" />
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Tokens referenced by image generators and social banners.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color Swatch Preview Strip */}
            <div className="flex h-10 w-full rounded-lg overflow-hidden border border-white/10 shadow-inner">
              <div
                className="flex-1 flex items-center justify-center text-[10px] font-mono font-medium text-white drop-shadow"
                style={{ backgroundColor: palettePrimary }}
                title="Primary Color"
              >
                Primary
              </div>
              <div
                className="flex-1 flex items-center justify-center text-[10px] font-mono font-medium text-black/80 drop-shadow"
                style={{ backgroundColor: paletteAccent }}
                title="Accent Color"
              >
                Accent
              </div>
              <div
                className="flex-1 flex items-center justify-center text-[10px] font-mono font-medium text-black/80 drop-shadow"
                style={{ backgroundColor: paletteNeutral }}
                title="Neutral Color"
              >
                Neutral
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/5 bg-black/20 p-2 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-mono block mb-1">Primary</span>
                <div className="flex items-center justify-center gap-1.5">
                  <input
                    type="color"
                    value={palettePrimary}
                    onChange={(e) => setPalettePrimary(e.target.value)}
                    className="h-5 w-5 rounded border-0 bg-transparent cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-foreground font-semibold">{palettePrimary}</span>
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-black/20 p-2 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-mono block mb-1">Accent</span>
                <div className="flex items-center justify-center gap-1.5">
                  <input
                    type="color"
                    value={paletteAccent}
                    onChange={(e) => setPaletteAccent(e.target.value)}
                    className="h-5 w-5 rounded border-0 bg-transparent cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-foreground font-semibold">{paletteAccent}</span>
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-black/20 p-2 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-mono block mb-1">Neutral</span>
                <div className="flex items-center justify-center gap-1.5">
                  <input
                    type="color"
                    value={paletteNeutral}
                    onChange={(e) => setPaletteNeutral(e.target.value)}
                    className="h-5 w-5 rounded border-0 bg-transparent cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-foreground font-semibold">{paletteNeutral}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="space-y-1">
                <Label htmlFor="imageryStyle" className="text-xs font-medium text-foreground">
                  Visual Style Keywords
                </Label>
                <Input
                  id="imageryStyle"
                  value={imageryStyle}
                  onChange={(e) => setImageryStyle(e.target.value)}
                  placeholder="e.g. Isometric 3D dark-mode telemetry, clean diagrams"
                  className="bg-black/30 border-white/10 text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="negativePrompts" className="text-xs font-medium text-foreground">
                  Avoid in Visuals
                </Label>
                <Input
                  id="negativePrompts"
                  value={negativePrompts}
                  onChange={(e) => setNegativePrompts(e.target.value)}
                  placeholder="e.g. cartoonish, cluttered, vintage stock photos"
                  className="bg-black/30 border-white/10 text-xs h-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Voice Archetype Selection */}
      <Card className="border-white/10 bg-[#0c0e14]/70">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Voice Archetype
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Select the primary persona and intellectual stance for your generated posts and replies.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono text-xs">
              Selected: {archetype}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ARCHETYPE_CONFIGS.map((config) => {
              const isSelected = archetype === config.name;
              const Icon = config.icon;
              return (
                <button
                  key={config.name}
                  type="button"
                  onClick={() => setArchetype(config.name)}
                  className={`group flex flex-col items-start p-3.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? "border-cyan-400/80 bg-cyan-500/10 shadow-[0_0_15px_-3px_rgba(56,189,248,0.2)]"
                      : "border-white/5 bg-black/20 hover:border-white/15 hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                          isSelected
                            ? "bg-cyan-400 text-black font-semibold"
                            : "bg-white/5 text-muted-foreground group-hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-xs font-semibold ${isSelected ? "text-cyan-300" : "text-foreground"}`}>
                        {config.name}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0 h-4 bg-white/5 border border-white/5 text-muted-foreground">
                      {config.badge}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground/80 leading-relaxed pl-9">
                    {config.tagline}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Tone Attributes & Formatting */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="md:col-span-6 border-white/10 bg-[#0c0e14]/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Tone Attributes
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Fine-tune the emotional timbre and stylistic personality.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newToneInput}
                onChange={(e) => setNewToneInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTone(newToneInput);
                  }
                }}
                placeholder="Type a tone and press Enter (e.g. High-energy)"
                className="bg-black/30 border-white/10 text-xs h-9"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addTone(newToneInput)}
                className="h-9 border-white/10 px-3 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>

            {/* Quick Suggested Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                Quick Presets (Click to add)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TONES.map((tone) => {
                  const alreadyAdded = toneAttributes.includes(tone);
                  return (
                    <button
                      key={tone}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => addTone(tone)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                        alreadyAdded
                          ? "border-transparent text-muted-foreground/40 cursor-default"
                          : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-cyan-400/40 hover:text-cyan-300"
                      }`}
                    >
                      + {tone}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Tone Pills */}
            <div className="border-t border-white/5 pt-3 space-y-2">
              <span className="text-[11px] font-medium text-foreground block">
                Active Tone Traits ({toneAttributes.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {toneAttributes.map((attr) => (
                  <Badge
                    key={attr}
                    variant="secondary"
                    className="bg-white/5 border border-white/10 text-xs text-foreground py-1 px-2.5 gap-1.5 rounded-lg"
                  >
                    <span>{attr}</span>
                    <button
                      type="button"
                      onClick={() => removeTone(attr)}
                      className="text-muted-foreground hover:text-rose-400 text-xs font-bold leading-none"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {toneAttributes.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">
                    No custom tones added yet. Use the presets above or type your own.
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Post Structure & Formatting Rules */}
        <Card className="md:col-span-6 border-white/10 bg-[#0c0e14]/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Post Formatting & Structural Rules
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Structural layout instructions for paragraph lengths, emojis, and call-to-actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              id="formattingRules"
              rows={6}
              value={formattingRules}
              onChange={(e) => setFormattingRules(e.target.value)}
              placeholder="e.g. 1-line hook followed by blank line. Maximum 2 short paragraphs before bullet points. Keep line count under 150 words. End with a thoughtful question rather than a sales pitch."
              className="bg-black/30 border-white/10 text-xs resize-none font-mono leading-relaxed"
            />
            <p className="text-[11px] text-muted-foreground">
              Tip: These rules are injected directly into system prompts for draft generation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
