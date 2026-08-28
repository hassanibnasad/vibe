"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Lead } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/utils";

export default function LeadsPipelinePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mockLeads: Lead[] = [
    {
      id: "1",
      full_name: "Sarah Chen",
      platform_username: "sarahchen_growth",
      platform_user_id: "urn:li:person:1",
      platform: "linkedin",
      headline: "VP Demand Gen @ SaaSScale",
      company: "SaaSScale",
      lead_stage: "sql",
      lead_score: 92,
      sentiment: "inquisitive",
      intent_signals: ["pricing_request", "integration_query", "team_size_50"],
      interaction_count: 4,
      last_interaction_at: new Date().toISOString(),
    },
    {
      id: "2",
      full_name: "David Miller",
      platform_username: "dmiller_ops",
      platform_user_id: "urn:li:person:2",
      platform: "linkedin",
      headline: "Director of RevOps @ CloudCore",
      company: "CloudCore",
      lead_stage: "mql",
      lead_score: 78,
      sentiment: "positive",
      intent_signals: ["booked_demo_inquiry", "budget_approved"],
      interaction_count: 3,
      last_interaction_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "3",
      full_name: "Marcus Vance",
      platform_username: "marcus_vance",
      platform_user_id: "urn:li:person:3",
      platform: "linkedin",
      headline: "Founder & CEO @ NexaGrowth",
      company: "NexaGrowth",
      lead_stage: "hot",
      lead_score: 68,
      sentiment: "inquisitive",
      intent_signals: ["multi_turn_convo", "competitor_switch"],
      interaction_count: 5,
      last_interaction_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: "4",
      full_name: "Elena Rostova",
      platform_username: "elena_marketing",
      platform_user_id: "urn:li:person:4",
      platform: "linkedin",
      headline: "Head of Marketing @ FinTechEdge",
      company: "FinTechEdge",
      lead_stage: "warm",
      lead_score: 45,
      sentiment: "positive",
      intent_signals: ["post_like", "positive_comment"],
      interaction_count: 2,
      last_interaction_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "5",
      full_name: "Liam O'Connor",
      platform_username: "liam_tech",
      platform_user_id: "urn:li:person:5",
      platform: "linkedin",
      headline: "Growth Consultant",
      company: "Freelance",
      lead_stage: "cold",
      lead_score: 20,
      sentiment: "neutral",
      intent_signals: ["first_touch"],
      interaction_count: 1,
      last_interaction_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ];

  const stages = [
    { id: "all", label: "All Stages" },
    { id: "sql", label: "SQL (Sales Qualified)" },
    { id: "mql", label: "MQL (Marketing Qualified)" },
    { id: "hot", label: "Hot Intent" },
    { id: "warm", label: "Warm" },
    { id: "cold", label: "Cold" },
  ];

  const filteredLeads = mockLeads.filter((l) => {
    const matchesSearch =
      (l.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (l.company?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (l.headline?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStage = selectedStage === "all" || l.lead_stage === selectedStage;
    return matchesSearch && matchesStage;

  });

  const getStageBadgeVariant = (stage: Lead["lead_stage"]) => {
    switch (stage) {
      case "sql":
        return "sql";
      case "mql":
        return "mql";
      case "hot":
        return "hot";
      case "warm":
        return "warning";
      default:
        return "secondary";
    }
  };

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Users className="h-4 w-4 text-foreground" />
            <span>Lead Qualification & Pipeline</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            BANT scoring and intent signal tracking derived from LinkedIn inbound commentary and DMs.
          </p>
        </div>

        {/* Pipeline Quick Counts */}
        <div className="flex items-center gap-2">
          <Badge variant="sql" className="font-mono text-[10px] h-5">
            2 SQL Ready
          </Badge>
          <Badge variant="mql" className="font-mono text-[10px] h-5">
            1 MQL
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px] h-5">
            5 Total
          </Badge>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads by name, title, or company..."
            className="pl-8 h-8 text-xs bg-card"
          />
        </div>

        {/* Stage Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {stages.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStage(st.id)}
              className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs transition-colors ${
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

      {/* Enterprise Data Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[240px]">Lead Name & Title</TableHead>
              <TableHead className="w-[140px]">Company</TableHead>
              <TableHead className="w-[100px]">Stage</TableHead>
              <TableHead className="w-[90px] text-right">Lead Score</TableHead>
              <TableHead>Intent Signals</TableHead>
              <TableHead className="w-[120px]">Last Active</TableHead>
              <TableHead className="w-[60px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                  No leads match the selected filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  onClick={() => handleRowClick(lead)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="font-semibold text-foreground text-xs">{lead.full_name}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-1">{lead.headline}</div>
                  </TableCell>
                  <TableCell className="text-xs text-foreground font-medium">
                    {lead.company}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStageBadgeVariant(lead.lead_stage)} className="text-[10px] uppercase font-mono py-0 h-4">
                      {lead.lead_stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs">
                    {lead.lead_score}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {lead.intent_signals.map((sig) => (
                        <span
                          key={sig}
                          className="rounded border border-border bg-muted/40 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground"
                        >
                          {sig}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(lead.last_interaction_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground inline" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Slide-over Lead Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-card p-6 flex flex-col justify-between">
          {selectedLead && (
            <>
              <SheetHeader className="pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <Badge variant={getStageBadgeVariant(selectedLead.lead_stage)} className="uppercase font-mono text-[10px]">
                    {selectedLead.lead_stage}
                  </Badge>
                  <span className="font-mono text-xs font-bold">
                    Score: {selectedLead.lead_score}/100
                  </span>
                </div>
                <SheetTitle className="text-base font-semibold mt-2">{selectedLead.full_name}</SheetTitle>
                <SheetDescription className="text-xs">{selectedLead.headline}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 py-4 overflow-y-auto flex-1 text-xs">
                {/* Company & Profile Info */}
                <div className="space-y-2 rounded-md border border-border p-3 bg-muted/20">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Company</span>
                    <span className="font-medium text-foreground">{selectedLead.company}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Platform Handle</span>
                    <span className="font-mono text-foreground">{selectedLead.platform_username}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Touchpoints</span>
                    <span className="font-mono text-foreground">{selectedLead.interaction_count}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sentiment</span>
                    <span className="capitalize text-foreground font-medium">{selectedLead.sentiment}</span>
                  </div>
                </div>

                {/* BANT Intent Signals Breakdown */}
                <div className="space-y-2">
                  <div className="font-semibold text-foreground text-xs">BANT Intent Signals</div>
                  <div className="space-y-1.5">
                    {selectedLead.intent_signals.map((signal) => (
                      <div
                        key={signal}
                        className="rounded-md border border-border bg-background p-2 font-mono text-[11px] text-muted-foreground"
                      >
                        ✓ {signal.replace(/_/g, " ")}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended SDR Action */}
                <div className="rounded-md border border-indigo-500/30 bg-indigo-500/10 p-3 space-y-1 text-indigo-300">
                  <div className="font-semibold text-xs">Recommended Action</div>
                  <p className="text-[11px] text-muted-foreground">
                    Lead meets criteria for direct SDR handoff. Schedule meeting link or export contact to HubSpot.
                  </p>
                </div>
              </div>

              {/* Drawer Actions */}
              <div className="pt-4 border-t border-border flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  Export to CRM
                </Button>
                <Button size="sm" className="flex-1 text-xs">
                  Draft DM Reply
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
