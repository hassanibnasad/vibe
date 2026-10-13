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
    <div className="flex flex-col rounded-lg border border-border bg-card shadow-subtle overflow-hidden">
      {/* Top Preview Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface/50 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">LinkedIn Preview</span>
          {variants.length > 1 && onSelectVariant && (
            <div className="flex items-center gap-1 ml-2">
              {variants.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectVariant(i)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedVariantIndex === i
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Var {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono text-muted-foreground tabular-nums">
            {wordCount} words · {charCount} chars
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{isEditing ? "Done" : "Edit"}</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Simulated LinkedIn Post Container */}
      <div className="p-5 space-y-3.5 bg-card">
        {/* Author Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm select-none border border-primary/20">
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
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                <span>Just now</span>
                <span>•</span>
                <Globe className="h-2.5 w-2.5" />
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary font-semibold hover:bg-primary/10">
            + Follow
          </Button>
        </div>

        {/* Content Body */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="min-h-[220px] text-xs font-sans leading-relaxed border-border bg-background focus:ring-1 focus:ring-ring"
              placeholder="Edit your post text directly..."
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setIsEditing(false)} className="h-7 text-xs font-medium">
                Finish editing
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-normal select-text">
            {content}
            {isStreaming && (
              <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-primary animate-pulse align-middle" />
            )}
          </div>
        )}

        {/* LinkedIn Engagement & Reaction Bar */}
        <div className="pt-2 border-t border-border flex items-center justify-around text-muted-foreground">
          <button
            type="button"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded hover:bg-accent/60 transition-colors text-xs font-medium"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>Like</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded hover:bg-accent/60 transition-colors text-xs font-medium"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Comment</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded hover:bg-accent/60 transition-colors text-xs font-medium"
          >
            <Repeat2 className="h-3.5 w-3.5" />
            <span>Repost</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded hover:bg-accent/60 transition-colors text-xs font-medium"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
