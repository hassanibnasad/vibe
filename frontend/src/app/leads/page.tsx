"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronRight, RefreshCw, AlertCircle, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { FadeIn, StaggerContainer, StaggerItem } from "@/lib/motion";

const stages = [
  { id: "all", label: "All" },
  { id: "sql", label: "SQL" },
  { id: "mql", label: "MQL" },
  { id: "hot", label: "Hot" },
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

  const loadData = () => {
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
  };

  useEffect(() => {
    loadData();
  }, [selectedStage]);

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
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Card className="p-0">
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">Pipeline error</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Lead pipeline</h1>
            <p className="text-sm text-muted-foreground mt-1">
              BANT scoring and intent tracking from LinkedIn engagement.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {Object.entries(stageCounts).map(([stage, count]) => (
              <Badge key={stage} variant={getStageBadgeVariant(stage as Lead["lead_stage"])} className="font-mono text-xs uppercase">
                {count} {stage}
              </Badge>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.1}>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads..."
              className="pl-9 h-9 text-sm bg-card"
            />
          </div>
          <div className="flex items-center gap-1">
            {stages.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStage(st.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  selectedStage === st.id
                    ? "bg-accent text-accent-foreground border border-border font-medium"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Table */}
      <FadeIn delay={0.15}>
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead className="w-[100px]">Stage</TableHead>
                <TableHead className="w-[90px] text-right">Score</TableHead>
                <TableHead className="w-[120px]">Last Active</TableHead>
                <TableHead className="w-[50px] text-right pr-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <div className="space-y-2">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">No leads match your filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    onClick={() => handleRowClick(lead)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="pl-6">
                      <div className="text-sm font-medium text-foreground">{lead.full_name}</div>
                      {lead.headline && (
                        <div className="text-xs text-muted-foreground mt-0.5">{lead.headline}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStageBadgeVariant(lead.lead_stage)} className="uppercase font-mono text-[10px]">
                        {lead.lead_stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm tabular-nums">
                      {lead.lead_score}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(lead.last_interaction_at)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </FadeIn>

      {/* Lead Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-card p-0 flex flex-col">
          {selectedLead && (
            <>
              <SheetHeader className="p-6 pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <Badge variant={getStageBadgeVariant(selectedLead.lead_stage)} className="uppercase font-mono text-xs">
                    {selectedLead.lead_stage}
                  </Badge>
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {selectedLead.lead_score}/100
                  </span>
                </div>
                <SheetTitle className="text-lg mt-2">{selectedLead.full_name}</SheetTitle>
                {selectedLead.headline && (
                  <p className="text-sm text-muted-foreground">{selectedLead.headline}</p>
                )}
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Info */}
                <div className="rounded-lg border border-border p-4 space-y-3">
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
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="text-foreground font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Intent Signals */}
                {selectedLead.intent_signals.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Intent signals</h4>
                    <div className="space-y-1.5">
                      {selectedLead.intent_signals.map((signal) => (
                        <div
                          key={signal}
                          className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground font-mono"
                        >
                          {signal.replace(/_/g, " ")}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-border flex gap-3">
                <Button variant="outline" size="sm" className="flex-1">
                  Export to CRM
                </Button>
                <Button size="sm" className="flex-1">
                  Draft reply
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
