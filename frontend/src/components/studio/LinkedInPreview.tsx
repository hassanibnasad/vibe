"use client";

import React, { useState } from "react";
import {
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Send,
  Globe,
  Edit3,
  Check,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface LinkedInPreviewProps {
  content: string;
  onContentChange: (newContent: string) => void;
  isStreaming: boolean;
  authorName?: string;
  authorHeadline?: string;
  variants?: string[];
  selectedVariantIndex?: number;
  onSelectVariant?: (index: number) => void;
}

export function LinkedInPreview({
  content,
  onContentChange,
  isStreaming,
  authorName = "VibeAgent Operator",
  authorHeadline = "Founder & AI Systems Architect",
  variants = [],
  selectedVariantIndex = 0,
  onSelectVariant,
}: LinkedInPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = content ? content.trim().split(/\s+/).length : 0;
  const charCount = content ? content.length : 0;

  return (
    <div className="flex flex-col rounded-2xl border border-border/80 bg-card/85 backdrop-blur-xl shadow-warm-md overflow-hidden transition-all duration-300">
      {/* Top Preview Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 bg-surface/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">LinkedIn Preview</span>
          {variants.length > 1 && onSelectVariant && (
            <div className="flex items-center gap-1.5 ml-2">
              {variants.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectVariant(i)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono transition-all duration-200 ${
                    selectedVariantIndex === i
                      ? "bg-primary text-primary-foreground font-semibold shadow-warm-xs"
                      : "bg-surface/80 text-muted-foreground hover:text-foreground border border-border/60"
                  }`}
                >
                  Var {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono text-muted-foreground/80 tabular-nums">
            {wordCount} words · {charCount} chars
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface/80 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5 text-primary" />
            <span>{isEditing ? "Done" : "Edit"}</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface/80 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Simulated LinkedIn Post Container */}
      <div className="p-6 space-y-4 bg-card/60">
        {/* Author Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-amber-700/20 text-primary font-bold text-sm select-none border border-primary/30 shadow-warm-xs">
              {authorName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-foreground leading-tight hover:underline cursor-pointer">
                  {authorName}
                </span>
                <span className="text-[10px] text-muted-foreground">• 1st</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">{authorHeadline}</p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/75 mt-0.5">
                <span>Just now</span>
                <span>•</span>
                <Globe className="h-2.5 w-2.5" />
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary font-semibold hover:bg-primary/10 rounded-full">
            + Follow
          </Button>
        </div>

        {/* Content Body */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="min-h-[220px] text-xs font-sans leading-relaxed border-border/80 bg-surface/70 focus:ring-1 focus:ring-primary/30"
              placeholder="Edit your post text directly..."
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setIsEditing(false)} className="h-8 text-xs font-medium bg-primary text-primary-foreground">
                Finish editing
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-foreground/95 leading-relaxed whitespace-pre-wrap font-normal select-text">
            {content}
            {isStreaming && (
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary animate-pulse align-middle" />
            )}
          </div>
        )}

        {/* LinkedIn Engagement & Reaction Bar */}
        <div className="pt-3 border-t border-border/70 flex items-center justify-around text-muted-foreground">
          <button
            type="button"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-surface/80 hover:text-foreground transition-colors text-xs font-medium"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>Like</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-surface/80 hover:text-foreground transition-colors text-xs font-medium"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Comment</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-surface/80 hover:text-foreground transition-colors text-xs font-medium"
          >
            <Repeat2 className="h-3.5 w-3.5" />
            <span>Repost</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-surface/80 hover:text-foreground transition-colors text-xs font-medium"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
