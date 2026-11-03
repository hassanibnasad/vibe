"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus, Sun, Moon, Bot, Bell, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/layout/ThemeProvider";
import { fetchDashboardMetrics } from "@/lib/api-client";

interface HeaderProps {
  onOpenCommandDialog?: () => void;
  onOpenCopilotDrawer?: () => void;
}

const pageTitles: Record<string, string> = {
  "/": "Today",
  "/review-queue": "Review Queue",
  "/calendar": "Content Calendar",
  "/studio": "Studio",
  "/brand": "Brand Identity",
  "/leads": "Lead Pipeline",
  "/knowledge": "Knowledge Base",
  "/connections": "Connectors",
  "/assistant": "Copilot",
  "/figures": "Custom Figures Archive",
};

export function Header({ onOpenCommandDialog, onOpenCopilotDrawer }: HeaderProps) {
  const pathname = usePathname();
  const currentTitle = pageTitles[pathname] || "Overview";
  const { resolvedTheme, toggleTheme } = useTheme();
  const [shortcutKey, setShortcutKey] = useState("Ctrl+K");
  const [pendingReviews, setPendingReviews] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent);
      setShortcutKey(isMac ? "⌘K" : "Ctrl+K");
    }

    fetchDashboardMetrics()
      .then((m) => setPendingReviews(m.review_queue_pending || 0))
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/60 bg-background/85 px-4 sm:px-6 backdrop-blur-xl">
      {/* Page Title — Editions Display */}
      <div className="flex items-center gap-3">
        <h1 className="font-display font-bold text-lg text-foreground tracking-tight">
          {currentTitle}
        </h1>
      </div>

      {/* Action Suite */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Search Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandDialog}
          className="h-8 px-2 sm:px-3 rounded-lg border border-border/80 bg-surface/60 hover:bg-surface hover:border-border-strong transition-all duration-150 text-xs text-muted-foreground hover:text-foreground flex items-center gap-2 backdrop-blur-sm"
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="hidden md:inline">Search & actions...</span>
          <kbd className="pointer-events-none rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground hidden sm:inline">
            {shortcutKey}
          </kbd>
        </button>

        {/* Notifications Bell (Links to Review Queue) */}
        <Link
          href="/review-queue"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-all duration-150"
          title={pendingReviews > 0 ? `${pendingReviews} items waiting for review` : "Notifications"}
          aria-label="Review Queue Notifications"
        >
          <Bell className="h-4 w-4" />
          {pendingReviews > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />
          )}
        </Link>

        {/* User & Workspace Menu (Contains Theme Toggle) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-surface/60 text-foreground hover:bg-surface transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="User profile and preferences"
            >
              <div className="h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-mono font-bold">
                VA
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5 bg-card/95 backdrop-blur-xl border-border/80 shadow-elevated">
            <div className="px-2 py-1.5">
              <p className="text-xs font-semibold text-foreground">Operator Workspace</p>
              <p className="text-[11px] text-muted-foreground font-mono truncate">vibe-production@workspace</p>
            </div>
            <DropdownMenuSeparator className="bg-border/60" />

            <DropdownMenuItem
              onClick={toggleTheme}
              className="flex items-center justify-between text-xs px-2 py-1.5 cursor-pointer rounded-md text-foreground hover:bg-surface"
            >
              <div className="flex items-center gap-2">
                {resolvedTheme === "dark" ? (
                  <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span>Theme: {resolvedTheme === "dark" ? "Dark" : "Light"}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">Switch</span>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/connections"
                className="flex items-center gap-2 text-xs px-2 py-1.5 cursor-pointer rounded-md text-foreground hover:bg-surface"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Channel Connectors</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/brand"
                className="flex items-center gap-2 text-xs px-2 py-1.5 cursor-pointer rounded-md text-foreground hover:bg-surface"
              >
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Brand Rules</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* AI Copilot Drawer Trigger */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenCopilotDrawer}
          className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-surface transition-all duration-150"
          aria-label="Open AI Copilot drawer"
        >
          <Bot className="h-3.5 w-3.5 text-foreground" />
          <span className="hidden lg:inline font-sans font-medium">Copilot</span>
        </Button>

        {/* Global Primary Action: New post — Shopify Editions High-Contrast Button */}
        <Link href="/studio">
          <Button
            size="sm"
            className="h-8 px-3.5 rounded-lg text-xs gap-1.5 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all duration-150 shadow-subtle"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New post</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
