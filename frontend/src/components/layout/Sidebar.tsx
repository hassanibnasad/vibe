"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileEdit,
  Inbox,
  Users,
  Bot,
  Database,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavGroup {
  label: string;
  items: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeVariant?: "default" | "secondary" | "warning" | "hot" | "sql" | "outline" | "review";
  }[];
}

const navigationGroups: NavGroup[] = [
  {
    label: "OPERATE",
    items: [
      {
        name: "Command center",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        name: "Review queue",
        href: "/review-queue",
        icon: Inbox,
        badge: "3",
        badgeVariant: "review",
      },
      {
        name: "Content studio",
        href: "/studio",
        icon: FileEdit,
      },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      {
        name: "Lead pipeline",
        href: "/leads",
        icon: Users,
        badge: "2 SQL",
        badgeVariant: "sql",
      },
      {
        name: "Knowledge base",
        href: "/knowledge",
        icon: Database,
      },
      {
        name: "AI copilot",
        href: "/assistant",
        icon: Bot,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-border bg-card text-card-foreground">
      {/* Brand Header */}
      <div className="flex h-12 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-primary-foreground font-bold text-xs">
          <Radio className="h-3.5 w-3.5" />
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-xs tracking-tight">
          <span>VibeAgent</span>
          <span className="text-[10px] text-muted-foreground font-mono">v1.0</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navigationGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors select-none",
                    isActive
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <Badge
                      variant={item.badgeVariant || "secondary"}
                      className="px-1.5 py-0 text-[10px] font-mono h-4 tabular-nums"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Clean System Status Footer */}
      <div className="border-t border-border p-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-between text-xs cursor-help">
              <span className="text-muted-foreground">System status</span>
              <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Operational
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="space-y-0.5 font-mono text-[10px]">
              <div>Engine: Groq Llama 3.3 70B via LiteLLM</div>
              <div>Orchestration: Hatchet async workers</div>
              <div>Vectors: PostgreSQL + pgvector</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
