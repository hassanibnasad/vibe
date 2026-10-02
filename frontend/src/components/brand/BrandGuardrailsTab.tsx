"use client";

import React, { useState } from "react";
import { Plus, Trash2, ShieldAlert, ShieldCheck, AlertOctagon, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SUGGESTED_BANNED_WORDS = [
  "synergy",
  "game-changer",
  "delve into",
  "supercharge",
  "disruptive",
  "revolutionize",
  "next-gen",
  "leverage",
  "state-of-the-art",
];

interface BrandGuardrailsTabProps {
  bannedWords: string[];
  setBannedWords: React.Dispatch<React.SetStateAction<string[]>>;
  competitorBlacklist: string[];
  setCompetitorBlacklist: React.Dispatch<React.SetStateAction<string[]>>;
  sensitiveTopics: string[];
  setSensitiveTopics: React.Dispatch<React.SetStateAction<string[]>>;
  mandatoryDisclaimers: string[];
  setMandatoryDisclaimers: React.Dispatch<React.SetStateAction<string[]>>;
}

export function BrandGuardrailsTab({
  bannedWords,
  setBannedWords,
  competitorBlacklist,
  setCompetitorBlacklist,
  sensitiveTopics,
  setSensitiveTopics,
  mandatoryDisclaimers,
  setMandatoryDisclaimers,
}: BrandGuardrailsTabProps) {
  const [newBanned, setNewBanned] = useState("");
  const [newCompetitor, setNewCompetitor] = useState("");
  const [newSensitive, setNewSensitive] = useState("");
  const [newDisclaimer, setNewDisclaimer] = useState("");

  const addTag = (
    val: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    clear: () => void
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    clear();
  };

  const removeTag = (
    val: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(list.filter((t) => t !== val));
  };

  return (
    <div className="space-y-6">
      {/* 1. Banned Buzzwords & Competitor Blacklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Banned Words */}
        <Card className="border-white/10 bg-[#0c0e14]/70">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-rose-400" />
                Banned Buzzwords & Phrases
              </CardTitle>
              <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-400 font-mono text-xs">
                {bannedWords.length} Banned
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Hard negative constraints. The AI model will never use these cliché terms.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newBanned}
                onChange={(e) => setNewBanned(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(newBanned, bannedWords, setBannedWords, () => setNewBanned(""));
                  }
                }}
                placeholder="Type buzzword and press Enter"
                className="bg-black/30 border-white/10 text-xs h-9"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addTag(newBanned, bannedWords, setBannedWords, () => setNewBanned(""))}
                className="h-9 border-white/10 px-3 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                Common AI Clichés (Click to ban)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_BANNED_WORDS.map((word) => {
                  const isBanned = bannedWords.includes(word);
                  return (
                    <button
                      key={word}
                      type="button"
                      disabled={isBanned}
                      onClick={() => addTag(word, bannedWords, setBannedWords, () => {})}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                        isBanned
                          ? "border-transparent text-muted-foreground/30 line-through cursor-default"
                          : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-rose-400/40 hover:text-rose-300"
                      }`}
                    >
                      + {word}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Banned Badges */}
            <div className="border-t border-white/5 pt-3 space-y-2">
              <span className="text-[11px] font-medium text-foreground block">
                Enforced Banned List ({bannedWords.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {bannedWords.map((word) => (
                  <Badge
                    key={word}
                    variant="secondary"
                    className="bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 py-1 px-2.5 gap-1.5 rounded-lg"
                  >
                    <span>{word}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(word, bannedWords, setBannedWords)}
                      className="text-rose-400 hover:text-white text-xs font-bold leading-none"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {bannedWords.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">
                    No banned buzzwords yet. Click presets above to add.
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitor Blacklist */}
        <Card className="border-white/10 bg-[#0c0e14]/70">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                Competitor Blacklist
              </CardTitle>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono text-xs">
                {competitorBlacklist.length} Monitored
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Competitor names or trademarks the AI must never endorse, validate, or reference.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(newCompetitor, competitorBlacklist, setCompetitorBlacklist, () => setNewCompetitor(""));
                  }
                }}
                placeholder="e.g. CompetitorCorp, RivalAI"
                className="bg-black/30 border-white/10 text-xs h-9"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addTag(newCompetitor, competitorBlacklist, setCompetitorBlacklist, () => setNewCompetitor(""))}
                className="h-9 border-white/10 px-3 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>

            <div className="border-t border-white/5 pt-3 space-y-2">
              <span className="text-[11px] font-medium text-foreground block">
                Blacklisted Competitors ({competitorBlacklist.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {competitorBlacklist.map((comp) => (
                  <Badge
                    key={comp}
                    variant="secondary"
                    className="bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 py-1 px-2.5 gap-1.5 rounded-lg"
                  >
                    <span>{comp}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(comp, competitorBlacklist, setCompetitorBlacklist)}
                      className="text-amber-400 hover:text-white text-xs font-bold leading-none"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {competitorBlacklist.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">
                    No competitor restrictions configured.
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Sensitive Topics & Mandatory Disclaimers */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sensitive Topics */}
        <Card className="md:col-span-5 border-white/10 bg-[#0c0e14]/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              Off-Limits & Sensitive Topics
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Internal roadmaps, unannounced pricing, or controversial topics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSensitive}
                onChange={(e) => setNewSensitive(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(newSensitive, sensitiveTopics, setSensitiveTopics, () => setNewSensitive(""));
                  }
                }}
                placeholder="e.g. Unreleased pricing, IPO plans"
                className="bg-black/30 border-white/10 text-xs h-9"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addTag(newSensitive, sensitiveTopics, setSensitiveTopics, () => setNewSensitive(""))}
                className="h-9 border-white/10 px-3 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5">
              {sensitiveTopics.map((topic) => (
                <div
                  key={topic}
                  className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-black/20 text-xs text-foreground"
                >
                  <span className="truncate pr-2">{topic}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(topic, sensitiveTopics, setSensitiveTopics)}
                    className="text-muted-foreground hover:text-rose-400 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {sensitiveTopics.length === 0 && (
                <span className="text-xs text-muted-foreground italic">No off-limits topics specified.</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mandatory Disclaimers */}
        <Card className="md:col-span-7 border-white/10 bg-[#0c0e14]/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Mandatory Legal Disclaimers
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Statements or legal caveats that must accompany regulatory or financial claims.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newDisclaimer}
                onChange={(e) => setNewDisclaimer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(newDisclaimer, mandatoryDisclaimers, setMandatoryDisclaimers, () => setNewDisclaimer(""));
                  }
                }}
                placeholder="e.g. Past performance does not guarantee future results."
                className="bg-black/30 border-white/10 text-xs h-9"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => addTag(newDisclaimer, mandatoryDisclaimers, setMandatoryDisclaimers, () => setNewDisclaimer(""))}
                className="h-9 px-3 text-xs bg-white text-black hover:bg-zinc-200 rounded-lg font-medium shrink-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Disclaimer
              </Button>
            </div>

            <div className="space-y-2">
              {mandatoryDisclaimers.map((disc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-black/20 text-xs text-foreground group"
                >
                  <span className="flex-1 pr-3 leading-relaxed font-sans">{disc}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTag(disc, mandatoryDisclaimers, setMandatoryDisclaimers)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-400 opacity-60 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {mandatoryDisclaimers.length === 0 && (
                <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-white/10 rounded-lg">
                  No legal disclaimers configured.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
