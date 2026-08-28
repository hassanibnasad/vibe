"use client";

import React from "react";
import { AssistantCopilot } from "@/components/assistant/AssistantCopilot";
import { Badge } from "@/components/ui/badge";
import { Bot, Cpu } from "lucide-react";

export default function AssistantPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-4 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h1 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Bot className="h-4 w-4 text-foreground" />
            <span>AI Marketing Copilot</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Conversational interface for campaign briefs, BANT lead analysis, and knowledge base grounding.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-[10px] font-mono py-0 h-5">
            <Cpu className="h-3 w-3 text-muted-foreground" />
            <span>groq/llama-3.3-70b</span>
          </Badge>
          <Badge variant="success" className="py-0 text-[10px] h-5">
            Gateway Connected
          </Badge>
        </div>
      </div>

      {/* Main Copilot Box */}
      <div className="flex-1 overflow-hidden">
        <AssistantCopilot />
      </div>
    </div>
  );
}
