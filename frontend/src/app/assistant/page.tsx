"use client";

import React, { useEffect, useState } from "react";
import { AssistantCopilot } from "@/components/assistant/AssistantCopilot";
import { Badge } from "@/components/ui/badge";
import { fetchHealthStatus, SystemHealth } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AssistantPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    fetchHealthStatus()
      .then(setHealth)
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-5 flex flex-col h-[calc(100vh-7rem)]">
      <PageHeader
        title="Copilot"
        description="Assistance with post topics, lead insights, and knowledge queries."
        action={
          health ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 font-mono text-xs">
                {health.active_model}
              </Badge>
              <Badge variant={health.status === "ok" ? "success" : "warning"} className="text-xs">
                {health.llm_gateway === "online" ? "Connected" : "Offline"}
              </Badge>
            </div>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-hidden">
        <AssistantCopilot />
      </div>
    </div>
  );
}
