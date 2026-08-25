"use client";

import React, { useState } from "react";
import { Cpu, Bell, Plus, ChevronDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const [selectedModel, setSelectedModel] = useState("groq/llama-3.3-70b");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const models = [
    { id: "groq/llama-3.3-70b", name: "Groq Llama 3.3 70B", speed: "~500 t/s", tier: "Cloud Fast" },
    { id: "gemini/gemini-2.0-flash", name: "Gemini 2.0 Flash", speed: "Instant", tier: "Cloud Free Tier" },
    { id: "deepseek/deepseek-chat", name: "DeepSeek V3", speed: "Deep Reasoning", tier: "Cloud Economy" },
    { id: "ollama/llama3.1:8b", name: "Local Ollama 8B", speed: "Local CPU/GPU", tier: "Self-Hosted" },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-8 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold text-white">
          Operator Console
        </h1>
        <div className="h-4 w-px bg-slate-800" />
        <Badge variant="success" className="gap-1.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          LinkedIn Active
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {/* Model Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 hover:border-slate-700 transition-colors"
          >
            <Cpu className="h-3.5 w-3.5 text-purple-400" />
            <span className="font-medium">{models.find((m) => m.id === selectedModel)?.name}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {modelDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Active LiteLLM Engine
              </div>
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setModelDropdownOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-slate-800/80 transition-colors"
                >
                  <div>
                    <div className="font-medium text-white">{model.name}</div>
                    <div className="text-[10px] text-slate-400">{model.speed} • {model.tier}</div>
                  </div>
                  {selectedModel === model.id && (
                    <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-xl">
          <Bell className="h-4 w-4 text-slate-300" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400" />
        </Button>

        {/* Quick New Post */}
        <a href="/studio">
          <Button size="sm" className="gap-1.5 rounded-xl">
            <Plus className="h-4 w-4" />
            <span>New Brief</span>
          </Button>
        </a>
      </div>
    </header>
  );
}
