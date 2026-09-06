"use client";

import React, { useEffect, useState } from "react";
import { AssistantCopilot } from "@/components/assistant/AssistantCopilot";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";
import { fetchHealthStatus, SystemHealth } from "@/lib/api-client";
import { FadeIn } from "@/lib/motion";

export default function AssistantPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    fetchHealthStatus()
      .then(setHealth)
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-5 flex flex-col h-[calc(100vh-7rem)]">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI Copilot</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Campaign briefs, lead analysis, and knowledge base queries.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {health && (
              <>
                <Badge variant="outline" className="gap-1.5 font-mono text-xs">
                  {health.active_model}
                </Badge>
                <Badge variant={health.status === "ok" ? "success" : "warning"} className="text-xs">
                  {health.llm_gateway === "online" ? "Connected" : "Offline"}
                </Badge>
              </>
            )}
          </div>
        </div>
      </FadeIn>

      <div className="flex-1 overflow-hidden">
        <AssistantCopilot />
      </div>
    </div>
  );
}
