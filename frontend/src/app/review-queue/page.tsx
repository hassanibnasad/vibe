"use client";

import React, { useState, useEffect } from "react";
import {
  Inbox,
  Check,
  X,
  Edit3,
  ShieldCheck,
  AlertTriangle,
  User,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ReviewItem, fetchDashboardMetrics } from "@/lib/api-client";
import { formatRelativeTime, formatConfidence } from "@/lib/utils";

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReply, setEditedReply] = useState("");
  const [resolvedCount, setResolvedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [whyExpanded, setWhyExpanded] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchDashboardMetrics()
      .then((data) => {
        setItems(data.review_queue);
        if (data.review_queue.length > 0) {
          setEditedReply(data.review_queue[0].draft_reply);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load review queue items. Verify API gateway connection.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentItem = items[selectedIndex];

  const handleApprove = () => {
    if (!currentItem) return;
    const remaining = items.filter((_, i) => i !== selectedIndex);
    setItems(remaining);
    setResolvedCount((prev) => prev + 1);
    setSelectedIndex(0);
    setIsEditing(false);
    setWhyExpanded(false);
    if (remaining.length > 0) {
      setEditedReply(remaining[0].draft_reply);
    }
  };

  const handleReject = () => {
    if (!currentItem) return;
    const remaining = items.filter((_, i) => i !== selectedIndex);
    setItems(remaining);
    setResolvedCount((prev) => prev + 1);
    setSelectedIndex(0);
    setIsEditing(false);
    setWhyExpanded(false);
    if (remaining.length > 0) {
      setEditedReply(remaining[0].draft_reply);
    }
  };

  const handleSaveEditAndApprove = () => {
    if (!currentItem) return;
    handleApprove();
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return; // Ignore while typing in textarea

      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        handleApprove();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleReject();
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setIsEditing(true);
      } else if (e.key === "j" || e.key === "J" || e.key === "ArrowDown") {
        e.preventDefault();
        if (items.length > 0) {
          const nextIdx = (selectedIndex + 1) % items.length;
          setSelectedIndex(nextIdx);
          setEditedReply(items[nextIdx].draft_reply);
          setWhyExpanded(false);
        }
      } else if (e.key === "k" || e.key === "K" || e.key === "ArrowUp") {
        e.preventDefault();
        if (items.length > 0) {
          const prevIdx = (selectedIndex - 1 + items.length) % items.length;
          setSelectedIndex(prevIdx);
          setEditedReply(items[prevIdx].draft_reply);
          setWhyExpanded(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, items, isEditing]);

  // 1. Loading State
  if (loading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
          <div className="md:col-span-7">
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-3 max-w-md mx-auto text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <div className="font-semibold text-sm">Review queue error</div>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5 mt-2">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry request</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header Bar with Shortcut Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Inbox className="h-4 w-4 text-foreground" />
            <span>Review queue</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated replies below the 85% confidence threshold requiring operator authorization.
          </p>
        </div>

        {/* Status & Shortcuts Indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Shortcuts:</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">[A] Approve</kbd>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">[R] Reject</kbd>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">[E] Edit</kbd>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">[J/K] Navigate</kbd>
          </div>

          <Badge variant="outline" className="text-xs font-mono h-6 px-2.5 tabular-nums">
            {resolvedCount} resolved this session
          </Badge>
        </div>
      </div>

      {/* Main Split-Pane Interface */}
      {items.length === 0 ? (
        // 3. Clean Empty State
        <Card className="p-12 text-center max-w-lg mx-auto">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">Review queue is clear</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-normal">
            All recent inbound comments and messages met the automated confidence threshold (score &ge; 85%).
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Check for new items</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Pane: Queue List (5 cols) */}
          <div className="md:col-span-5 space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-1">
              <span>Pending authorization ({items.length})</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help flex items-center gap-1">
                    <span>Threshold: 85%</span>
                    <HelpCircle className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span>Replies with score &lt; 0.85 pause for operator sign-off</span>
                </TooltipContent>
              </Tooltip>
            </div>

            {items.map((item, index) => {
              const isSelected = index === selectedIndex;
              const conf = formatConfidence(item.confidence_score, 0.85);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedIndex(index);
                    setEditedReply(item.draft_reply);
                    setIsEditing(false);
                    setWhyExpanded(false);
                  }}
                  className={`cursor-pointer rounded-lg border p-3 text-xs transition-colors ${
                    isSelected
                      ? "border-primary bg-accent/60 text-accent-foreground"
                      : "border-border bg-card hover:bg-muted/40 text-card-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 font-medium">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{item.lead_name}</span>
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Badge variant={conf.variant} className="font-mono text-[10px] py-0 h-4 tabular-nums">
                            {conf.percentage} · {conf.label}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <span>{conf.description} (Raw: {conf.raw})</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-2 italic mb-2">
                    &ldquo;{item.incoming_message}&rdquo;
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span>LinkedIn</span>
                    <span className="tabular-nums">{formatRelativeTime(item.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Pane: Triage & Inspection Pane (7 cols) */}
          {currentItem && (
            <div className="md:col-span-7 space-y-4">
              {/* Inbound Interaction Card */}
              <Card>
                <CardHeader className="p-3 pb-2 border-b border-border flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-xs font-semibold">{currentItem.lead_name}</CardTitle>
                      <CardDescription className="text-[10px]">
                        {currentItem.lead_headline || "LinkedIn member"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-0 h-4 font-medium">
                    LinkedIn
                  </Badge>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="text-[10px] font-semibold text-muted-foreground mb-1">
                    Inbound message
                  </div>
                  <div className="rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed">
                    {currentItem.incoming_message}
                  </div>
                </CardContent>
              </Card>

              {/* Proposed Reply & Action Panel */}
              <Card>
                <CardHeader className="p-3 pb-2 border-b border-border flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xs font-semibold">Proposed reply</CardTitle>
                    {(() => {
                      const conf = formatConfidence(currentItem.confidence_score, 0.85);
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Badge variant={conf.variant} className="text-[10px] py-0 h-4 font-mono tabular-nums">
                                {conf.percentage} · {conf.label}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <span>{conf.description} (Raw score: {conf.raw})</span>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                  </div>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit draft</span>
                    </Button>
                  )}
                </CardHeader>

                <CardContent className="p-3 space-y-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="reply-edit" className="text-xs">Edit reply content</Label>
                      <Textarea
                        id="reply-edit"
                        value={editedReply}
                        onChange={(e) => setEditedReply(e.target.value)}
                        className="min-h-[100px] text-xs font-sans"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditedReply(currentItem.draft_reply);
                            setIsEditing(false);
                          }}
                          className="h-7 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEditAndApprove}
                          className="h-7 text-xs"
                        >
                          Save and approve
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border border-border bg-background p-3 text-xs leading-relaxed">
                      {editedReply}
                    </div>
                  )}

                  {/* Problem 7: Collapsible "Why this reply?" — collapsed by default so it doesn't compete with actual reply */}
                  <div className="rounded-md border border-border bg-muted/20 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setWhyExpanded(!whyExpanded)}
                      className="w-full flex items-center justify-between p-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-medium">
                        <Sparkles className="h-3.5 w-3.5 text-brand-accent" />
                        <span>Why this reply?</span>
                      </div>
                      {whyExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>

                    {whyExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-border/50 text-[11px] text-muted-foreground space-y-2">
                        <div>
                          <span className="font-semibold text-foreground">Grounding source: </span>
                          <span>Brand guidelines & product architecture documentation.</span>
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Rationale: </span>
                          <span>
                            Directly answers technical self-hosting and Hatchet workflow integration questions while offering a follow-up spec walkthrough.
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Review reason: </span>
                          <span>
                            Score ({currentItem.confidence_score.toFixed(2)}) is below 0.85 threshold due to domain-specific infrastructure keywords.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Single Clear Action Hierarchy: "Approve and dispatch" is primary, "Reject reply" is outline/secondary */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReject}
                      className="gap-1.5 h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-border"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Reject reply</span>
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleApprove}
                      className="gap-1.5 h-8 text-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve and dispatch</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
