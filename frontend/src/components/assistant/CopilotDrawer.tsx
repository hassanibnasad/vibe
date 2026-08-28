"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AssistantCopilot } from "./AssistantCopilot";
import { Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CopilotDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CopilotDrawer({ open, onOpenChange }: CopilotDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col h-full bg-card">
        <SheetHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-foreground" />
            <div>
              <SheetTitle className="text-xs font-semibold">AI Marketing Copilot</SheetTitle>
              <SheetDescription className="text-[10px] text-muted-foreground">
                In-context strategy and pipeline orchestration
              </SheetDescription>
            </div>
          </div>
          <Badge variant="success" className="mr-6 py-0 text-[10px] h-4">
            LiteLLM Connected
          </Badge>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <AssistantCopilot isDrawer />
        </div>
      </SheetContent>
    </Sheet>
  );
}
