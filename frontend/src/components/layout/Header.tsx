"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Search, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onOpenCommandDialog?: () => void;
  onOpenCopilotDrawer?: () => void;
}

const pageTitles: Record<string, { group: string; title: string }> = {
  "/": { group: "Operate", title: "Command Center" },
  "/review-queue": { group: "Operate", title: "Review Queue" },
  "/studio": { group: "Operate", title: "Content Studio" },
  "/leads": { group: "Intelligence", title: "Lead Pipeline" },
  "/knowledge": { group: "Intelligence", title: "Knowledge Base" },
  "/assistant": { group: "Intelligence", title: "AI Copilot" },
};

export function Header({ onOpenCommandDialog, onOpenCopilotDrawer }: HeaderProps) {
  const pathname = usePathname();
  const current = pageTitles[pathname] || { group: "Operate", title: "Overview" };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/[0.07] bg-[#07080b]/70 px-8 backdrop-blur-2xl">
      {/* Editorial Breadcrumbs */}
      <div className="flex items-center gap-2.5 text-sm">
        <span className="text-muted-foreground/80 font-medium font-sans text-xs tracking-wider uppercase">
          {current.group}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
        <span className="font-display font-semibold text-white tracking-tight text-sm">
          {current.title}
        </span>
      </div>

      {/* Action Suite */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenCommandDialog}
          className="h-9 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all text-xs text-muted-foreground flex items-center gap-2.5 shadow-sm"
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Quick command...</span>
          <kbd className="pointer-events-none rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/80">
            Ctrl+K
          </kbd>
        </button>

        {pathname !== "/assistant" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenCopilotDrawer}
            className="h-9 px-3.5 rounded-xl text-xs gap-2 text-muted-foreground hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden md:inline font-sans">Copilot</span>
          </Button>
        )}

        <Link href="/studio">
          <Button
            size="sm"
            className="h-9 px-4 rounded-xl text-xs gap-1.5 font-medium bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white shadow-[0_0_20px_-3px_rgba(56,189,248,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Brief</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
