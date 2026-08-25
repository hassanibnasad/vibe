"use client";

import React, { useState } from "react";
import {
  Bot,
  Send,
  User,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface PostDraftData {
  title?: string;
  content: string;
  hashtags: string[];
}

interface LeadInsightItem {
  name: string;
  title: string;
  score: number;
  reason: string;
}

interface LeadInsightData {
  leads: LeadInsightItem[];
}

interface Message {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
  actionPayload?: {
    type: "post_draft" | "lead_insight" | "review_alert";
    postData?: PostDraftData;
    leadData?: LeadInsightData;
  };
}

export default function AssistantCopilotPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "copilot",
      text: "Hello! I am your VibeAgent Marketing Copilot. I can brainstorm viral LinkedIn briefs, audit your review queue, inspect BANT lead scoring patterns, or draft multi-angle campaigns grounded in your knowledge base.",
      timestamp: "Just now",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const quickPrompts = [
    "Draft a 3-part LinkedIn post series on Autonomous AI Agents",
    "Show me SQL leads with high intent in the last 24h",
    "Audit my review queue and suggest reply improvements",
    "What knowledge docs are missing for our new product launch?",
  ];

  const handleSend = (textToSend?: string) => {
    const prompt = textToSend || input;
    if (!prompt.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: prompt,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let replyText = "I've analyzed your request with RAG context and active platform telemetry.";
      let actionPayload: Message["actionPayload"] = undefined;

      if (prompt.toLowerCase().includes("post") || prompt.toLowerCase().includes("draft")) {
        replyText = "Here is a high-impact LinkedIn post draft tailored for B2B tech leaders:";
        actionPayload = {
          type: "post_draft",
          postData: {
            title: "Autonomous Agents in B2B Funnels",
            content: "Why are B2B teams replacing manual SDR outreach with multi-agent orchestration?\n\n1. Response speed drops from 4 hours to 1.8 seconds\n2. BANT scoring runs continuously across comment threads\n3. Zero leads slip through the cracks\n\nSpeed-to-lead is the single biggest conversion lever in 2026.",
            hashtags: ["#AIAgents", "#RevOps", "#B2BMarketing"],
          },
        };
      } else if (prompt.toLowerCase().includes("lead") || prompt.toLowerCase().includes("sql")) {
        replyText = "Found 2 high-intent SQL leads requiring direct sales rep outreach:";
        actionPayload = {
          type: "lead_insight",
          leadData: {
            leads: [
              { name: "Sarah Chen", title: "VP Demand Gen @ SaaSScale", score: 92, reason: "Inquired about custom PostgreSQL + Hatchet workflows for 50 SDRs" },
              { name: "David Miller", title: "Director RevOps @ CloudCore", score: 78, reason: "Requested demo booking for BANT automation" },
            ],
          },
        };
      } else {
        replyText = "Understood! I've updated the campaign context and cross-referenced with your brand knowledge base. You can view the live draft in the Content Studio.";
      }

      const botMsg: Message = {
        id: `c-${Date.now()}`,
        sender: "copilot",
        text: replyText,
        timestamp: "Just now",
        actionPayload,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-400" />
            <span>AI Marketing Copilot</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Assistant UI conversational agent for strategy, RAG queries, and pipeline actions.
          </p>
        </div>
        <Badge variant="success" className="gap-1.5 py-0.5">
          <Zap className="h-3 w-3" />
          <span>LiteLLM Connected</span>
        </Badge>
      </div>

      {/* Chat Thread Container */}
      <Card className="flex-1 flex flex-col justify-between overflow-hidden border-slate-800 bg-slate-950/60 shadow-2xl">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "copilot" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-xl space-y-3 rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                    : "bg-slate-900/90 text-slate-200 border border-slate-800 shadow-md"
                }`}
              >
                <p>{msg.text}</p>

                {/* Structured Payload Cards */}
                {msg.actionPayload?.type === "post_draft" && msg.actionPayload.postData && (
                  <div className="rounded-xl border border-purple-500/30 bg-purple-950/40 p-3 space-y-2 mt-2">
                    <span className="text-[10px] font-bold uppercase text-purple-400 block">
                      Proposed Post Draft
                    </span>
                    <p className="text-xs text-purple-100 font-mono whitespace-pre-line">
                      {msg.actionPayload.postData.content}
                    </p>
                    <div className="flex gap-1 pt-1">
                      {msg.actionPayload.postData.hashtags.map((tag: string) => (
                        <span key={tag} className="text-[10px] text-purple-300 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {msg.actionPayload?.type === "lead_insight" && msg.actionPayload.leadData && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 space-y-2 mt-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                      High-Intent Leads Found
                    </span>
                    {msg.actionPayload.leadData.leads.map((l: LeadInsightItem, i: number) => (
                      <div key={i} className="text-xs text-emerald-200 border-t border-emerald-500/20 pt-1.5 first:border-0 first:pt-0">
                        <div className="font-bold">{l.name} — {l.title} (Score: {l.score})</div>
                        <div className="text-[11px] text-slate-400">{l.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3.5 items-center text-xs text-purple-400 animate-pulse">
              <Bot className="h-4 w-4" />
              <span>Copilot is reasoning over brand knowledge...</span>
            </div>
          )}
        </CardContent>

        {/* Input & Quick Prompts Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-3">
          {/* Quick Action Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                className="whitespace-nowrap rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-slate-300 hover:border-purple-500/40 hover:bg-slate-800/80 transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot to draft copy, query leads, or audit campaigns..."
              className="flex-1 rounded-xl h-11 bg-slate-900 border-slate-800 text-xs"
            />
            <Button type="submit" disabled={!input.trim() || isTyping} className="h-11 px-5 rounded-xl gap-1.5">
              <Send className="h-4 w-4" />
              <span>Send</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
