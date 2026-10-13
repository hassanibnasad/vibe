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
  Radio,
  CalendarDays,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchDashboardMetrics } from "@/lib/api-client";
import { SystemStatusPopover } from "./SystemStatusPopover";

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
    label: "Create",
    items: [
      { name: "Today",             href: "/",              icon: LayoutDashboard },
      { name: "Review Queue",      href: "/review-queue",  icon: Inbox, countKey: "review_queue_pending" },
      { name: "Content Calendar",  href: "/calendar",      icon: CalendarDays },
      { name: "Studio",            href: "/studio",        icon: FileEdit },
    ],
  },
  {
    label: "Brand & Knowledge",
    items: [
      { name: "Brand Identity",    href: "/brand",         icon: ShieldCheck },
      { name: "Knowledge Base",    href: "/knowledge",     icon: Database },
    ],
  },
  {
    label: "Audience & Channels",
    items: [
      { name: "Lead Pipeline",     href: "/leads",         icon: Users, countKey: "mql_sql_leads" },
      { name: "Connectors",        href: "/connections",   icon: Link2 },
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
    <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-16 lg:w-64 flex-col border-r border-border bg-card text-foreground select-none transition-all duration-200">
      {/* Brand Header - Compact 56px */}
      <div className="flex h-14 items-center justify-center lg:justify-between border-b border-border px-3 lg:px-5 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background transition-transform duration-150 group-hover:scale-105 shrink-0">
            <Radio className="h-3.5 w-3.5" />
          </div>
          <div className="hidden lg:block">
            <span className="font-sans font-bold text-sm tracking-tight text-foreground block leading-none">
              VibeAgent
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Groups - Tightened 32-34px items to fit 768px height */}
      <nav className="flex-1 overflow-y-auto px-2 lg:px-3 py-3 space-y-4">
        {navigationGroups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <div className="hidden lg:block px-2.5 pb-1 text-[11px] font-medium text-muted-foreground">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const count = item.countKey ? counts[item.countKey] : undefined;

              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex h-[34px] items-center justify-center lg:justify-between rounded-md px-2 lg:px-2.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-accent text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="hidden lg:inline font-sans truncate">{item.name}</span>
                  </div>
                  {count !== undefined && count > 0 && (
                    <Badge
                      variant={item.countKey === "review_queue_pending" ? "review" : "sql"}
                      className="hidden lg:inline-flex px-1.5 py-0 text-[10px] font-mono h-4 tabular-nums"
                    >
                      {count}
                    </Badge>
                  )}
                </Link>
              );

              return (
                <div key={item.href}>
                  {/* Collapsed rail tooltip */}
                  <div className="lg:hidden">
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-2 text-xs">
                        <span>{item.name}</span>
                        {count !== undefined && count > 0 && (
                          <span className="font-mono text-[10px]">({count})</span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {/* Full desktop expanded */}
                  <div className="hidden lg:block">
                    {linkContent}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Consolidated System Status Popover */}
      <div className="p-2 lg:p-3 border-t border-border bg-card shrink-0">
        <SystemStatusPopover />
      </div>
    </aside>
  );
}
