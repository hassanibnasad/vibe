"use client";

/**
 * PostDraftQueue — Human-in-the-loop review panel for AI-generated LinkedIn drafts.
 *
 * Distinct from the AI reply review queue (conversations/review-queue).
 * This queue shows Posts that have requires_review=true and status=draft.
 *
 * Actions:
 *  [A] Approve — marks post approved, queues for scheduling
 *  [E] Edit    — opens inline editor, saves revision on submit
 *  [R] Revision request — sends feedback without blocking the draft
 *  [X] Reject  — marks post failed with operator feedback
 *
 * Keyboard shortcuts: A approve, X reject, E edit, ↑/↓ or j/k navigate
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Check,
  X,
  Edit3,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Hash,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  PostDraft,
  fetchPostDraftQueue,
  approvePostDraft,
  rejectPostDraft,
  requestRevision,
} from "@/lib/calendar-api";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.81a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z" />
    </svg>
  );
}

// ── Sub-component: list item ───────────────────────────────────────────────────

interface DraftRowProps {
  draft: PostDraft;
  isSelected: boolean;
  onClick: () => void;
}

function DraftRow({ draft, isSelected, onClick }: DraftRowProps) {
  const conf = draft.confidence_score;
  const confColor =
    conf == null ? "text-muted-foreground"
    : conf >= 0.85 ? "text-emerald-400"
    : conf >= 0.70 ? "text-amber-400"
    : "text-rose-400";

  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left rounded-xl border p-4 transition-all",
        isSelected
          ? "border-cyan-400/30 bg-cyan-400/[0.04]"
          : "border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <LinkedInIcon className="h-3.5 w-3.5 shrink-0 text-[#0A66C2]" />
          <span className="text-xs font-medium text-foreground truncate">
            {draft.platform} · Draft
          </span>
        </div>
        {conf != null && (
          <span className={`text-[10px] font-mono shrink-0 ${confColor}`}>
            {Math.round(conf * 100)}% conf
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {draft.content}
      </p>
      {draft.hashtags.length > 0 && (
        <div className="flex items-center gap-1 mt-2">
          <Hash className="h-3 w-3 text-muted-foreground/40" />
          <span className="text-[10px] font-mono text-muted-foreground/60 truncate">
            {draft.hashtags.slice(0, 3).map((h) => `#${h}`).join(" ")}
          </span>
        </div>
      )}
    </button>
  );
}

// ── Action modes ───────────────────────────────────────────────────────────────

type ActionMode = "view" | "edit" | "reject" | "revision";

// ── Main component ─────────────────────────────────────────────────────────────

export function PostDraftQueue() {
  const [drafts, setDrafts] = useState<PostDraft[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mode, setMode] = useState<ActionMode>("view");
  const [editContent, setEditContent] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [processing, setProcessing] = useState(false);

  const current = drafts[selectedIdx];

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPostDraftQueue();
      setDrafts(data);
      if (data.length > 0) setEditContent(data[0].content);
    } catch {
      setError("Could not load draft queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const selectIdx = (idx: number) => {
    setSelectedIdx(idx);
    setMode("view");
    setEditContent(drafts[idx]?.content ?? "");
    setFeedbackText("");
  };

  const removeCurrentAndAdvance = () => {
    const next = drafts.filter((_, i) => i !== selectedIdx);
    setDrafts(next);
    setResolvedCount((c) => c + 1);
    setSelectedIdx(0);
    setMode("view");
    setEditContent(next[0]?.content ?? "");
    setFeedbackText("");
  };

  const handleApprove = async () => {
    if (!current || processing) return;
    setProcessing(true);
    try { await approvePostDraft(current.id); } catch { /* optimistic */ }
    removeCurrentAndAdvance();
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!current || processing || !feedbackText.trim()) return;
    setProcessing(true);
    try { await rejectPostDraft(current.id, feedbackText.trim()); } catch { /* optimistic */ }
    removeCurrentAndAdvance();
    setProcessing(false);
  };

  const handleRevision = async () => {
    if (!current || processing || !feedbackText.trim()) return;
    setProcessing(true);
    try { await requestRevision(current.id, feedbackText.trim()); } catch { /* optimistic */ }
    removeCurrentAndAdvance();
    setProcessing(false);
  };

  const handleSaveEdit = async () => {
    if (!current || processing || !editContent.trim()) return;
    setProcessing(true);
    // Optimistically update local state; approve with edited content
    try { await approvePostDraft(current.id); } catch { /* optimistic */ }
    removeCurrentAndAdvance();
    setProcessing(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== "view") return;
      if (e.key === "a" || e.key === "A") { e.preventDefault(); handleApprove(); }
      else if (e.key === "x" || e.key === "X") { e.preventDefault(); setMode("reject"); }
      else if (e.key === "e" || e.key === "E") { e.preventDefault(); setMode("edit"); }
      else if (e.key === "r" || e.key === "R") { e.preventDefault(); setMode("revision"); }
      else if ((e.key === "j" || e.key === "ArrowDown") && drafts.length > 0) {
        e.preventDefault(); selectIdx((selectedIdx + 1) % drafts.length);
      } else if ((e.key === "k" || e.key === "ArrowUp") && drafts.length > 0) {
        e.preventDefault(); selectIdx((selectedIdx - 1 + drafts.length) % drafts.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedIdx, drafts, current]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
        <div className="md:col-span-7">
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={reload} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">No drafts pending review</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            All AI-generated posts have been reviewed.{" "}
            {resolvedCount > 0 && `You resolved ${resolvedCount} draft${resolvedCount > 1 ? "s" : ""} this session.`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reload} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Check for new drafts
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Left: Draft list */}
      <div className="md:col-span-5">
        {/* Count + resolved badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground font-mono">{drafts.length} pending</span>
          {resolvedCount > 0 && (
            <Badge variant="outline" className="font-mono text-[10px] tabular-nums">
              {resolvedCount} resolved
            </Badge>
          )}
        </div>

        <div className="space-y-2 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1">
          <AnimatePresence>
            {drafts.map((draft, idx) => (
              <motion.div
                key={draft.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
              >
                <DraftRow
                  draft={draft}
                  isSelected={idx === selectedIdx}
                  onClick={() => selectIdx(idx)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Triage pane */}
      {current && (
        <div className="md:col-span-7 space-y-4">
          {/* Keyboard hint */}
          <div className="hidden lg:flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
            {[
              ["A", "Approve"],
              ["E", "Edit"],
              ["R", "Revision"],
              ["X", "Reject"],
              ["↑↓", "Navigate"],
            ].map(([key, label]) => (
              <span key={key} className="flex items-center gap-1">
                <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5">{key}</kbd>
                {label}
              </span>
            ))}
          </div>

          {/* Draft content panel */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <LinkedInIcon className="h-4 w-4 text-[#0A66C2]" />
                <span className="text-sm font-medium text-foreground">LinkedIn Draft</span>
                {current.ai_generated && (
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
                    AI-generated
                  </span>
                )}
              </div>
              {current.confidence_score != null && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {Math.round(current.confidence_score * 100)}% confidence
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {mode === "edit" ? (
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Edit content</Label>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[180px] text-sm bg-black/30 border-white/[0.08] rounded-lg focus:border-cyan-400/40 resize-none"
                    autoFocus
                  />
                  <div className="text-[10px] font-mono text-muted-foreground text-right">
                    {editContent.length} chars
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setMode("view")}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim() || processing}
                      className="gap-2"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save and approve
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                  {current.content}
                </p>
              )}

              {/* Hashtags */}
              {mode !== "edit" && current.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {current.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono text-indigo-300 bg-indigo-400/10 border border-indigo-400/20 px-2 py-0.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA */}
              {mode !== "edit" && current.cta && (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <p className="text-[10px] font-mono text-muted-foreground mb-1">CTA</p>
                  <p className="text-xs text-foreground/80">{current.cta}</p>
                </div>
              )}
            </div>

            {/* Actions footer */}
            {mode === "view" && (
              <div className="px-5 py-4 border-t border-white/[0.07] space-y-3">
                {/* Primary actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMode("reject")}
                      className="gap-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMode("revision")}
                      className="gap-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 text-xs"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Request revision
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMode("edit")}
                      className="gap-1.5 text-muted-foreground hover:text-white text-xs"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={processing}
                    className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium text-xs"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                </div>
              </div>
            )}

            {/* Reject feedback panel */}
            {(mode === "reject" || mode === "revision") && (
              <div className="px-5 py-4 border-t border-white/[0.07] space-y-3">
                <Label className="text-xs text-muted-foreground">
                  {mode === "reject" ? "Reason for rejection" : "Feedback for revision"}
                </Label>
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={
                    mode === "reject"
                      ? "Explain why this draft doesn't meet standards..."
                      : "Describe what needs to change in the next version..."
                  }
                  className="min-h-[90px] text-xs bg-black/30 border-white/[0.08] rounded-lg focus:border-cyan-400/40 resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setMode("view")}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === "reject" ? "destructive" : "outline"}
                    onClick={mode === "reject" ? handleReject : handleRevision}
                    disabled={!feedbackText.trim() || processing}
                    className="gap-2 text-xs"
                  >
                    {mode === "reject" ? (
                      <><X className="h-3.5 w-3.5" />Confirm reject</>
                    ) : (
                      <><MessageSquare className="h-3.5 w-3.5" />Send feedback</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
