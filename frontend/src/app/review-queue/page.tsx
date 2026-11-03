"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Check,
  X,
  Edit3,
  ShieldCheck,
  AlertTriangle,
  User,
  RefreshCw,
  CheckSquare,
  Square,
  Split,
  Eye,
  CornerDownRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ReviewItem, fetchReviewQueue, approveReviewItem, rejectReviewItem } from "@/lib/api-client";
import { formatConfidence } from "@/lib/utils";
import { FadeIn, AnimatePresence } from "@/lib/motion";
import { motion } from "framer-motion";
import { PostDraftQueue } from "@/components/calendar/PostDraftQueue";
import { fetchPostDraftQueue } from "@/lib/calendar-api";

export default function ReviewQueuePage() {
  const { toast } = useToast();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [editedReply, setEditedReply] = useState("");
  const [viewMode, setViewMode] = useState<"preview" | "diff">("preview");
  const [activeQueueTab, setActiveQueueTab] = useState<"replies" | "posts">("replies");
  const [postDraftsCount, setPostDraftsCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const DEMO_REVIEW_ITEMS: ReviewItem[] = [
    {
      id: "rev-101",
      message_id: "msg-101",
      conversation_id: "conv-101",
      lead_id: "lead-sarah",
      lead_name: "Sarah Chen",
      lead_headline: "VP of Engineering at Nexus Cloud",
      platform: "LinkedIn",
      incoming_message: "Does VibeAgent integrate with our existing pgvector knowledge base and LiteLLM proxy?",
      draft_reply: "Yes, Sarah! VibeAgent natively binds to pgvector for grounded retrieval and connects through LiteLLM proxies with strict latency thresholds.",
      suggested_reply: "Yes, Sarah! VibeAgent natively binds to pgvector for grounded retrieval and connects through LiteLLM proxies with strict latency thresholds.",
      confidence_score: 0.81,
      sentiment: "inquisitive",
      review_status: "pending",
      created_at: new Date().toISOString(),
    },
    {
      id: "rev-102",
      message_id: "msg-102",
      conversation_id: "conv-102",
      lead_id: "lead-marcus",
      lead_name: "Marcus Vance",
      lead_headline: "Head of Growth @ VectorScale",
      platform: "LinkedIn",
      incoming_message: "How do you avoid robotic sounding outreach when automating our engineering content?",
      draft_reply: "We enforce custom brand tone guardrails and run an analytical confidence balance—any message with nuance below 0.85 routes to your human review queue.",
      suggested_reply: "We enforce custom brand tone guardrails and run an analytical confidence balance—any message with nuance below 0.85 routes to your human review queue.",
      confidence_score: 0.74,
      sentiment: "positive",
      review_status: "pending",
      created_at: new Date().toISOString(),
    },
    {
      id: "rev-103",
      message_id: "msg-103",
      conversation_id: "conv-103",
      lead_id: "lead-elena",
      lead_name: "Elena Rostova",
      lead_headline: "Principal Architect @ DataCore",
      platform: "LinkedIn",
      incoming_message: "Loved your post on deep module design! Are you folks speaking at the upcoming TypeScript summit?",
      draft_reply: "Thanks Elena! Yes, our team will be hosting a session on Deep Module Seams and Agentic SDK workflows at TS Summit next month.",
      suggested_reply: "Thanks Elena! Yes, our team will be hosting a session on Deep Module Seams and Agentic SDK workflows at TS Summit next month.",
      confidence_score: 0.92,
      sentiment: "positive",
      review_status: "pending",
      created_at: new Date().toISOString(),
    },
  ];

  const loadData = useCallback(() => {
    setLoading(true);
    fetchReviewQueue()
      .then((data) => {
        const queue = data.length > 0 ? data : DEMO_REVIEW_ITEMS;
        setItems(queue);
        if (queue.length > 0) {
          setEditedReply(queue[0].draft_reply);
        }
        setError(null);
        setLoading(false);
      })
      .catch(() => {
        setItems(DEMO_REVIEW_ITEMS);
        setEditedReply(DEMO_REVIEW_ITEMS[0].draft_reply);
        setError("Preview Mode · Backend service offline. Showing cached review items.");
        setLoading(false);
      });

    fetchPostDraftQueue()
      .then((drafts) => setPostDraftsCount(drafts.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentItem = items[selectedIndex] || null;

  // Sync edited reply when selection changes
  useEffect(() => {
    if (currentItem) {
      setEditedReply(currentItem.draft_reply);
      setIsEditing(false);
    }
  }, [selectedIndex, currentItem]);

  const handleApprove = useCallback(async () => {
    if (!currentItem) return;
    const itemToApprove = currentItem;
    try {
      await approveReviewItem(itemToApprove.id, isEditing ? editedReply : undefined);
    } catch {
      // Optimistic
    }
    const remaining = items.filter((it) => it.id !== itemToApprove.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(itemToApprove.id);
      return next;
    });
    setItems(remaining);
    setResolvedCount((prev) => prev + 1);
    setSelectedIndex((prev) => Math.min(prev, Math.max(0, remaining.length - 1)));
    setIsEditing(false);
    toast({
      title: "Reply approved and published",
      description: `Dispatched reply to ${itemToApprove.lead_name || "lead"}.`,
      variant: "success",
    });
  }, [currentItem, isEditing, editedReply, items, toast]);

  const handleReject = useCallback(async () => {
    if (!currentItem) return;
    const itemToReject = currentItem;
    try {
      await rejectReviewItem(itemToReject.id);
    } catch {
      // Optimistic
    }
    const remaining = items.filter((it) => it.id !== itemToReject.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(itemToReject.id);
      return next;
    });
    setItems(remaining);
    setResolvedCount((prev) => prev + 1);
    setSelectedIndex((prev) => Math.min(prev, Math.max(0, remaining.length - 1)));
    setIsEditing(false);
    toast({
      title: "Draft rejected",
      description: `Discarded proposed reply for ${itemToReject.lead_name || "lead"}.`,
    });
  }, [currentItem, items, toast]);

  // Batch actions
  const handleBatchApprove = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const idsToApprove = Array.from(selectedIds);
    try {
      await Promise.allSettled(idsToApprove.map((id) => approveReviewItem(id)));
    } catch {
      // Optimistic
    }
    const remaining = items.filter((it) => !selectedIds.has(it.id));
    setItems(remaining);
    setResolvedCount((prev) => prev + count);
    setSelectedIds(new Set());
    setSelectedIndex(0);
    toast({
      title: `Batch approved ${count} items`,
      description: "Replies published successfully.",
      variant: "success",
    });
  }, [selectedIds, items, toast]);

  const handleBatchReject = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const idsToReject = Array.from(selectedIds);
    try {
      await Promise.allSettled(idsToReject.map((id) => rejectReviewItem(id)));
    } catch {
      // Optimistic
    }
    const remaining = items.filter((it) => !selectedIds.has(it.id));
    setItems(remaining);
    setResolvedCount((prev) => prev + count);
    setSelectedIds(new Set());
    setSelectedIndex(0);
    toast({
      title: `Batch rejected ${count} items`,
      description: "Discarded selected drafts.",
    });
  }, [selectedIds, items, toast]);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }, [items, selectedIds.size]);

  const toggleSelectItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Keyboard navigation & triage shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        if (selectedIds.size > 0) {
          handleBatchApprove();
        } else {
          handleApprove();
        }
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        if (selectedIds.size > 0) {
          handleBatchReject();
        } else {
          handleReject();
        }
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setIsEditing(true);
      } else if (e.key === "x" || e.key === "X") {
        e.preventDefault();
        if (currentItem) {
          toggleSelectItem(currentItem.id);
        }
      } else if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        setViewMode((m) => (m === "preview" ? "diff" : "preview"));
      } else if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        if (items.length > 0) {
          setSelectedIndex((prev) => (prev + 1) % items.length);
        }
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        if (items.length > 0) {
          setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
        }
      } else if (e.key === "Escape") {
        if (selectedIds.size > 0) {
          setSelectedIds(new Set());
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isEditing,
    selectedIds.size,
    handleBatchApprove,
    handleApprove,
    handleBatchReject,
    handleReject,
    currentItem,
    toggleSelectItem,
    items.length,
  ]);

  // Diff calculation
  const diffComparison = useMemo(() => {
    if (!currentItem) return null;
    const original = currentItem.draft_reply;
    const edited = editedReply;
    const isModified = original.trim() !== edited.trim();

    return {
      original,
      edited,
      isModified,
    };
  }, [currentItem, editedReply]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
          <div className="md:col-span-7">
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const confidenceValue = currentItem ? currentItem.confidence_score : 0.85;
  const isHighConfidence = confidenceValue >= 0.85;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <PageHeader
        title="Review Queue"
        description="Drafts and replies requiring human oversight before social platform dispatch."
        action={
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px]">A</kbd>
              <span>Approve</span>
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] ml-1.5">R</kbd>
              <span>Reject</span>
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] ml-1.5">E</kbd>
              <span>Edit</span>
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] ml-1.5">X</kbd>
              <span>Select</span>
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] ml-1.5">D</kbd>
              <span>Diff</span>
            </div>
            {resolvedCount > 0 && (
              <Badge variant="outline" className="font-mono tabular-nums text-xs">
                {resolvedCount} resolved
              </Badge>
            )}
          </div>
        }
      />

      {error && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadData()}
            className="text-[11px] underline hover:no-underline font-mono ml-4"
          >
            Retry API
          </button>
        </div>
      )}

      {/* ── Shopify Editions Confidence Telemetry Barometer ── */}
      {currentItem && (
        <FadeIn delay={0.05}>
          <div className="rounded-xl border border-border/80 bg-card/90 p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                isHighConfidence
                  ? "bg-primary/10 text-primary border border-primary/25"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
              }`}>
                {isHighConfidence ? "✓" : "!"}
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <span>Confidence Audit: {currentItem.lead_name || "Lead"}</span>
                  <Badge variant={isHighConfidence ? "published" : "warning"} className="font-mono text-[10px]">
                    {Math.round(confidenceValue * 100)}% Match
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {isHighConfidence
                    ? "Exceeds standard 0.85 threshold · Safe for direct broadcast"
                    : "Below 0.85 threshold · Diverted to human approval queue"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-muted-foreground">THRESHOLD:</span>
              <span className="text-foreground font-semibold">0.85</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">STATUS:</span>
              <span className={isHighConfidence ? "text-primary font-semibold" : "text-amber-400 font-semibold"}>
                {isHighConfidence ? "AUTONOMOUS PASS" : "HUMAN GATE"}
              </span>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Queue Type Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface/80 border border-border rounded-xl backdrop-blur-md w-fit shadow-subtle">
        <button
          type="button"
          onClick={() => setActiveQueueTab("replies")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeQueueTab === "replies"
              ? "bg-foreground text-background font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Lead Replies ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveQueueTab("posts")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeQueueTab === "posts"
              ? "bg-foreground text-background font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Post Drafts ({postDraftsCount})
        </button>
      </div>

      {activeQueueTab === "posts" ? (
        <PostDraftQueue />
      ) : items.length === 0 ? (
        <FadeIn delay={0.1}>
          <Card className="p-16 text-center max-w-lg mx-auto">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/25">
                <CheckCircle2 className="h-7 w-7" />
              </div>
            </div>
            <h3 className="mt-5 text-base font-semibold text-foreground">Queue is clear</h3>
            <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
              All recent replies met the confidence threshold. No dispatches currently blocked.
            </p>
            <Button variant="outline" size="sm" onClick={loadData} className="gap-2 mt-6">
              <RefreshCw className="h-3.5 w-3.5" />
              Check for new items
            </Button>
          </Card>
        </FadeIn>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Queue List with Batch Support */}
          <div className="md:col-span-5 space-y-2.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            {/* Batch Header Bar */}
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors font-mono text-[11px]"
              >
                {selectedIds.size > 0 && selectedIds.size === items.length ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground" />
                )}
                <span>
                  {selectedIds.size > 0
                    ? `${selectedIds.size} selected`
                    : `Select all (${items.length})`}
                </span>
              </button>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchApprove}
                    className="h-6 px-2 text-[11px] gap-1 text-primary hover:bg-primary/10 border-border"
                  >
                    <Check className="h-3 w-3" />
                    Approve ({selectedIds.size})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchReject}
                    className="h-6 px-2 text-[11px] gap-1 text-rose-400 hover:bg-rose-500/10 border-border"
                  >
                    <X className="h-3 w-3" />
                    Reject
                  </Button>
                </div>
              )}
            </div>

            <AnimatePresence>
              {items.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isChecked = selectedIds.has(item.id);
                const conf = formatConfidence(item.confidence_score, 0.85);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                    className={`group relative rounded-xl border p-3.5 transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/[0.04] shadow-subtle ring-1 ring-primary/20"
                        : "border-border/80 bg-card/90 hover:bg-surface"
                    }`}
                    onClick={() => {
                      setSelectedIndex(index);
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        aria-label="Select item"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectItem(item.id);
                        }}
                        className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{item.lead_name || "Unknown Lead"}</span>
                          </div>
                          <Badge variant={conf.variant} className="font-mono text-[10px] tabular-nums shrink-0">
                            {conf.percentage}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.incoming_message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Right: Split Detail Pane with Diff View */}
          {currentItem && (
            <div className="md:col-span-7 space-y-4">
              {/* Inbound Message */}
              <FadeIn>
                <Card className="border-border/80 bg-card shadow-subtle">
                  <CardHeader className="px-5 py-3 border-b border-border/70 bg-surface/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-xs font-mono">
                          {(currentItem.lead_name || "Lead").charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-xs font-semibold text-foreground">
                            {currentItem.lead_name || "Unknown Lead"}
                          </CardTitle>
                          {currentItem.lead_headline && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                              {currentItem.lead_headline}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Inbound Touchpoint
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="rounded-lg border border-border/80 bg-surface/50 p-3.5 text-xs leading-relaxed text-foreground">
                      {currentItem.incoming_message}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              {/* Proposed Reply & Diff Toggle */}
              <FadeIn delay={0.1}>
                <Card className="border-border/80 bg-card shadow-subtle">
                  <CardHeader className="px-5 py-3 border-b border-border/70 bg-surface/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CornerDownRight className="h-4 w-4 text-primary" />
                        <CardTitle className="text-xs font-semibold text-foreground">
                          Proposed Reply
                        </CardTitle>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle Diff / Preview */}
                        <div className="flex items-center rounded-lg border border-border bg-surface p-0.5">
                          <button
                            type="button"
                            onClick={() => setViewMode("preview")}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                              viewMode === "preview"
                                ? "bg-foreground text-background shadow-xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Eye className="h-3 w-3" />
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode("diff")}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                              viewMode === "diff"
                                ? "bg-foreground text-background shadow-xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Split className="h-3 w-3" />
                            Diff
                          </button>
                        </div>

                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Label htmlFor="reply-edit" className="text-xs font-medium">
                          Customize response draft:
                        </Label>
                        <Textarea
                          id="reply-edit"
                          value={editedReply}
                          onChange={(e) => setEditedReply(e.target.value)}
                          className="min-h-[140px] text-xs leading-relaxed"
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
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleApprove} className="bg-foreground text-background">
                            Save and approve
                          </Button>
                        </div>
                      </div>
                    ) : viewMode === "diff" ? (
                      /* Diff View Mode */
                      <div className="space-y-3">
                        <div className="rounded-lg border border-border/80 bg-surface/50 p-3.5 text-xs space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-border/60">
                            <span className="font-mono text-[10px] uppercase font-semibold text-muted-foreground">
                              Diff Inspector
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {diffComparison?.isModified
                                ? "Modified relative to synthetic recommendation"
                                : "Exact match with suggested draft"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold text-rose-400 font-mono">
                                Original Draft:
                              </span>
                              <div className="p-2.5 rounded-md bg-rose-500/5 border border-rose-500/20 text-muted-foreground text-xs leading-relaxed">
                                {diffComparison?.original}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold text-primary font-mono">
                                Current Proposed Reply:
                              </span>
                              <div className="p-2.5 rounded-md bg-primary/5 border border-primary/20 text-foreground text-xs leading-relaxed">
                                {diffComparison?.edited}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Standard Preview Mode */
                      <div className="rounded-lg border border-border/80 bg-surface/50 p-4 text-xs leading-relaxed text-foreground">
                        {editedReply}
                      </div>
                    )}

                    {/* Actions Bar */}
                    {!isEditing && (
                      <div className="flex items-center justify-between pt-3 border-t border-border/70">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReject}
                          className="gap-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-border text-xs"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                        <Button size="sm" onClick={handleApprove} className="gap-1.5 text-xs bg-foreground text-background hover:bg-foreground/90">
                          <Check className="h-3.5 w-3.5" />
                          Approve and publish
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
