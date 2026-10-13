"use client";

import React, { useEffect, useState } from "react";
import { Activity, CheckCircle2, AlertCircle, ChevronDown, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchHealthStatus, fetchConnectors, SystemHealth } from "@/lib/api-client";

export function SystemStatusPopover() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [linkedInActive, setLinkedInActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = () => {
    setLoading(true);
    fetchHealthStatus()
      .then((h) => setHealth(h))
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));

    fetchConnectors()
      .then((conns) => {
        const active = conns.some(
          (c) => c.provider.toLowerCase() === "linkedin" && c.status === "active"
        );
        setLinkedInActive(active);
      })
      .catch(() => setLinkedInActive(false));
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.status === "ok" || health?.llm_gateway === "online";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-xs transition-colors hover:border-border-strong hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="View system status"
        >
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isHealthy ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500"
              }`}
            />
            <span className="font-sans text-xs text-foreground font-medium">System status</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground">
            <span className="font-mono text-[11px] tabular-nums">
              {isHealthy ? "Operational" : "Degraded"}
            </span>
            <ChevronDown className="h-3 w-3" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={6}
        className="w-72 rounded-xl border border-border bg-card p-3 shadow-elevated space-y-3"
      >
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Service Health</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              checkStatus();
            }}
            disabled={loading}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Refresh status"
            aria-label="Refresh status"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Workflow Engine</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Active
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">LLM Gateway</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground">
              {health?.llm_gateway === "online" ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  {health.active_model || "Online"}
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                  Standby
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Knowledge Store (pgvector)</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Ready
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">LinkedIn Connector</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              {linkedInActive ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" /> Disconnected
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/60">
            <span className="text-muted-foreground">Cycle Latency</span>
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
              ~1.2s avg
            </span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
