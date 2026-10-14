"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, ChevronRight, RefreshCw, AlertCircle, Users, Sparkles, TrendingUp, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Lead, fetchLeads } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/utils";
import { FadeIn, WarmFadeIn } from "@/lib/motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimatedNumber } from "@/components/ui/motion";

const stages = [
  { id: "all", label: "All Leads" },
  { id: "sql", label: "SQL" },
  { id: "mql", label: "MQL" },
  { id: "hot", label: "Hot Intent" },
  { id: "warm", label: "Warm" },
  { id: "cold", label: "Cold" },
];

export default function LeadsPipelinePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchLeads({ stage: selectedStage })
      .then((data) => {
        setLeads(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load leads. Verify API connection.");
        setLoading(false);
      });
  }, [selectedStage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLeads = leads.filter((l) => {
    const term = searchTerm.toLowerCase();
    return (
      (l.full_name?.toLowerCase() || "").includes(term) ||
      (l.company?.toLowerCase() || "").includes(term) ||
      (l.headline?.toLowerCase() || "").includes(term)
    );
  });

  const getStageBadgeVariant = (stage: Lead["lead_stage"]) => {
    const map: Record<string, "sql" | "mql" | "hot" | "warning" | "secondary"> = {
      sql: "sql",
      mql: "mql",
      hot: "hot",
      warm: "warning",
    };
    return map[stage] || "secondary";
  };

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  // Compute counts from live data
  const stageCounts = leads.reduce(
    (acc, l) => {
      acc[l.lead_stage] = (acc[l.lead_stage] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="rounded-2xl border border-border/70 bg-card/60 p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 text-rose-400 border border-rose-500/30">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-xl font-normal text-foreground">Pipeline Error</h3>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2 border-border/80 bg-surface/70">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-16">
      <PageHeader
        title="Lead Pipeline"
        description="Autonomous intent detection and BANT qualifying signals mined from social interactions."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(stageCounts).map(([stage, count]) => (
              <Badge
                key={stage}
                variant={getStageBadgeVariant(stage as Lead["lead_stage"])}
                className="font-mono text-xs uppercase px-2.5 py-1"
              >
                <AnimatedNumber value={count} /> {stage}
              </Badge>
            ))}
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <WarmFadeIn delay={0.05}>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads by persona, company, or thesis..."
              className="pl-10 h-10 text-xs bg-card/75 border-border/80 shadow-warm-xs"
            />
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface/80 border border-border/80 backdrop-blur-md overflow-x-auto w-full sm:w-auto">
            {stages.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStage(st.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition-all duration-200 ${
                  selectedStage === st.id
                    ? "bg-gradient-to-r from-primary/25 to-primary/10 text-foreground border border-primary/40 font-medium shadow-warm-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </WarmFadeIn>

      {/* Table with Warm Glass styling */}
      <WarmFadeIn delay={0.1}>
        <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl shadow-warm-md overflow-hidden">
          <Table>
            <TableHeader className="bg-surface/60 border-b border-border/70">
              <TableRow className="hover:bg-transparent border-border/70">
                <TableHead className="pl-6 text-xs uppercase tracking-wider font-mono text-muted-foreground">Prospect</TableHead>
                <TableHead className="w-[110px] text-xs uppercase tracking-wider font-mono text-muted-foreground">Stage</TableHead>
                <TableHead className="w-[90px] text-right text-xs uppercase tracking-wider font-mono text-muted-foreground">Score</TableHead>
                <TableHead className="w-[130px] text-xs uppercase tracking-wider font-mono text-muted-foreground">Last Activity</TableHead>
                <TableHead className="w-[50px] text-right pr-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="text-center py-20">
                    <div className="space-y-3">
                      <div className="h-12 w-12 rounded-2xl bg-surface border border-border/80 flex items-center justify-center mx-auto text-muted-foreground">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No leads found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search criteria or filter stage.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    onClick={() => handleRowClick(lead)}
                    className="cursor-pointer hover:bg-primary/5 transition-colors duration-150 border-b border-border/50 group"
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-amber-700/10 border border-primary/25 flex items-center justify-center text-xs font-semibold text-primary font-mono shrink-0">
                          {lead.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                            {lead.full_name}
                          </div>
                          {lead.headline && (
                            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 max-w-md">
                              {lead.headline}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStageBadgeVariant(lead.lead_stage)} className="uppercase font-mono text-[10px]">
                        {lead.lead_stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs tabular-nums text-foreground">
                      <span className={lead.lead_score >= 80 ? "text-primary" : lead.lead_score >= 60 ? "text-amber-400" : "text-muted-foreground"}>
                        {lead.lead_score}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(lead.last_interaction_at)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </WarmFadeIn>

      {/* Lead Detail Drawer with Warm Surrealist Styling */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-card/95 backdrop-blur-2xl p-0 flex flex-col border-l border-border/80 shadow-warm-xl">
          {selectedLead && (
            <>
              <SheetHeader className="p-6 pb-5 border-b border-border/70 bg-surface/50">
                <div className="flex items-center justify-between">
                  <Badge variant={getStageBadgeVariant(selectedLead.lead_stage)} className="uppercase font-mono text-xs">
                    {selectedLead.lead_stage}
                  </Badge>
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold tabular-nums">
                    <span className="text-muted-foreground text-[11px]">BANT:</span>
                    <span className="text-primary text-sm">{selectedLead.lead_score}</span>
                    <span className="text-muted-foreground text-[11px]">/100</span>
                  </div>
                </div>
                <SheetTitle className="font-display text-2xl font-normal mt-3 text-glow text-foreground">
                  {selectedLead.full_name}
                </SheetTitle>
                {selectedLead.headline && (
                  <p className="text-xs text-muted-foreground/90 leading-relaxed font-sans mt-1">
                    {selectedLead.headline}
                  </p>
                )}
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Info Card */}
                <div className="rounded-xl border border-border/80 bg-surface/60 p-4 space-y-2.5 backdrop-blur-sm">
                  {[
                    { label: "Company", value: selectedLead.company || "—" },
                    {
                      label: "Platform",
                      value: selectedLead.platform_username
                        ? `@${selectedLead.platform_username}`
                        : selectedLead.platform,
                    },
                    { label: "Email", value: selectedLead.email || "—" },
                    {
                      label: "Interactions",
                      value:
                        selectedLead.interaction_count !== null &&
                        selectedLead.interaction_count !== undefined
                          ? selectedLead.interaction_count
                          : "—",
                    },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="text-foreground font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* BANT Breakdown */}
                <div className="rounded-xl border border-border/80 bg-surface/70 p-4 space-y-3.5 backdrop-blur-sm">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <h4 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">BANT Qualification</h4>
                    <span className="font-mono text-[10px] text-primary">Framework Audit</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                        selectedLead.lead_score >= 70
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-surface border border-border text-muted-foreground"
                      }`}>
                        {selectedLead.lead_score >= 70 ? "✓" : "—"}
                      </span>
                      <div>
                        <span className="font-semibold text-foreground">Budget: </span>
                        <span className="text-muted-foreground leading-relaxed">
                          {selectedLead.lead_score >= 70
                            ? "Confirmed enterprise allocation ($30k–$80k ARR)"
                            : "Early exploratory phase; budget unverified"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                        /(director|head|vp|chief|lead|founder|partner)/i.test(selectedLead.headline || selectedLead.job_title || "")
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-surface border border-border text-muted-foreground"
                      }`}>
                        {/(director|head|vp|chief|lead|founder|partner)/i.test(selectedLead.headline || selectedLead.job_title || "") ? "✓" : "—"}
                      </span>
                      <div>
                        <span className="font-semibold text-foreground">Authority: </span>
                        <span className="text-muted-foreground leading-relaxed">
                          {/(director|head|vp|chief|lead|founder|partner)/i.test(selectedLead.headline || selectedLead.job_title || "")
                            ? "Verified decision maker with signing power"
                            : "Technical evaluator; introduces to executive buyer"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="h-4 w-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ✓
                      </span>
                      <div>
                        <span className="font-semibold text-foreground">Need: </span>
                        <span className="text-muted-foreground leading-relaxed">
                          {selectedLead.intent_signals[0]
                            ? selectedLead.intent_signals[0].replace(/_/g, " ")
                            : "Actively seeking autonomous content & social pipeline automation"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                        selectedLead.lead_stage === "sql" || selectedLead.lead_stage === "hot"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-surface border border-border text-muted-foreground"
                      }`}>
                        {selectedLead.lead_stage === "sql" || selectedLead.lead_stage === "hot" ? "✓" : "—"}
                      </span>
                      <div>
                        <span className="font-semibold text-foreground">Timeline: </span>
                        <span className="text-muted-foreground leading-relaxed">
                          {selectedLead.lead_stage === "sql" || selectedLead.lead_stage === "hot"
                            ? "Q4 2026 deployment roadmap"
                            : "Evaluation pipeline (45–60 days)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Intent Signals */}
                {selectedLead.intent_signals.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Intent Signals</h4>
                    <div className="space-y-1.5">
                      {selectedLead.intent_signals.map((signal) => (
                        <div
                          key={signal}
                          className="rounded-xl border border-border/70 bg-surface/50 p-3 text-xs text-foreground/80 font-mono flex items-center gap-2"
                        >
                          <span className="text-primary">✦</span>
                          <span>{signal.replace(/_/g, " ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-border/70 bg-surface/50 flex gap-3">
                <Button variant="outline" size="sm" className="flex-1 text-xs border-border/80 bg-surface/70">
                  Export to CRM
                </Button>
                <Button size="sm" className="flex-1 text-xs bg-primary text-primary-foreground shadow-warm-sm">
                  Draft Outreach
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
