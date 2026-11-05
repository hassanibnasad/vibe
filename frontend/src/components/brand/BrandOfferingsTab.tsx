"use client";

import React, { useState } from "react";
import { Plus, Trash2, Target, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface IcpPainPoint {
  feature: string;
  pain_hook: string;
  target_persona: string;
}

interface BrandOfferingsTabProps {
  valueProps: string[];
  setValueProps: React.Dispatch<React.SetStateAction<string[]>>;
  icpPainPoints: IcpPainPoint[];
  setIcpPainPoints: React.Dispatch<React.SetStateAction<IcpPainPoint[]>>;
  leadMagnets: string[];
  setLeadMagnets: React.Dispatch<React.SetStateAction<string[]>>;
  ctaTemplates: string[];
  setCtaTemplates: React.Dispatch<React.SetStateAction<string[]>>;
  offerHooks: string[];
  setOfferHooks: React.Dispatch<React.SetStateAction<string[]>>;
}

export function BrandOfferingsTab({
  valueProps,
  setValueProps,
  icpPainPoints,
  setIcpPainPoints,
  leadMagnets,
  setLeadMagnets,
  ctaTemplates,
  setCtaTemplates,
  offerHooks,
  setOfferHooks,
}: BrandOfferingsTabProps) {
  // New input states
  const [newValueProp, setNewValueProp] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newPainHook, setNewPainHook] = useState("");
  const [newPersona, setNewPersona] = useState("");
  const [newLeadMagnet, setNewLeadMagnet] = useState("");
  const [newCta, setNewCta] = useState("");
  const [newOffer, setNewOffer] = useState("");

  const addValueProp = () => {
    const trimmed = newValueProp.trim();
    if (!trimmed) return;
    if (!valueProps.includes(trimmed)) {
      setValueProps([...valueProps, trimmed]);
    }
    setNewValueProp("");
  };

  const removeValueProp = (idx: number) => {
    setValueProps(valueProps.filter((_, i) => i !== idx));
  };

  const addPainPoint = () => {
    if (!newFeature.trim() || !newPainHook.trim()) return;
    setIcpPainPoints([
      ...icpPainPoints,
      {
        feature: newFeature.trim(),
        pain_hook: newPainHook.trim(),
        target_persona: newPersona.trim() || "General",
      },
    ]);
    setNewFeature("");
    setNewPainHook("");
    setNewPersona("");
  };

  const removePainPoint = (idx: number) => {
    setIcpPainPoints(icpPainPoints.filter((_, i) => i !== idx));
  };

  const addSimpleTag = (
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

  const removeSimpleTag = (
    val: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(list.filter((item) => item !== val));
  };

  return (
    <div className="space-y-6">
      {/* 1. Core Value Propositions */}
      <Card className="border-border/80 bg-card/90 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] tracking-widest text-editions-mint uppercase block mb-1">
                [ 01 · POSITIONING PILLARS ]
              </span>
              <CardTitle className="text-base font-display font-medium tracking-tight text-white flex items-center gap-2">
                <Target className="h-4 w-4 text-editions-mint" />
                Core Value Propositions
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Differentiating selling points highlighted in generated posts and outbound responses.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-border/80 bg-surface/50 text-bone font-mono text-xs">
              {valueProps.length} Registered
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex gap-2">
            <Input
              value={newValueProp}
              onChange={(e) => setNewValueProp(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addValueProp();
                }
              }}
              placeholder="e.g. Sub-second qualification latency with zero human intervention required"
              className="bg-obsidian border-border/80 text-xs h-10 rounded-lg focus:border-editions-mint/50"
            />
            <Button
              type="button"
              onClick={addValueProp}
              disabled={!newValueProp.trim()}
              className="h-10 px-4 text-xs bg-white text-black hover:bg-white/90 rounded-lg font-medium shrink-0 transition-colors shadow-subtle disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Value Prop
            </Button>
          </div>

          <div className="space-y-2">
            {valueProps.map((prop, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-obsidian/60 text-xs text-foreground group hover:border-border transition-colors"
              >
                <div className="flex items-center gap-2.5 flex-1 pr-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-surface border border-border/60 font-mono text-[10px] text-editions-mint">
                    0{idx + 1}
                  </span>
                  <span className="leading-relaxed font-sans text-bone/90">{prop}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeValueProp(idx)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {valueProps.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg bg-surface/20">
                No value propositions registered. Add your product advantages above or run the website extractor.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. ICP Pain Points & Hook Matrix */}
      <Card className="border-border/80 bg-card/90 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] tracking-widest text-editions-mint uppercase block mb-1">
                [ 02 · HOOK MATRIX ]
              </span>
              <CardTitle className="text-base font-display font-medium tracking-tight text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-editions-mint" />
                ICP Pain Points & Hook Matrix
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Pairs concrete product capabilities with painful customer symptoms and target personas.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-border/80 bg-surface/50 text-bone font-mono text-xs">
              {icpPainPoints.length} Hooks
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Inline Add Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-lg border border-border/60 bg-obsidian/60">
            <div className="sm:col-span-4">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Product Feature (e.g. Durable Orchestration)"
                className="bg-card border-border/80 text-xs h-9 focus:border-editions-mint/50"
              />
            </div>
            <div className="sm:col-span-4">
              <Input
                value={newPainHook}
                onChange={(e) => setNewPainHook(e.target.value)}
                placeholder="Pain Symptom (e.g. Lost state on worker crashes)"
                className="bg-card border-border/80 text-xs h-9 focus:border-editions-mint/50"
              />
            </div>
            <div className="sm:col-span-3">
              <Input
                value={newPersona}
                onChange={(e) => setNewPersona(e.target.value)}
                placeholder="Target Persona (e.g. VP of Eng)"
                className="bg-card border-border/80 text-xs h-9 focus:border-editions-mint/50"
              />
            </div>
            <div className="sm:col-span-1">
              <Button
                type="button"
                onClick={addPainPoint}
                disabled={!newFeature.trim() || !newPainHook.trim()}
                className="w-full h-9 bg-white text-black hover:bg-white/90 p-0 rounded-lg text-xs transition-colors shadow-subtle disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Pain Point Table */}
          {icpPainPoints.length > 0 ? (
            <div className="rounded-lg border border-border/80 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/80 bg-surface/40 hover:bg-surface/40">
                    <TableHead className="text-[11px] font-mono tracking-wider uppercase text-muted-foreground">Product Feature</TableHead>
                    <TableHead className="text-[11px] font-mono tracking-wider uppercase text-muted-foreground">Customer Pain Point / Hook</TableHead>
                    <TableHead className="text-[11px] font-mono tracking-wider uppercase text-muted-foreground">Target Persona</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {icpPainPoints.map((item, idx) => (
                    <TableRow key={idx} className="border-border/60 hover:bg-white/[0.02]">
                      <TableCell className="font-medium text-xs text-white">
                        {item.feature}
                      </TableCell>
                      <TableCell className="text-xs text-bone/90">
                        {item.pain_hook}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono bg-white/5 border border-white/10 text-muted-foreground">
                          {item.target_persona}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePainPoint(idx)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg bg-surface/20">
              No ICP hooks mapped yet. Add capability-to-pain point mappings above to seed high-conversion hooks.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Conversion Assets & CTAs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lead Magnets */}
        <Card className="border-border/80 bg-card/90 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <span className="font-mono text-[10px] tracking-widest text-editions-mint uppercase block">
              [ 03A · MAGNETS ]
            </span>
            <CardTitle className="text-sm font-display font-medium text-white">
              Lead Magnets
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Whitepapers & teardowns offered in DMs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="flex gap-1.5">
              <Input
                value={newLeadMagnet}
                onChange={(e) => setNewLeadMagnet(e.target.value)}
                placeholder="e.g. 2026 AI Agent Benchmark"
                className="bg-obsidian border-border/80 text-xs h-8 focus:border-editions-mint/50"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => addSimpleTag(newLeadMagnet, leadMagnets, setLeadMagnets, () => setNewLeadMagnet(""))}
                className="h-8 px-2.5 bg-white text-black hover:bg-white/90 text-xs shrink-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {leadMagnets.map((lm) => (
                <div
                  key={lm}
                  className="flex items-center justify-between p-2 rounded-md border border-border/60 bg-obsidian/60 text-xs text-foreground"
                >
                  <span className="truncate pr-2 font-mono text-[11px] text-bone/90">{lm}</span>
                  <button
                    type="button"
                    onClick={() => removeSimpleTag(lm, leadMagnets, setLeadMagnets)}
                    className="text-muted-foreground hover:text-rose-400 shrink-0 font-mono"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Templates */}
        <Card className="border-border/80 bg-card/90 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <span className="font-mono text-[10px] tracking-widest text-editions-mint uppercase block">
              [ 03B · CTAS ]
            </span>
            <CardTitle className="text-sm font-display font-medium text-white">
              CTA Templates
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              High-converting closing calls to action.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="flex gap-1.5">
              <Input
                value={newCta}
                onChange={(e) => setNewCta(e.target.value)}
                placeholder="e.g. DM 'BENCHMARK' for raw data"
                className="bg-obsidian border-border/80 text-xs h-8 focus:border-editions-mint/50"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => addSimpleTag(newCta, ctaTemplates, setCtaTemplates, () => setNewCta(""))}
                className="h-8 px-2.5 bg-white text-black hover:bg-white/90 text-xs shrink-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {ctaTemplates.map((cta) => (
                <div
                  key={cta}
                  className="flex items-center justify-between p-2 rounded-md border border-border/60 bg-obsidian/60 text-xs text-foreground"
                >
                  <span className="truncate pr-2 font-mono text-[11px] text-bone/90">{cta}</span>
                  <button
                    type="button"
                    onClick={() => removeSimpleTag(cta, ctaTemplates, setCtaTemplates)}
                    className="text-muted-foreground hover:text-rose-400 shrink-0 font-mono"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Offer Hooks */}
        <Card className="border-border/80 bg-card/90 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <span className="font-mono text-[10px] tracking-widest text-editions-mint uppercase block">
              [ 03C · OFFERS ]
            </span>
            <CardTitle className="text-sm font-display font-medium text-white">
              Offer Hooks
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Irresistible trial or pilot hooks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="flex gap-1.5">
              <Input
                value={newOffer}
                onChange={(e) => setNewOffer(e.target.value)}
                placeholder="e.g. Free 14-day production pilot"
                className="bg-obsidian border-border/80 text-xs h-8 focus:border-editions-mint/50"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => addSimpleTag(newOffer, offerHooks, setOfferHooks, () => setNewOffer(""))}
                className="h-8 px-2.5 bg-white text-black hover:bg-white/90 text-xs shrink-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {offerHooks.map((off) => (
                <div
                  key={off}
                  className="flex items-center justify-between p-2 rounded-md border border-border/60 bg-obsidian/60 text-xs text-foreground"
                >
                  <span className="truncate pr-2 font-mono text-[11px] text-bone/90">{off}</span>
                  <button
                    type="button"
                    onClick={() => removeSimpleTag(off, offerHooks, setOfferHooks)}
                    className="text-muted-foreground hover:text-rose-400 shrink-0 font-mono"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
