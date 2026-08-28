"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Search,
  Bot,
  Plus,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HeaderProps {
  onOpenCommandDialog?: () => void;
  onOpenCopilotDrawer?: () => void;
}

const pageTitles: Record<string, { group: string; title: string }> = {
  "/": { group: "Operate", title: "Command center" },
  "/review-queue": { group: "Operate", title: "Review queue" },
  "/studio": { group: "Operate", title: "Content studio" },
  "/leads": { group: "Intelligence", title: "Lead pipeline" },
  "/knowledge": { group: "Intelligence", title: "Knowledge base" },
  "/assistant": { group: "Intelligence", title: "AI copilot" },
};

const models = [
  { id: "groq/llama-3.3-70b", name: "Groq Llama 3.3 70B", tier: "Cloud fast (500 t/s)" },
  { id: "gemini/gemini-2.0-flash", name: "Gemini 2.0 Flash", tier: "Cloud free tier" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3", tier: "Cloud economy" },
  { id: "ollama/llama3.1:8b", name: "Local Ollama 8B", tier: "Self-hosted" },
];

export function Header({ onOpenCommandDialog, onOpenCopilotDrawer }: HeaderProps) {
  const pathname = usePathname();
  const [selectedModel, setSelectedModel] = useState("groq/llama-3.3-70b");
  const current = pageTitles[pathname] || { group: "Operate", title: "Overview" };

  return (
    <header className="sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b border-border bg-card/95 px-6 backdrop-blur-xs">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">{current.group}</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
        <span className="font-semibold text-foreground">{current.title}</span>
        <Badge variant="published" className="ml-2 py-0 text-[10px] h-4">
          LinkedIn live
        </Badge>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Quick Search Shortcut */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCommandDialog}
          className="h-7 px-2.5 text-xs text-muted-foreground gap-2 font-normal hidden sm:inline-flex"
        >
          <Search className="h-3 w-3" />
          <span>Quick find...</span>
          <kbd className="pointer-events-none ml-2 rounded border border-border bg-muted px-1.5 py-0 text-[9px] font-mono text-muted-foreground">
            Ctrl+K
          </kbd>
        </Button>

        {/* Quiet Model Settings Selector */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="sr-only">Model settings</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Model router: {models.find((m) => m.id === selectedModel)?.name}</span>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase">
              Active LLM engine
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className="flex items-center justify-between text-xs cursor-pointer py-1.5"
              >
                <div>
                  <div className="font-medium text-foreground">{model.name}</div>
                  <div className="text-[10px] text-muted-foreground">{model.tier}</div>
                </div>
                {selectedModel === model.id && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Global Copilot Drawer Trigger */}
        {pathname !== "/assistant" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenCopilotDrawer}
            className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Bot className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Copilot</span>
          </Button>
        )}

        {/* Secondary Header Action (Outlined to avoid competing with screen primary button) */}
        <Link href="/studio">
          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1">
            <Plus className="h-3.5 w-3.5" />
            <span>New brief</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
