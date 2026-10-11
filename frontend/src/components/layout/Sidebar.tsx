"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileEdit,
  Inbox,
  Users,
  Database,
  Sparkles,
  Radio,
  CalendarDays,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { fetchDashboardMetrics } from "@/lib/api-client";
import { PulseBeacon } from "@/components/ui/AnimatedCheck";

interface NavGroup {
  label: string;
  items: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    countKey?: "review_queue_pending" | "mql_sql_leads";
  }[];
}

const navigationGroups: NavGroup[] = [
  {
    label: "OPERATE",
    items: [
      { name: "Command Center",    href: "/",              icon: LayoutDashboard },
      { name: "Review Queue",      href: "/review-queue",  icon: Inbox, countKey: "review_queue_pending" },
      { name: "Content Calendar",  href: "/calendar",      icon: CalendarDays },
      { name: "Content Studio",    href: "/studio",        icon: FileEdit },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { name: "Brand Identity", href: "/brand", icon: ShieldCheck },
      { name: "Lead Pipeline", href: "/leads", icon: Users, countKey: "mql_sql_leads" },
      { name: "Knowledge Base", href: "/knowledge", icon: Database },
      { name: "AI Copilot", href: "/assistant", icon: Sparkles },
    ],
  },
  {
    label: "CHANNELS",
    items: [
      { name: "Connectors", href: "/connections", icon: Link2 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchDashboardMetrics()
      .then((data) => {
        setCounts({
          review_queue_pending: data.review_queue_pending,
          mql_sql_leads: data.mql_sql_leads,
        });
      })
      .catch(() => {
        // Silently fail if backend offline
      });
  }, []);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card text-foreground">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-transform duration-200 group-hover:scale-105">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight text-foreground block leading-none">
              VIBE<span className="text-muted-foreground font-light ml-0.5">AGENT</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mt-0.5 block">
              Autonomous OS
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-7">
        {navigationGroups.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <div className="px-3 pb-1 text-[10px] font-mono font-semibold tracking-widest text-muted-foreground uppercase">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const count = item.countKey ? counts[item.countKey] : undefined;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center justify-between rounded-lg px-3.5 py-2 text-sm font-medium transition-colors select-none",
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="font-sans">{item.name}</span>
                  </div>
                  {count !== undefined && count > 0 && (
                    <Badge
                      variant={item.countKey === "review_queue_pending" ? "review" : "sql"}
                      className="px-2 py-0 text-[10px] font-mono h-5 tabular-nums"
                    >
                      {count}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Live System Telemetry Status */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface border border-border">
          <div className="flex items-center gap-2">
            <PulseBeacon status="live" />
            <span className="text-xs font-mono text-muted-foreground">Orchestrator</span>
          </div>
          <span className="text-[11px] font-mono text-foreground font-medium">Active</span>
        </div>
      </div>
    </aside>
  );
}
