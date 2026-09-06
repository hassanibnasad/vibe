"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CommandDialog } from "./CommandDialog";
import { CopilotDrawer } from "@/components/assistant/CopilotDrawer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageTransition } from "@/lib/motion";
import { FluidShader } from "@/components/ui/FluidShader";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative min-h-screen flex bg-background text-foreground antialiased selection:bg-cyan-500/25 selection:text-cyan-200">
        {/* Atmospheric Living Shader Backdrop */}
        <FluidShader />

        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Workspace */}
        <div className="relative z-10 flex-1 ml-64 flex flex-col min-h-screen">
          <Header
            onOpenCommandDialog={() => setCommandOpen(true)}
            onOpenCopilotDrawer={() => setCopilotOpen(true)}
          />
          <main className="flex-1 p-8 lg:p-12 overflow-y-auto max-w-7xl w-full mx-auto">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>

        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} />
        <CopilotDrawer open={copilotOpen} onOpenChange={setCopilotOpen} />
      </div>
    </TooltipProvider>
  );
}
