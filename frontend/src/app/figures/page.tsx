"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { VectorGroundingStation } from "@/components/figures/VectorGroundingStation";
import { ConfidenceGate } from "@/components/figures/ConfidenceGate";
import { GenerativePress } from "@/components/figures/GenerativePress";
import { LeadFractionationColumn } from "@/components/figures/LeadFractionationColumn";
import { FadeIn, StaggerContainer, StaggerItem } from "@/lib/motion";
import { Compass, Sparkles, Sliders, Layers, Eye } from "lucide-react";
import Link from "next/link";

export default function FiguresShowcasePage() {
  const [activeTab, setActiveTab] = useState<"all" | "press" | "balance" | "column" | "grounding">("all");

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <PageHeader
        title="Custom Isometric Figures & Instruments"
        description="Handcrafted tactical isometric instruments tuned to Vibe's warm parchment, smoky charcoal, and terracotta engineering aesthetic."
        action={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground border border-border px-2.5 py-1 rounded-md bg-surface">
              4 Bespoke Instruments Active
            </span>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3 flex-wrap">
        {[
          { key: "all", label: "All Instruments" },
          { key: "press", label: "Fig. 01 · Generative Press" },
          { key: "balance", label: "Fig. 02 · Confidence Balance" },
          { key: "column", label: "Fig. 03 · Fractionation Column" },
          { key: "grounding", label: "Fig. 04 · Vector Grounding" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground font-semibold shadow-warm-xs"
                : "bg-surface/50 text-muted-foreground hover:text-foreground hover:bg-surface border border-border/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-10">
        {/* Figure 1: Generative Press */}
        {(activeTab === "all" || activeTab === "press") && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono text-xs">[01]</span> Content Studio Generative Press
                </h3>
                <p className="text-xs text-muted-foreground">
                  Simulates token throughput, brass drive roll feeds, paper scroll advancing, and pgvector RAG optical laser grounding.
                </p>
              </div>
              <Link
                href="/studio"
                className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
              >
                Go to Studio &rarr;
              </Link>
            </div>
            <FadeIn>
              <GenerativePress isStreaming={true} rate={52} />
            </FadeIn>
          </section>
        )}

        {/* Figure 2: Confidence Balance */}
        {(activeTab === "all" || activeTab === "balance") && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono text-xs">[02]</span> Review Queue Confidence Balance & Gate
                </h3>
                <p className="text-xs text-muted-foreground">
                  Twin-beam knife-edge balance comparing item score against 0.85 tare weight. Controls automatic dispatch vs operator review diverter gate.
                </p>
              </div>
              <Link
                href="/review-queue"
                className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
              >
                Go to Review Queue &rarr;
              </Link>
            </div>
            <FadeIn>
              <ConfidenceGate confidence={0.82} threshold={0.85} />
            </FadeIn>
          </section>
        )}

        {/* Figure 3: CRM Fractionation Column */}
        {(activeTab === "all" || activeTab === "column") && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono text-xs">[03]</span> Lead Pipeline Fractionation Column
                </h3>
                <p className="text-xs text-muted-foreground">
                  Hydrostatic CRM distillation column with 5 glass sight stages, bobbing hydrometer floats, brass manifolds, and analog manometer.
                </p>
              </div>
              <Link
                href="/leads"
                className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
              >
                Go to Lead Pipeline &rarr;
              </Link>
            </div>
            <FadeIn>
              <LeadFractionationColumn activeStage="hot" />
            </FadeIn>
          </section>
        )}

        {/* Figure 4: Knowledge Base Vector Grounding */}
        {(activeTab === "all" || activeTab === "grounding") && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono text-xs">[04]</span> Knowledge Base Vector Grounding Station
                </h3>
                <p className="text-xs text-muted-foreground">
                  Document cassette storage magazine, chunking blade press, triangular refraction prism, and high-dimensional pgvector dot matrix.
                </p>
              </div>
              <Link
                href="/knowledge"
                className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
              >
                Go to Knowledge Base &rarr;
              </Link>
            </div>
            <FadeIn>
              <VectorGroundingStation />
            </FadeIn>
          </section>
        )}
      </div>
    </div>
  );
}
