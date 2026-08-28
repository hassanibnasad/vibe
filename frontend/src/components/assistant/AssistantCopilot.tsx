"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { PostDraftTool, PostDraftData } from "./PostDraftTool";
import { LeadInsightTool, LeadInsightItem } from "./LeadInsightTool";

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  toolData?: {
    type: "post_draft" | "lead_insight";
    post?: PostDraftData;
    leads?: LeadInsightItem[];
  };
}

const quickPrompts = [
  "Draft a LinkedIn post series on Autonomous Agent latency",
  "Audit active SQL leads and surface high intent signals",
  "Summarize key brand positioning points from knowledge base",
  "Inspect review queue and check for false-positive confidence scores",
];

export function AssistantCopilot({ isDrawer = false }: { isDrawer?: boolean }) {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "msg-0",
      role: "assistant",
      content:
        "Marketing Copilot active. Enter a brief to draft content, query CRM lead signals, or inspect knowledge base citations.",
      timestamp: "Connected",
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleSend = (text?: string) => {
    const query = text || input;
    if (!query.trim() || isProcessing) return;

    const userMsg: CopilotMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);

    setTimeout(() => {
      let responseText = "Processed query against brand guidelines and active telemetry.";
      let toolData: CopilotMessage["toolData"] = undefined;

      const lower = query.toLowerCase();
      if (lower.includes("post") || lower.includes("draft") || lower.includes("series")) {
        responseText = "Generated LinkedIn draft grounded in RAG architecture spec:";
        toolData = {
          type: "post_draft",
          post: {
            title: "Autonomous Agents in B2B Pipeline Execution",
            content:
              "Why are enterprise growth teams moving away from manual SDR triage?\n\n1. Inbound response time drops from 4 hours to 1.8 seconds\n2. BANT qualification executes automatically across comment threads\n3. Zero qualified prospects slip past the review threshold\n\nSpeed-to-lead remains the primary conversion lever for high-ACV products.",
            hashtags: ["#EnterpriseAI", "#RevOps", "#B2BMarketing"],
          },
        };
      } else if (lower.includes("lead") || lower.includes("sql") || lower.includes("intent")) {
        responseText = "Retrieved 2 SQL prospects meeting confidence criteria (score >= 75):";
        toolData = {
          type: "lead_insight",
          leads: [
            {
              name: "Sarah Chen",
              title: "VP Demand Gen @ SaaSScale",
              score: 92,
              reason: "Inquired about custom PostgreSQL and Hatchet workflow integration for 50 SDR seats",
            },
            {
              name: "David Miller",
              title: "Director of RevOps @ CloudCore",
              score: 78,
              reason: "Requested demo booking for BANT automation pipeline",
            },
          ],
        };
      } else {
        responseText =
          "Query analyzed. Context synchronized with pgvector embeddings and review queue state. You can view or refine live drafts in Content Studio.";
      }

      const assistantMsg: CopilotMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        toolData,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsProcessing(false);
    }, 750);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden ${isDrawer ? "border-0" : ""}`}>
      {/* Messages Thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs leading-relaxed ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] space-y-2 rounded-md p-3 border ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-foreground border-border"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {msg.toolData?.type === "post_draft" && msg.toolData.post && (
                <PostDraftTool postData={msg.toolData.post} />
              )}

              {msg.toolData?.type === "lead_insight" && msg.toolData.leads && (
                <LeadInsightTool leads={msg.toolData.leads} />
              )}

              <div
                className={`text-[9px] font-mono ${
                  msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.role === "user" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground border border-border">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3 text-xs items-center text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted border border-border">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            </div>
            <span>Reasoning across brand knowledge and telemetry...</span>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="border-t border-border p-3 bg-muted/20 space-y-2.5">
        {/* Quick Prompts */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={isProcessing}
              className="whitespace-nowrap rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div className="relative flex items-center">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Copilot to draft copy, audit review items, or inspect CRM signals... (Enter to send)"
            className="min-h-[44px] max-h-32 pr-12 text-xs resize-none bg-background border-border"
            rows={1}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 h-7 w-7 rounded-md"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
