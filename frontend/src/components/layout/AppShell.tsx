"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CommandDialog } from "./CommandDialog";
import { CopilotDrawer } from "@/components/assistant/CopilotDrawer";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex bg-background text-foreground antialiased">
        <Sidebar />
        <div className="flex-1 ml-56 flex flex-col min-h-screen">
          <Header
            onOpenCommandDialog={() => setCommandOpen(true)}
            onOpenCopilotDrawer={() => setCopilotOpen(true)}
          />
          <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Global Keyboard Navigator & Slide-over Copilot */}
        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} />
        <CopilotDrawer open={copilotOpen} onOpenChange={setCopilotOpen} />
      </div>
    </TooltipProvider>
  );
}
