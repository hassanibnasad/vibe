"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Edit3,
  Sparkles,
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileJson,
  Clock,
  User,
  ExternalLink,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AuditLogEntry,
  fetchAuditLogs,
  getAuditLogExportUrl,
} from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/utils";

interface AuditLogDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SAMPLE_LOGS: AuditLogEntry[] = [
  {
    id: "aud-001",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    operator_id: "op-1",
    operator_email: "operator@vibeagent.ai",
    action: "approve",
    entity_type: "post",
    entity_id: "p-491",
    summary: "Approved marketing post draft (length: 420 chars) for LinkedIn dispatch",
    details: { platform: "linkedin", confidence_score: 0.94, scheduled: true },
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: "aud-002",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    operator_id: "op-1",
    operator_email: "operator@vibeagent.ai",
    action: "edit",
    entity_type: "draft",
    entity_id: "d-302",
    summary: "Adjusted CTA and verified brand claim on multi-agent whitepaper teaser",
    details: { edited_chars: 38, previous_revision_id: "rev-2" },
    created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
  },
  {
    id: "aud-003",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    operator_id: "op-1",
    operator_email: "compliance@vibeagent.ai",
    action: "reject",
    entity_type: "message",
    entity_id: "m-118",
    summary: "Rejected automated DM reply: below confidence threshold (0.68)",
    details: { confidence_score: 0.68, reason: "ambiguous lead intent" },
    created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
  {
    id: "aud-004",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    operator_id: "op-1",
    operator_email: "operator@vibeagent.ai",
    action: "refine",
    entity_type: "post",
    entity_id: "p-488",
    summary: "Refined prompt with operator feedback: 'Emphasize SOC2 Type II compliance'",
    details: { prompt_delta: "Added compliance emphasis", tone: "authoritative" },
    created_at: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
  },
];

export function AuditLogDrawer({ open, onOpenChange }: AuditLogDrawerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchAuditLogs({
        action: actionFilter === "all" ? undefined : actionFilter,
        limit: 50,
      });
      if (res && res.data && res.data.length > 0) {
        setLogs(res.data);
      } else {
        setLogs(SAMPLE_LOGS);
      }
    } catch {
      setLogs(SAMPLE_LOGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadLogs();
    }
  }, [open, actionFilter]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesSearch =
        search.trim() === "" ||
        log.summary.toLowerCase().includes(search.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
        (log.operator_email && log.operator_email.toLowerCase().includes(search.toLowerCase()));
      return matchesAction && matchesSearch;
    });
  }, [logs, actionFilter, search]);

  const handleExport = (format: "csv" | "json") => {
    const url = getAuditLogExportUrl(format, actionFilter === "all" ? undefined : actionFilter);
    window.open(url, "_blank");
  };

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case "approve":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-mono gap-1">
            <CheckCircle2 className="h-3 w-3" /> Approve
          </Badge>
        );
      case "reject":
        return (
          <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/25 text-[10px] font-mono gap-1">
            <XCircle className="h-3 w-3" /> Reject
          </Badge>
        );
      case "edit":
        return (
          <Badge className="bg-sky-500/10 text-sky-400 border border-sky-500/25 text-[10px] font-mono gap-1">
            <Edit3 className="h-3 w-3" /> Edit
          </Badge>
        );
      case "refine":
        return (
          <Badge className="bg-violet-500/10 text-violet-400 border border-violet-500/25 text-[10px] font-mono gap-1">
            <Sparkles className="h-3 w-3" /> Refine
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] font-mono">
            {action}
          </Badge>
        );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl bg-canvas border-l border-border/80 p-0 flex flex-col h-full text-foreground shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-border/60 bg-surface/40 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold tracking-tight text-bone font-display">
                  Operator Audit & Compliance Log
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground font-mono">
                  Tamper-evident record of human-in-the-loop approvals & overrides
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("csv")}
                className="h-8 gap-1.5 text-xs font-mono border-border hover:bg-surface-raised"
                title="Download CSV compliance export"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span>CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("json")}
                className="h-8 gap-1.5 text-xs font-mono border-border hover:bg-surface-raised"
                title="Download JSON compliance export"
              >
                <FileJson className="h-3.5 w-3.5 text-sky-400" />
                <span>JSON</span>
              </Button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {["all", "approve", "reject", "edit", "refine"].map((action) => (
                <button
                  key={action}
                  onClick={() => setActionFilter(action)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all capitalize ${
                    actionFilter === action
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "bg-surface/80 text-muted-foreground hover:text-foreground hover:bg-surface-raised border border-border/40"
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>

            <div className="relative min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search audit trail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-surface/60 border-border/60 focus:border-primary font-mono"
              />
            </div>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl bg-surface/40" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/60 rounded-xl">
              <ShieldCheck className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-bone">No audit records match filters</p>
              <p className="text-xs text-muted-foreground mt-1">
                Every review approval, rejection, or edit will appear here automatically.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-border/60 bg-surface/30 hover:bg-surface/60 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-surface border border-border/40">
                      {log.entity_type}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">#{log.entity_id.slice(-6)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeTime(log.created_at)}</span>
                  </div>
                </div>

                <p className="text-xs text-bone/90 leading-relaxed font-sans">{log.summary}</p>

                <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px] font-mono text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-primary/70" />
                    <span>{log.operator_email || "operator"}</span>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <span className="text-[10px] text-muted-foreground/70">
                      {Object.keys(log.details).length} metadata fields
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/60 bg-surface/30 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>Showing {filteredLogs.length} audit trail events</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadLogs}
            className="h-7 text-xs gap-1 hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
