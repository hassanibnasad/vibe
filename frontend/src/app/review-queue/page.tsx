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

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchReviewQueue()
      .then((data) => {
        setItems(data);
        if (data.length > 0) {
          setEditedReply(data[0].draft_reply);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load review queue. Verify API connection.");
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
      description: `Sent reply to ${itemToApprove.lead_name || "lead"}.`,
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
      // Ignore if user is typing in any input or textarea
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

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">Queue error</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Review Queue"
        description="Replies and drafts below confidence threshold requiring your approval."
        action={
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">A</kbd>
              <span>Approve</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] ml-1.5">R</kbd>
              <span>Reject</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] ml-1.5">E</kbd>
              <span>Edit</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] ml-1.5">X</kbd>
              <span>Select</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] ml-1.5">D</kbd>
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

      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveQueueTab("replies")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeQueueTab === "replies"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Lead Replies ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveQueueTab("posts")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeQueueTab === "posts"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-7 w-7" />
              </div>
            </div>
            <h3 className="mt-5 text-base font-semibold text-foreground">Queue is clear</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
              All recent replies met the confidence threshold. Nothing requires your attention.
            </p>
            <Button variant="outline" size="sm" onClick={loadData} className="gap-2 mt-6">
              <RefreshCw className="h-4 w-4" />
              Check for new items
            </Button>
          </Card>
        </FadeIn>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Queue List with Batch Support */}
          <div className="md:col-span-5 space-y-2.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            {/* Batch Header Bar */}
            <div className="flex items-center justify-between px-2 py-1 bg-surface border border-border rounded-md text-xs">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
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
                    className="h-6 px-2 text-[11px] gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-border"
                  >
                    <Check className="h-3 w-3" />
                    Approve ({selectedIds.size})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchReject}
                    className="h-6 px-2 text-[11px] gap-1 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-border"
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
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    className={`group relative rounded-lg border p-3.5 transition-colors cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-subtle ring-1 ring-primary/20"
                        : "border-border bg-card hover:bg-surface"
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
                        <div className="flex items-center justify-between mb-1.5">
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
                <Card className="border-border bg-card shadow-subtle">
                  <CardHeader className="px-5 py-3 border-b border-border bg-surface/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs border border-primary/20">
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
                        Inbound Message
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="rounded-md border border-border bg-surface p-3.5 text-xs leading-relaxed text-foreground">
                      {currentItem.incoming_message}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              {/* Proposed Reply & Diff Toggle */}
              <FadeIn delay={0.1}>
                <Card className="border-border bg-card shadow-subtle">
                  <CardHeader className="px-5 py-3 border-b border-border bg-surface/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CornerDownRight className="h-4 w-4 text-primary" />
                        <CardTitle className="text-xs font-semibold text-foreground">
                          Proposed Reply
                        </CardTitle>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle Diff / Preview */}
                        <div className="flex items-center rounded-md border border-border bg-muted p-0.5">
                          <button
                            type="button"
                            onClick={() => setViewMode("preview")}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                              viewMode === "preview"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Eye className="h-3 w-3" />
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode("diff")}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                              viewMode === "diff"
                                ? "bg-background text-foreground shadow-xs"
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
                          <Button size="sm" onClick={handleApprove}>
                            Save and approve
                          </Button>
                        </div>
                      </div>
                    ) : viewMode === "diff" ? (
                      /* Diff View Mode */
                      <div className="space-y-3">
                        <div className="rounded-md border border-border bg-surface p-3 text-xs space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-border">
                            <span className="font-mono text-[10px] uppercase font-semibold text-muted-foreground">
                              Diff Inspector
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {diffComparison?.isModified
                                ? "Edited relative to initial generated draft"
                                : "Draft matches original recommendation"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                Original Draft:
                              </span>
                              <div className="p-2.5 rounded bg-rose-500/5 border border-rose-500/20 text-muted-foreground text-xs leading-relaxed">
                                {diffComparison?.original}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                Current Proposed Reply:
                              </span>
                              <div className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/20 text-foreground text-xs leading-relaxed">
                                {diffComparison?.edited}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Standard Preview Mode */
                      <div className="rounded-md border border-border bg-surface p-4 text-xs leading-relaxed text-foreground">
                        {editedReply}
                      </div>
                    )}

                    {/* Actions Bar */}
                    {!isEditing && (
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReject}
                          className="gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 border-border text-xs"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                        <Button size="sm" onClick={handleApprove} className="gap-1.5 text-xs">
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
