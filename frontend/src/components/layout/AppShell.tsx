"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileEdit,
  Inbox,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CommandDialog } from "./CommandDialog";
import { CopilotDrawer } from "@/components/assistant/CopilotDrawer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import { PageTransition } from "@/lib/motion";
import { FluidShader } from "@/components/ui/FluidShader";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { name: "Today", href: "/", icon: LayoutDashboard },
  { name: "Reviews", href: "/review-queue", icon: Inbox },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Studio", href: "/studio", icon: FileEdit },
  { name: "Brand", href: "/brand", icon: ShieldCheck },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={200}>
      <ToastProvider>
        <div className="relative min-h-screen flex bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
          {/* Subtle Micro-Grain Noise Backdrop */}
          <FluidShader />

          {/* Navigation Sidebar (hidden on mobile, rail on tablet, full on desktop) */}
          <Sidebar />

          {/* Main Content Workspace */}
          <div className="relative z-10 flex-1 ml-0 md:ml-16 lg:ml-64 flex flex-col min-h-screen pb-16 md:pb-0 transition-all duration-200">
            <Header
              onOpenCommandDialog={() => setCommandOpen(true)}
              onOpenCopilotDrawer={() => setCopilotOpen(true)}
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto max-w-7xl w-full mx-auto">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
          </div>

          {/* Mobile Bottom Navigation (Visible under 768px, 44px touch targets) */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border flex items-center justify-around h-14 px-2 safe-area-pb">
            {mobileNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[48px] min-h-[44px] py-1 px-2 rounded-md transition-colors text-[10px] font-medium",
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 mb-0.5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} />
          <CopilotDrawer open={copilotOpen} onOpenChange={setCopilotOpen} />
        </div>
      </ToastProvider>
    </TooltipProvider>
  );
}
