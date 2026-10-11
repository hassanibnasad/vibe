"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Search, Sparkles, Plus, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/layout/ThemeProvider";

interface HeaderProps {
  onOpenCommandDialog?: () => void;
  onOpenCopilotDrawer?: () => void;
}

const pageTitles: Record<string, { group: string; title: string }> = {
  "/": { group: "Operate", title: "Command Center" },
  "/review-queue": { group: "Operate", title: "Review Queue" },
  "/calendar": { group: "Operate", title: "Content Calendar" },
  "/studio": { group: "Operate", title: "Content Studio" },
  "/brand": { group: "Intelligence", title: "Brand Identity & Guidelines" },
  "/leads": { group: "Intelligence", title: "Lead Pipeline" },
  "/knowledge": { group: "Intelligence", title: "Knowledge Base" },
  "/assistant": { group: "Intelligence", title: "AI Copilot" },
  "/connections": { group: "Channels", title: "Social Connectors" },
};

export function Header({ onOpenCommandDialog, onOpenCopilotDrawer }: HeaderProps) {
  const pathname = usePathname();
  const current = pageTitles[pathname] || { group: "Operate", title: "Overview" };
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/90 px-8 backdrop-blur-sm">
      {/* Editorial Breadcrumbs */}
      <div className="flex items-center gap-2.5 text-sm">
        <span className="text-muted-foreground font-medium font-sans text-xs tracking-wider uppercase">
          {current.group}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
        <span className="font-display font-semibold text-foreground tracking-tight text-sm">
          {current.title}
        </span>
      </div>

      {/* Action Suite */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenCommandDialog}
          className="h-9 px-3.5 rounded-lg border border-border bg-surface hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground flex items-center gap-2.5"
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Quick command...</span>
          <kbd className="pointer-events-none rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            Ctrl+K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {pathname !== "/assistant" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenCopilotDrawer}
            className="h-9 px-3 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-foreground" />
            <span className="hidden md:inline font-sans">Copilot</span>
          </Button>
        )}

        <Link href="/studio">
          <Button
            size="sm"
            className="h-9 px-3.5 rounded-lg text-xs gap-1.5 font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-subtle"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Brief</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
