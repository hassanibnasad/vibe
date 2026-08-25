"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Building,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Lead } from "@/lib/api-client";

export default function LeadsPipelinePage() {
  const [searchTerm, setSearchTerm] = useState("");

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
      last_interaction_at: new Date().toISOString(),
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
      last_interaction_at: new Date().toISOString(),
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
      last_interaction_at: new Date().toISOString(),
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
      last_interaction_at: new Date().toISOString(),
    },
  ];

  const columns: { stage: Lead["lead_stage"]; label: string; badgeVariant: "default" | "warning" | "hot" | "mql" | "sql" }[] = [
    { stage: "cold", label: "Cold Inbound", badgeVariant: "default" },
    { stage: "warm", label: "Warm Engaged", badgeVariant: "warning" },
    { stage: "hot", label: "Hot Intent", badgeVariant: "hot" },
    { stage: "mql", label: "Marketing Qualified", badgeVariant: "mql" },
    { stage: "sql", label: "Sales Qualified (SQL)", badgeVariant: "sql" },
  ];

  const filteredLeads = mockLeads.filter(
    (lead) =>
      lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-400" />
            <span>Lead Pipeline & BANT Kanban</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated prospect progression from social interaction to sales qualification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search leads or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colLeads = filteredLeads.filter((l) => l.lead_stage === col.stage);

          return (
            <div
              key={col.stage}
              className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 min-w-[240px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                <span className="text-xs font-semibold text-slate-200">{col.label}</span>
                <Badge variant={col.badgeVariant} className="text-[10px] px-1.5 py-0">
                  {colLeads.length}
                </Badge>
              </div>

              {/* Lead Cards List */}
              <div className="space-y-3 flex-1">
                {colLeads.map((lead) => (
                  <Card
                    key={lead.id}
                    className="p-3.5 border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all hover:scale-[1.01] cursor-pointer shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-xs font-bold text-white">{lead.full_name}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{lead.headline}</p>
                      </div>
                      <div className="rounded-md bg-purple-950/40 border border-purple-500/30 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                        {lead.lead_score}
                      </div>
                    </div>

                    {lead.company && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-2">
                        <Building className="h-3 w-3" />
                        <span>{lead.company}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mt-2">
                      {lead.intent_signals.map((sig) => (
                        <span
                          key={sig}
                          className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-slate-300"
                        >
                          {sig.replace("_", " ")}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                      <span>{lead.interaction_count} interactions</span>
                      <span className="text-purple-400 flex items-center gap-0.5 font-medium">
                        View <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Card>
                ))}

                {colLeads.length === 0 && (
                  <div className="h-28 rounded-xl border border-dashed border-slate-800/60 flex items-center justify-center text-[11px] text-slate-400">
                    No leads in stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
