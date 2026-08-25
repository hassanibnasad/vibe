"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Inbox,
  Users,
  Bot,
  Database,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "warning" | "success" | "hot";
}

const navItems: NavItem[] = [
  {
    name: "Command Center",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Content Studio",
    href: "/studio",
    icon: Sparkles,
  },
  {
    name: "Review Queue",
    href: "/review-queue",
    icon: Inbox,
    badge: "3",
    badgeVariant: "warning",
  },
  {
    name: "Lead Pipeline",
    href: "/leads",
    icon: Users,
    badge: "15 SQL",
    badgeVariant: "hot",
  },
  {
    name: "AI Copilot",
    href: "/assistant",
    icon: Bot,
  },
  {
    name: "Knowledge & RAG",
    href: "/knowledge",
    icon: Database,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-lg shadow-purple-900/40">
          <Share2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-bold text-white tracking-tight">
            <span>VibeAgent</span>
            <span className="rounded bg-purple-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-purple-300 border border-purple-500/30">
              MVP
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Autonomous Marketing AI</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-gradient-to-r from-purple-600/20 to-indigo-600/10 text-white border border-purple-500/30 shadow-sm"
                  : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-purple-400" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <Badge variant={item.badgeVariant || "default"} className="px-1.5 py-0 text-[10px]">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="border-t border-slate-800/80 p-4">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400">System Gateway</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Connected
            </span>
          </div>
          <p className="text-[11px] text-slate-400">FastAPI + LiteLLM + Hatchet</p>
        </div>
      </div>
    </aside>
  );
}
