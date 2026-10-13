"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  Inbox,
  FileEdit,
  Users,
  Database,
  CalendarDays,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Link2,
} from "lucide-react";

interface CommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const commands = [
  {
    category: "Navigation",
    items: [
      { name: "Today (Dashboard Overview)", href: "/", icon: LayoutDashboard },
      { name: "Review Queue (Waiting for review)", href: "/review-queue", icon: Inbox },
      { name: "Content Calendar", href: "/calendar", icon: CalendarDays },
      { name: "Studio (Create post)", href: "/studio", icon: FileEdit },
      { name: "Brand Identity", href: "/brand", icon: ShieldCheck },
      { name: "Lead Pipeline", href: "/leads", icon: Users },
      { name: "Knowledge Base", href: "/knowledge", icon: Database },
      { name: "Connectors", href: "/connections", icon: Link2 },
    ],
  },
  {
    category: "Quick Actions",
    items: [
      { name: "Extract brand from website", href: "/brand?action=extract", icon: Globe },
      { name: "Connect LinkedIn account", href: "/connections", icon: Link2 },
      { name: "Create new post", href: "/studio", icon: PlusCircle },
      { name: "Review pending replies", href: "/review-queue", icon: ShieldAlert },
    ],
  },
];

export function CommandDialog({ open, onOpenChange }: CommandDialogProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleSelect = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-md overflow-hidden bg-card border-border">
        <DialogHeader className="px-3 pt-3 pb-0">
          <DialogTitle className="sr-only">Quick Command Menu</DialogTitle>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or jump to page..."
            className="h-9 text-xs bg-muted/40 border-border"
            autoFocus
          />
        </DialogHeader>

        <div className="max-h-72 overflow-y-auto p-2 space-y-3">
          {commands.map((group) => {
            const filtered = group.items.filter((item) =>
              item.name.toLowerCase().includes(search.toLowerCase())
            );
            if (filtered.length === 0) return null;

            return (
              <div key={group.category} className="space-y-1">
                <div className="px-2 text-[10px] font-semibold text-muted-foreground uppercase">
                  {group.category}
                </div>
                {filtered.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleSelect(item.href)}
                      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-accent transition-colors text-left"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
