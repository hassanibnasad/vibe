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
        <Card className="md:col-span-7 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Core Identity & Positioning
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
                  className="bg-surface border-border text-sm h-9"
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
                    className="bg-surface border-border text-sm h-9 pr-8"
                  />
                  {websiteUrl && (
                    <a
                      href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
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
                className="bg-surface border-border text-sm h-9"
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
                className="bg-surface border-border text-xs resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Visual Palette */}
        <Card className="md:col-span-5 border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">
                Color Palette & Visuals
              </CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Tokens referenced by image generators and social banners.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color Swatch Preview Strip */}
            <div className="flex h-10 w-full rounded-lg overflow-hidden border border-border shadow-inner">
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
                className="flex-1 flex items-center justify-center text-[10px] font-mono font-medium text-white drop-shadow"
                style={{ backgroundColor: paletteNeutral }}
                title="Neutral Canvas"
              >
                Neutral
              </div>
            </div>

            {/* Hex Inputs */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="rounded-lg border border-border bg-surface p-2 text-center">
                <div
                  className="w-full h-4 rounded mb-1.5 border border-border"
                  style={{ backgroundColor: palettePrimary }}
                />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-mono">
                  Primary
                </span>
                <input
                  type="text"
                  value={palettePrimary}
                  onChange={(e) => setPalettePrimary(e.target.value)}
                  className="w-full text-center text-xs font-mono font-medium bg-transparent border-none text-foreground focus:outline-none"
                />
              </div>

              <div className="rounded-lg border border-border bg-surface p-2 text-center">
                <div
                  className="w-full h-4 rounded mb-1.5 border border-border"
                  style={{ backgroundColor: paletteAccent }}
                />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-mono">
                  Accent
                </span>
                <input
                  type="text"
                  value={paletteAccent}
                  onChange={(e) => setPaletteAccent(e.target.value)}
                  className="w-full text-center text-xs font-mono font-medium bg-transparent border-none text-foreground focus:outline-none"
                />
              </div>

              <div className="rounded-lg border border-border bg-surface p-2 text-center">
                <div
                  className="w-full h-4 rounded mb-1.5 border border-border"
                  style={{ backgroundColor: paletteNeutral }}
                />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-mono">
                  Neutral
                </span>
                <input
                  type="text"
                  value={paletteNeutral}
                  onChange={(e) => setPaletteNeutral(e.target.value)}
                  className="w-full text-center text-xs font-mono font-medium bg-transparent border-none text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Visual Prompts Configuration */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="space-y-1">
                <Label htmlFor="imageryStyle" className="text-xs font-medium text-foreground">
                  FLUX Imagery Style Preset
                </Label>
                <Input
                  id="imageryStyle"
                  value={imageryStyle}
                  onChange={(e) => setImageryStyle(e.target.value)}
                  placeholder="e.g. editorial dark photography, grain texture, minimalist studio"
                  className="bg-surface border-border text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="negativePrompts" className="text-xs font-medium text-foreground">
                  Negative Prompts (Exclude)
                </Label>
                <Input
                  id="negativePrompts"
                  value={negativePrompts}
                  onChange={(e) => setNegativePrompts(e.target.value)}
                  placeholder="e.g. cartoon, blurry, low resolution, saturated neon"
                  className="bg-surface border-border text-xs h-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Voice Archetype Selection */}
      <Card className="border-border bg-card">
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
            <Badge variant="outline" className="border-border bg-muted text-foreground font-mono text-xs">
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
                  className={`group flex flex-col items-start p-3.5 rounded-xl border text-left transition-colors relative ${
                    isSelected
                      ? "border-foreground/40 bg-accent shadow-subtle"
                      : "border-border bg-surface hover:border-border-strong hover:bg-accent/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                          isSelected
                            ? "bg-foreground text-background font-semibold"
                            : "bg-muted text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-xs font-semibold ${isSelected ? "text-foreground font-bold" : "text-foreground"}`}>
                        {config.name}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0 h-4 bg-muted border border-border text-muted-foreground">
                      {config.badge}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pl-9">
                    {config.tagline}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Tone Attributes & Formatting Engine */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Tone Traits */}
        <Card className="md:col-span-6 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Tone Traits & Vocabulary Rules
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Fine-tune the emotional timbre and vocabulary density.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Custom Input */}
            <div className="space-y-1.5">
              <Label htmlFor="newTone" className="text-xs font-medium text-foreground">
                Add Custom Trait
              </Label>
              <div className="flex gap-2">
                <Input
                  id="newTone"
                  value={newToneInput}
                  onChange={(e) => setNewToneInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTone(newToneInput);
                    }
                  }}
                  placeholder="e.g. Sarcastic, Highly Technical, Conversational"
                  className="bg-surface border-border text-xs h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTone(newToneInput)}
                  className="h-9 px-3 border-border hover:bg-accent text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                Quick Suggestions
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
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                        alreadyAdded
                          ? "border-transparent text-muted-foreground/40 cursor-default"
                          : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
                      }`}
                    >
                      + {tone}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Tone Pills */}
            <div className="border-t border-border pt-3 space-y-2">
              <span className="text-[11px] font-medium text-foreground block">
                Active Tone Traits ({toneAttributes.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {toneAttributes.map((attr) => (
                  <Badge
                    key={attr}
                    variant="secondary"
                    className="gap-1.5 py-1 px-2.5 text-xs font-mono bg-muted border border-border text-foreground hover:bg-muted/80"
                  >
                    <span>{attr}</span>
                    <button
                      type="button"
                      onClick={() => removeTone(attr)}
                      className="text-muted-foreground hover:text-foreground ml-0.5"
                      title="Remove trait"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formatting Rules */}
        <Card className="md:col-span-6 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Syntax, Structure & Formatting Engine
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Specific output formatting guidelines injected into system prompts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="formattingRules" className="text-xs font-medium text-foreground">
                System Instructions & Structural Constraints
              </Label>
              <Textarea
                id="formattingRules"
                rows={9}
                value={formattingRules}
                onChange={(e) => setFormattingRules(e.target.value)}
                placeholder="- Hook must be under 120 characters&#10;- Use short 1-2 sentence paragraphs&#10;- Max 2 emojis per post&#10;- Never use hashtags&#10;- End with an engaging open-ended question"
                className="bg-surface border-border text-xs resize-none font-mono leading-relaxed"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              These rules are injected into prompt templates and enforced before drafts enter the Review Queue.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
