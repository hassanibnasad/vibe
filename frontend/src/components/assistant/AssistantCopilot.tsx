"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  generatePost,
  fetchLeads,
  fetchKnowledgeDocs,
  fetchReviewQueue,
  fetchHealthStatus,
} from "@/lib/api-client";
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
  "Draft a LinkedIn post on Autonomous Agent workflows",
  "Audit active SQL leads and surface high intent signals",
  "Inspect knowledge base indexed documents",
  "Check review queue for pending incoming interactions",
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

  const handleSend = async (text?: string) => {
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

    try {
      const lower = query.toLowerCase();
      let responseText = "";
      let toolData: CopilotMessage["toolData"] = undefined;

      if (
        lower.includes("post") ||
        lower.includes("draft") ||
        lower.includes("series") ||
        lower.includes("write") ||
        lower.includes("generate")
      ) {
        try {
          const posts = await generatePost(query, "thought_leadership", "linkedin", 1);
          if (posts && posts.length > 0) {
            const firstPost = posts[0];
            responseText = "Generated LinkedIn draft from your brief grounded in knowledge base:";
            toolData = {
              type: "post_draft",
              post: {
                title: firstPost.content.split("\n")[0].slice(0, 60),
                content: firstPost.content,
                hashtags: firstPost.hashtags || [],
              },
            };
          } else {
            responseText = "Post generation completed, but no content was returned by the pipeline.";
          }
        } catch (err) {
          responseText = `Failed to generate post: ${err instanceof Error ? err.message : "Backend service unavailable"}`;
        }
      } else if (
        lower.includes("lead") ||
        lower.includes("sql") ||
        lower.includes("mql") ||
        lower.includes("intent") ||
        lower.includes("pipeline")
      ) {
        try {
          const leads = await fetchLeads();
          const qualified = leads.filter(
            (l) => l.lead_score >= 70 || l.lead_stage === "sql" || l.lead_stage === "mql"
          );
          if (qualified.length > 0) {
            responseText = `Retrieved ${qualified.length} qualified lead(s) from your active pipeline:`;
            toolData = {
              type: "lead_insight",
              leads: qualified.slice(0, 5).map((l) => ({
                name: l.full_name,
                title:
                  [l.job_title, l.company].filter(Boolean).join(" @ ") ||
                  l.headline ||
                  (l.platform ? `${l.platform} lead` : "Lead"),
                score: l.lead_score,
                reason:
                  l.intent_signals.length > 0
                    ? l.intent_signals.join(", ")
                    : l.tags && l.tags.length > 0
                    ? l.tags.join(", ")
                    : `Stage: ${l.lead_stage.toUpperCase()}`,
              })),
            };
          } else if (leads.length > 0) {
            responseText = `No leads currently meet the SQL/MQL score threshold (score >= 70). You have ${leads.length} total lead(s) in early stages.`;
          } else {
            responseText =
              "No leads found in your pipeline yet. Leads will appear automatically when prospects interact on LinkedIn.";
          }
        } catch (err) {
          responseText = `Failed to query leads: ${err instanceof Error ? err.message : "Backend service unavailable"}`;
        }
      } else if (
        lower.includes("knowledge") ||
        lower.includes("rag") ||
        lower.includes("doc") ||
        lower.includes("brand")
      ) {
        try {
          const docs = await fetchKnowledgeDocs();
          if (docs.length > 0) {
            const uniqueTitles = Array.from(new Set(docs.map((d) => d.title)));
            responseText = `Knowledge base contains ${docs.length} indexed chunks across ${uniqueTitles.length} document(s): ${uniqueTitles.slice(0, 5).join(", ")}${uniqueTitles.length > 5 ? " and more" : ""}.`;
          } else {
            responseText =
              "No knowledge base documents indexed yet. You can upload documents in the Knowledge Base section.";
          }
        } catch (err) {
          responseText = `Failed to query knowledge base: ${err instanceof Error ? err.message : "Backend service unavailable"}`;
        }
      } else if (
        lower.includes("review") ||
        lower.includes("queue") ||
        lower.includes("confidence")
      ) {
        try {
          const queue = await fetchReviewQueue();
          if (queue.length > 0) {
            responseText = `There are currently ${queue.length} incoming interaction(s) requiring review in the queue.`;
          } else {
            responseText = "Review queue is clear! All recent automated replies met confidence thresholds.";
          }
        } catch (err) {
          responseText = `Failed to check review queue: ${err instanceof Error ? err.message : "Backend service unavailable"}`;
        }
      } else {
        try {
          const health = await fetchHealthStatus();
          responseText = `AI Copilot is operational. LLM Gateway is ${health.llm_gateway}, active model is ${health.active_model}. You can ask me to draft a LinkedIn post, audit leads, or inspect the knowledge base.`;
        } catch {
          responseText =
            "AI Copilot is connected. Enter a brief to draft a LinkedIn post, query your lead pipeline, or inspect the knowledge base.";
        }
      }

      const assistantMsg: CopilotMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        toolData,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (outerErr) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `Error processing request: ${outerErr instanceof Error ? outerErr.message : String(outerErr)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
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
