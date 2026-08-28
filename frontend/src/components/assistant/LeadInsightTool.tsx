"use client";

import React from "react";
import { Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface LeadInsightItem {
  name: string;
  title: string;
  score: number;
  reason: string;
}

export function LeadInsightTool({ leads }: { leads: LeadInsightItem[] }) {
  return (
    <Card className="my-2 border-border bg-muted/40 shadow-none">
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <CardTitle className="text-xs font-semibold">
            Identified High-Intent Leads
          </CardTitle>
        </div>
        <Link href="/leads">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1">
            <span>View Pipeline</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {leads.map((lead, i) => (
          <div
            key={i}
            className="flex items-start justify-between rounded-md border border-border bg-background p-2 text-xs"
          >
            <div>
              <div className="font-medium text-foreground">{lead.name}</div>
              <div className="text-[11px] text-muted-foreground">{lead.title}</div>
              <div className="text-[10px] text-muted-foreground/80 mt-1">{lead.reason}</div>
            </div>
            <Badge variant="sql" className="font-mono text-[10px] h-4">
              Score: {lead.score}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
