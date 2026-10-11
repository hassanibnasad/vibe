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
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-foreground" />
                Core Value Propositions
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Differentiating selling points highlighted in generated posts and outbound responses.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-border bg-muted text-foreground font-mono text-xs">
              {valueProps.length} Registered
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
              className="bg-surface border-border text-sm h-10 rounded-lg"
            />
            <Button
              type="button"
              onClick={addValueProp}
              disabled={!newValueProp.trim()}
              className="h-10 px-4 text-xs bg-foreground text-background hover:bg-foreground/90 rounded-lg font-medium shrink-0 transition-colors shadow-subtle"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Value Prop
            </Button>
          </div>

          <div className="space-y-2">
            {valueProps.map((prop, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface text-xs text-foreground group hover:border-border-strong transition-colors"
              >
                <div className="flex items-center gap-2.5 flex-1 pr-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px] text-muted-foreground">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed font-sans">{prop}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeValueProp(idx)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 opacity-60 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {valueProps.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                No value propositions registered. Add your product advantages above or run the website extractor.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. ICP Pain Points & Hook Matrix */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-foreground" />
                ICP Pain Points & Hook Matrix
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Pairs concrete product capabilities with painful customer symptoms and target personas.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-border bg-muted text-foreground font-mono text-xs">
              {icpPainPoints.length} Hooks
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inline Add Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-lg border border-border bg-surface">
            <div className="sm:col-span-4">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Product Feature (e.g. Durable Orchestration)"
                className="bg-card border-border text-xs h-9"
              />
            </div>
            <div className="sm:col-span-4">
              <Input
                value={newPainHook}
                onChange={(e) => setNewPainHook(e.target.value)}
                placeholder="Pain Symptom (e.g. Lost state on worker crashes)"
                className="bg-card border-border text-xs h-9"
              />
            </div>
            <div className="sm:col-span-3">
              <Input
                value={newPersona}
                onChange={(e) => setNewPersona(e.target.value)}
                placeholder="Target Persona (e.g. VP of Eng)"
                className="bg-card border-border text-xs h-9"
              />
            </div>
            <div className="sm:col-span-1">
              <Button
                type="button"
                onClick={addPainPoint}
                disabled={!newFeature.trim() || !newPainHook.trim()}
                className="w-full h-9 bg-foreground text-background hover:bg-foreground/90 p-0 rounded-lg text-xs transition-colors shadow-subtle"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Pain Point Table */}
          {icpPainPoints.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-surface/50">
                    <TableHead className="text-xs font-mono">Product Feature</TableHead>
                    <TableHead className="text-xs font-mono">Customer Pain Point / Hook</TableHead>
                    <TableHead className="text-xs font-mono">Target Persona</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {icpPainPoints.map((item, idx) => (
                    <TableRow key={idx} className="border-border">
                      <TableCell className="font-medium text-xs text-foreground">
                        {item.feature}
                      </TableCell>
                      <TableCell className="text-xs text-foreground/90">
                        {item.pain_hook}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-mono bg-muted border border-border text-muted-foreground">
                          {item.target_persona}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePainPoint(idx)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500"
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
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
              No ICP hooks mapped yet. Add capability-to-pain point mappings above to seed high-conversion hooks.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Conversion Assets & CTAs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lead Magnets */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Lead Magnets
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Whitepapers, calculators & teardowns offered in DMs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-1.5">
              <Input
                value={newLeadMagnet}
                onChange={(e) => setNewLeadMagnet(e.target.value)}
                placeholder="e.g. 2026 AI Agent Benchmark"
                className="bg-surface border-border text-xs h-8"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => addSimpleTag(newLeadMagnet, leadMagnets, setLeadMagnets, () => setNewLeadMagnet(""))}
                className="h-8 px-2.5 bg-foreground text-background hover:bg-foreground/90 text-xs shrink-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {leadMagnets.map((lm) => (
                <div
                  key={lm}
                  className="flex items-center justify-between p-2 rounded-lg border border-border bg-surface text-xs text-foreground"
                >
                  <span className="truncate pr-2">{lm}</span>
                  <button
                    type="button"
                    onClick={() => removeSimpleTag(lm, leadMagnets, setLeadMagnets)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Templates */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              CTA Templates
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              High-converting closing calls to action for post footers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-1.5">
              <Input
                value={newCta}
                onChange={(e) => setNewCta(e.target.value)}
                placeholder="e.g. DM 'BENCHMARK' for raw data"
                className="bg-surface border-border text-xs h-8"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => addSimpleTag(newCta, ctaTemplates, setCtaTemplates, () => setNewCta(""))}
                className="h-8 px-2.5 bg-foreground text-background hover:bg-foreground/90 text-xs shrink-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {ctaTemplates.map((cta) => (
                <div
                  key={cta}
                  className="flex items-center justify-between p-2 rounded-lg border border-border bg-surface text-xs text-foreground"
                >
                  <span className="truncate pr-2">{cta}</span>
                  <button
                    type="button"
                    onClick={() => removeSimpleTag(cta, ctaTemplates, setCtaTemplates)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Offer Hooks */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Offer Hooks
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Irresistible trial, pilot, or consultation hooks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-1.5">
              <Input
                value={newOffer}
                onChange={(e) => setNewOffer(e.target.value)}
                placeholder="e.g. Free 14-day production pilot"
                className="bg-surface border-border text-xs h-8"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => addSimpleTag(newOffer, offerHooks, setOfferHooks, () => setNewOffer(""))}
                className="h-8 px-2.5 bg-foreground text-background hover:bg-foreground/90 text-xs shrink-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {offerHooks.map((off) => (
                <div
                  key={off}
                  className="flex items-center justify-between p-2 rounded-lg border border-border bg-surface text-xs text-foreground"
                >
                  <span className="truncate pr-2">{off}</span>
                  <button
                    type="button"
                    onClick={() => removeSimpleTag(off, offerHooks, setOfferHooks)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
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
