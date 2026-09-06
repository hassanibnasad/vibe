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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewItem, fetchReviewQueue, approveReviewItem, rejectReviewItem } from "@/lib/api-client";
import { formatConfidence } from "@/lib/utils";
import { FadeIn, AnimatePresence } from "@/lib/motion";
import { motion } from "framer-motion";

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReply, setEditedReply] = useState("");
  const [resolvedCount, setResolvedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
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
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentItem = items[selectedIndex];

  const handleApprove = async () => {
    if (!currentItem) return;
    try {
      await approveReviewItem(currentItem.id, isEditing ? editedReply : undefined);
    } catch {
      // Continue with optimistic UI even if API fails
    }
    const remaining = items.filter((_, i) => i !== selectedIndex);
    setItems(remaining);
    setResolvedCount((prev) => prev + 1);
    setSelectedIndex(0);
    setIsEditing(false);
    if (remaining.length > 0) {
      setEditedReply(remaining[0].draft_reply);
    }
  };

  const handleReject = async () => {
    if (!currentItem) return;
    try {
      await rejectReviewItem(currentItem.id);
    } catch {
      // Continue with optimistic UI
    }
    const remaining = items.filter((_, i) => i !== selectedIndex);
    setItems(remaining);
    setResolvedCount((prev) => prev + 1);
    setSelectedIndex(0);
    setIsEditing(false);
    if (remaining.length > 0) {
      setEditedReply(remaining[0].draft_reply);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return;

      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        handleApprove();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleReject();
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setIsEditing(true);
      } else if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        if (items.length > 0) {
          const next = (selectedIndex + 1) % items.length;
          setSelectedIndex(next);
          setEditedReply(items[next].draft_reply);
        }
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        if (items.length > 0) {
          const prev = (selectedIndex - 1 + items.length) % items.length;
          setSelectedIndex(prev);
          setEditedReply(items[prev].draft_reply);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, items, isEditing]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Review queue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Replies below the confidence threshold requiring your approval.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">A</kbd>
              <span>Approve</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] ml-2">R</kbd>
              <span>Reject</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] ml-2">E</kbd>
              <span>Edit</span>
            </div>
            {resolvedCount > 0 && (
              <Badge variant="outline" className="font-mono tabular-nums">
                {resolvedCount} resolved
              </Badge>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Empty State */}
      {items.length === 0 ? (
        <FadeIn delay={0.1}>
          <Card className="p-16 text-center max-w-lg mx-auto">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
          {/* Left: Queue List */}
          <div className="md:col-span-5 space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            <div className="text-xs text-muted-foreground px-1 pb-2">
              {items.length} pending
            </div>
            <AnimatePresence>
              {items.map((item, index) => {
                const isSelected = index === selectedIndex;
                const conf = formatConfidence(item.confidence_score, 0.85);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    onClick={() => {
                      setSelectedIndex(index);
                      setEditedReply(item.draft_reply);
                      setIsEditing(false);
                    }}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                      isSelected
                        ? "border-primary bg-accent/60"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{item.lead_name}</span>
                      </div>
                      <Badge variant={conf.variant} className="font-mono text-[10px] tabular-nums">
                        {conf.percentage}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.incoming_message}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Right: Triage Pane */}
          {currentItem && (
            <div className="md:col-span-7 space-y-5">
              {/* Inbound Message */}
              <FadeIn>
                <Card>
                  <CardHeader className="px-6 py-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-sm">{currentItem.lead_name}</CardTitle>
                          {currentItem.lead_headline && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {currentItem.lead_headline}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed">
                      {currentItem.incoming_message}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              {/* Draft Reply & Actions */}
              <FadeIn delay={0.1}>
                <Card>
                  <CardHeader className="px-6 py-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Proposed reply</CardTitle>
                      {!isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                          className="gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Label htmlFor="reply-edit" className="text-sm">
                          Edit reply
                        </Label>
                        <Textarea
                          id="reply-edit"
                          value={editedReply}
                          onChange={(e) => setEditedReply(e.target.value)}
                          className="min-h-[120px] text-sm"
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
                    ) : (
                      <div className="rounded-lg border border-border bg-background p-4 text-sm leading-relaxed">
                        {editedReply}
                      </div>
                    )}

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReject}
                          className="gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-border"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                        <Button size="sm" onClick={handleApprove} className="gap-2">
                          <Check className="h-4 w-4" />
                          Approve and dispatch
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
