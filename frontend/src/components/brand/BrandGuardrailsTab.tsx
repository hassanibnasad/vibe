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
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-rose-500" />
                Banned Buzzwords & Phrases
              </CardTitle>
              <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-xs">
                {bannedWords.length} Banned
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Corporate jargon, AI hallmarks and cliches blocked from all posts.
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
                placeholder="e.g. game-changer, delve into"
                className="bg-surface border-border text-xs h-9"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTag(newBanned, bannedWords, setBannedWords, () => setNewBanned(""))}
                className="h-9 border-border px-3 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                Common AI Cliches (Click to Ban)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_BANNED_WORDS.map((w) => {
                  const alreadyBanned = bannedWords.includes(w);
                  return (
                    <button
                      key={w}
                      type="button"
                      disabled={alreadyBanned}
                      onClick={() => addTag(w, bannedWords, setBannedWords, () => {})}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                        alreadyBanned
                          ? "border-transparent text-muted-foreground/40 cursor-default"
                          : "border-border bg-surface text-muted-foreground hover:border-rose-400/40 hover:text-rose-500"
                      }`}
                    >
                      + {w}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Banned Pills */}
            <div className="border-t border-border pt-3 space-y-2">
              <span className="text-[11px] font-medium text-foreground block">
                Active Banned Phrases ({bannedWords.length})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                {bannedWords.map((word) => (
                  <Badge
                    key={word}
                    variant="outline"
                    className="gap-1.5 py-0.5 px-2 text-xs font-mono border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400"
                  >
                    <span>{word}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(word, bannedWords, setBannedWords)}
                      className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                      title="Unban word"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {bannedWords.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">
                    No words blocked yet. Add phrases to prevent cringe LinkedIn jargon.
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitor Blacklist */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                Competitor Name Blacklist
              </CardTitle>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-xs">
                {competitorBlacklist.length} Blacklisted
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Direct competitors that should never be mentioned, tagged or promoted.
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
                placeholder="e.g. RivalCorp, Competitor Inc"
                className="bg-surface border-border text-xs h-9"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTag(newCompetitor, competitorBlacklist, setCompetitorBlacklist, () => setNewCompetitor(""))}
                className="h-9 border-border px-3 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Active Competitor Pills */}
            <div className="border-t border-border pt-3 space-y-2">
              <span className="text-[11px] font-medium text-foreground block">
                Restricted Competitors ({competitorBlacklist.length})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                {competitorBlacklist.map((comp) => (
                  <Badge
                    key={comp}
                    variant="outline"
                    className="gap-1.5 py-0.5 px-2 text-xs font-mono border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300"
                  >
                    <span>{comp}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(comp, competitorBlacklist, setCompetitorBlacklist)}
                      className="text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300"
                      title="Remove competitor"
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
        <Card className="md:col-span-5 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-foreground" />
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
                placeholder="e.g. Unreleased V2 pricing, M&A rumors"
                className="bg-surface border-border text-xs h-9"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTag(newSensitive, sensitiveTopics, setSensitiveTopics, () => setNewSensitive(""))}
                className="h-9 border-border px-3 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {sensitiveTopics.map((topic) => (
                <div
                  key={topic}
                  className="flex items-center justify-between p-2 rounded-lg border border-border bg-surface text-xs text-foreground"
                >
                  <span className="truncate pr-2">{topic}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(topic, sensitiveTopics, setSensitiveTopics)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
              {sensitiveTopics.length === 0 && (
                <span className="text-xs text-muted-foreground italic block p-2">
                  No sensitive topics configured.
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mandatory Disclaimers */}
        <Card className="md:col-span-7 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              Mandatory Legal Disclaimers
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Statements automatically appended when discussing financial, medical, or security topics.
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
                placeholder="e.g. Not financial advice. Past performance does not guarantee future results."
                className="bg-surface border-border text-xs h-9"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTag(newDisclaimer, mandatoryDisclaimers, setMandatoryDisclaimers, () => setNewDisclaimer(""))}
                className="h-9 border-border px-3 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-2">
              {mandatoryDisclaimers.map((disc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface text-xs text-foreground group"
                >
                  <span className="pr-3 leading-relaxed font-mono text-[11px] text-muted-foreground">
                    &quot;{disc}&quot;
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTag(disc, mandatoryDisclaimers, setMandatoryDisclaimers)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 opacity-60 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {mandatoryDisclaimers.length === 0 && (
                <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                  No mandatory disclaimers configured.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
