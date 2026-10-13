"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ExternalLink, Ban, CheckCircle2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandProfile } from "@/lib/api-client";

interface BrandRulesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandProfile: BrandProfile | null;
}

export function BrandRulesSheet({ open, onOpenChange, brandProfile }: BrandRulesSheetProps) {
  const written = brandProfile?.written_identity;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-6 flex flex-col h-full bg-card">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <SheetTitle className="text-sm font-semibold">Active Brand Rules</SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Strict compliance rules and voice guidelines grounding this post draft.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs">
          {/* Identity & Archetype */}
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              Voice & Persona
            </span>
            <div className="rounded-md border border-border bg-surface p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {brandProfile?.brand_name || "Default Brand"}
                </span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {written?.archetype || "Technical Expert"}
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {brandProfile?.tagline || "Authoritative, architecture-aware, and ROI-driven lessons from production."}
              </p>
            </div>
          </div>

          {/* Tone Attributes */}
          {written?.tone_attributes && written.tone_attributes.length > 0 && (
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Tone Attributes
              </span>
              <div className="flex flex-wrap gap-1.5">
                {written.tone_attributes.map((attr) => (
                  <Badge key={attr} variant="secondary" className="text-xs font-normal">
                    {attr}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Core Value Props */}
          {brandProfile?.core_value_props && brandProfile.core_value_props.length > 0 && (
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Key Value Propositions
              </span>
              <div className="space-y-1.5">
                {brandProfile.core_value_props.map((prop, i) => (
                  <div key={i} className="flex items-start gap-2 rounded border border-border bg-surface p-2 text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{prop}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Banned Words & Guardrails */}
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              Hard Guardrails & Blacklist
            </span>
            <div className="rounded-md border border-rose-500/20 bg-rose-500/[0.03] p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                <Ban className="h-3.5 w-3.5" />
                <span>Banned Words & Competitors</span>
              </div>
              {written?.banned_words && written.banned_words.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {written.banned_words.map((w) => (
                    <span key={w} className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                      {w}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No custom banned phrases configured.</p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <Link href="/brand" className="w-full">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-border">
              <span>Edit full brand guidelines</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
