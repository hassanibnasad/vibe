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
      <Card className="border-white/10 bg-[#0c0e14]/70">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-cyan-400" />
                Core Value Propositions
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Differentiating selling points highlighted in generated posts and outbound responses.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono text-xs">
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
              className="bg-black/30 border-white/10 text-sm h-10 rounded-xl"
            />
            <Button
              type="button"
              onClick={addValueProp}
              disabled={!newValueProp.trim()}
              className="h-10 px-4 text-xs bg-white text-black hover:bg-zinc-200 rounded-xl font-medium shrink-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Value Prop
            </Button>
          </div>

          <div className="space-y-2">
            {valueProps.map((prop, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-black/20 text-xs text-foreground group hover:border-white/15 transition-all"
              >
                <div className="flex items-center gap-2.5 flex-1 pr-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 font-mono text-[10px] text-muted-foreground">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed font-sans">{prop}</span>
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
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-white/10 rounded-xl">
                No value propositions registered. Add your product advantages above or run the website extractor.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. ICP Pain Points & Hook Matrix */}
      <Card className="border-white/10 bg-[#0c0e14]/70">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                ICP Pain Points & Hook Matrix
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Pairs concrete product capabilities with painful customer symptoms and target personas.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-mono text-xs">
              {icpPainPoints.length} Hooks
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inline Add Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-xl border border-white/5 bg-black/30">
            <div className="sm:col-span-4">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Product Feature (e.g. Durable Orchestration)"
                className="bg-black/40 border-white/10 text-xs h-9"
              />
            </div>
            <div className="sm:col-span-5">
              <Input
                value={newPainHook}
                onChange={(e) => setNewPainHook(e.target.value)}
                placeholder="Customer Pain Hook (e.g. Dropping jobs at 3 AM)"
                className="bg-black/40 border-white/10 text-xs h-9"
              />
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <Input
                value={newPersona}
                onChange={(e) => setNewPersona(e.target.value)}
                placeholder="Persona (e.g. CTOs)"
                className="bg-black/40 border-white/10 text-xs h-9"
              />
              <Button
                type="button"
                size="sm"
                onClick={addPainPoint}
                disabled={!newFeature.trim() || !newPainHook.trim()}
                className="h-9 px-3 text-xs bg-white text-black hover:bg-zinc-200 shrink-0 font-medium rounded-lg"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-b border-white/10">
                  <TableHead className="text-xs font-semibold text-muted-foreground w-1/3">
                    Feature / Capability
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground w-1/2">
                    Customer Symptom / Hook
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Target Persona
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {icpPainPoints.map((item, idx) => (
                  <TableRow key={idx} className="border-b border-white/5 hover:bg-white/[0.01]">
                    <TableCell className="text-xs font-medium text-foreground py-2.5">
                      {item.feature}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-2.5 italic">
                      &ldquo;{item.pain_hook}&rdquo;
                    </TableCell>
                    <TableCell className="text-xs text-foreground py-2.5">
                      <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] font-mono">
                        {item.target_persona}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePainPoint(idx)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {icpPainPoints.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                      No pain points registered. Add your first feature-hook pair above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 3. Conversion Assets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Lead Magnets */}
        <Card className="border-white/10 bg-[#0c0e14]/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Lead Magnets</span>
              <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-4 bg-white/5">
                {leadMagnets.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Free whitepapers, checklists, or calculators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newLeadMagnet}
                onChange={(e) => setNewLeadMagnet(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSimpleTag(newLeadMagnet, leadMagnets, setLeadMagnets, () => setNewLeadMagnet(""));
                  }
                }}
                placeholder="e.g. Free 2026 AI Outbound Guide"
                className="bg-black/30 border-white/10 text-xs h-8"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addSimpleTag(newLeadMagnet, leadMagnets, setLeadMagnets, () => setNewLeadMagnet(""))}
                className="h-8 border-white/10 px-2.5"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {leadMagnets.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-black/20 text-xs text-foreground"
                >
                  <span className="truncate pr-2">{item}</span>
                  <button
                    type="button"
                    onClick={() => removeSimpleTag(item, leadMagnets, setLeadMagnets)}
                    className="text-muted-foreground hover:text-rose-400 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {leadMagnets.length === 0 && (
                <span className="text-xs text-muted-foreground italic block py-1">No lead magnets added.</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CTA Templates */}
        <Card className="border-white/10 bg-[#0c0e14]/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>CTA Templates</span>
              <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-4 bg-white/5">
                {ctaTemplates.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Social post sign-offs and comment hooks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newCta}
                onChange={(e) => setNewCta(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSimpleTag(newCta, ctaTemplates, setCtaTemplates, () => setNewCta(""));
                  }
                }}
                placeholder="e.g. Drop a comment for the slide deck"
                className="bg-black/30 border-white/10 text-xs h-8"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addSimpleTag(newCta, ctaTemplates, setCtaTemplates, () => setNewCta(""))}
                className="h-8 border-white/10 px-2.5"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {ctaTemplates.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-black/20 text-xs text-foreground"
                >
                  <span className="truncate pr-2">{item}</span>
                  <button
                    type="button"
                    onClick={() => removeSimpleTag(item, ctaTemplates, setCtaTemplates)}
                    className="text-muted-foreground hover:text-rose-400 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {ctaTemplates.length === 0 && (
                <span className="text-xs text-muted-foreground italic block py-1">No CTA templates added.</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Offer Hooks */}
        <Card className="border-white/10 bg-[#0c0e14]/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Offer Hooks</span>
              <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-4 bg-white/5">
                {offerHooks.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Trial offers, audits, and pilot opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newOffer}
                onChange={(e) => setNewOffer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSimpleTag(newOffer, offerHooks, setOfferHooks, () => setNewOffer(""));
                  }
                }}
                placeholder="e.g. 14-day free pilot, no card needed"
                className="bg-black/30 border-white/10 text-xs h-8"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addSimpleTag(newOffer, offerHooks, setOfferHooks, () => setNewOffer(""))}
                className="h-8 border-white/10 px-2.5"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {offerHooks.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-black/20 text-xs text-foreground"
                >
                  <span className="truncate pr-2">{item}</span>
                  <button
                    type="button"
                    onClick={() => removeSimpleTag(item, offerHooks, setOfferHooks)}
                    className="text-muted-foreground hover:text-rose-400 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {offerHooks.length === 0 && (
                <span className="text-xs text-muted-foreground italic block py-1">No offer hooks added.</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
