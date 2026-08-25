"use client";

import React, { useState, useEffect } from "react";
import {
  Inbox,
  Check,
  X,
  Edit3,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  User,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ReviewItem, fetchDashboardMetrics } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/utils";

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReply, setEditedReply] = useState("");
  const [resolvedCount, setResolvedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardMetrics().then((data) => {
      setItems(data.review_queue);
      if (data.review_queue.length > 0) {
        setEditedReply(data.review_queue[0].draft_reply);
      }
      setLoading(false);
    });
  }, []);

  const currentItem = items[selectedIndex];

  const handleApprove = () => {
    if (!currentItem) return;
    const remaining = items.filter((_, i) => i !== selectedIndex);
    setItems(remaining);
    setResolvedCount((prev) => prev + 1);
    setSelectedIndex(0);
    setIsEditing(false);
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
      if (isEditing) return; // Don't trigger shortcuts while typing

      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        handleApprove();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleReject();
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setIsEditing(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-purple-400">
          <Inbox className="h-6 w-6 animate-pulse" />
          <span className="text-sm font-medium">Loading Review Queue...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Inbox className="h-6 w-6 text-purple-400" />
            <span>Human-in-the-Loop Review Queue</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review and approve AI draft replies where model confidence falls below 0.85 threshold.
          </p>
        </div>

        {/* Keyboard Shortcuts Hint Pill */}
        <div className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-slate-400">
          <span>Shortcuts:</span>
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-200 border border-slate-700">A</kbd>
          <span>Approve</span>
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-200 border border-slate-700">E</kbd>
          <span>Edit</span>
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-200 border border-slate-700">R</kbd>
          <span>Reject</span>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Review Queue is Clear!</h3>
            <p className="text-sm text-slate-400 max-w-md">
              All inbound interactions have been reviewed or auto-dispatched by the high-confidence agent pipeline.
            </p>
            {resolvedCount > 0 && (
              <Badge variant="success" className="mt-2">
                {resolvedCount} Replies processed this session
              </Badge>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Queue Items List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Pending Items ({items.length})</span>
              <span>Sorted by urgency</span>
            </div>

            {items.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedIndex(idx);
                  setEditedReply(item.draft_reply);
                  setIsEditing(false);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedIndex === idx
                    ? "border-purple-500/50 bg-purple-950/20 text-white shadow-lg"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-200">{item.lead_name}</span>
                  <Badge variant="warning" className="text-[10px]">
                    {Math.round(item.confidence_score * 100)}%
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{item.incoming_message}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.lead_headline.split("@")[1] || item.platform}</span>
                  <span>{formatRelativeTime(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Active Item Detail & Actions */}
          <div className="lg:col-span-8 space-y-6">
            {currentItem && (
              <Card className="border-purple-500/30">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{currentItem.lead_name}</CardTitle>
                        <Badge variant="outline">{currentItem.lead_headline}</Badge>
                      </div>
                      <CardDescription className="mt-1">
                        Inbound comment via LinkedIn • Sentiment: <span className="capitalize text-slate-300 font-medium">{currentItem.sentiment}</span>
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          AI Confidence
                        </span>
                        <span className="text-sm font-bold text-amber-400">
                          {Math.round(currentItem.confidence_score * 100)}%
                        </span>
                      </div>
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Inbound Interaction Box */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <User className="h-3.5 w-3.5 text-blue-400" />
                      <span>Prospect Comment</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-sans">
                      &quot;{currentItem.incoming_message}&quot;
                    </p>
                  </div>

                  {/* AI Draft Reply Box */}
                  <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>AI Drafted Response</span>
                      </div>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-xs text-purple-300 hover:text-white flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>{isEditing ? "Done Editing" : "Edit Text"}</span>
                      </button>
                    </div>

                    {isEditing ? (
                      <Textarea
                        rows={4}
                        value={editedReply}
                        onChange={(e) => setEditedReply(e.target.value)}
                        className="bg-slate-950/80 border-purple-500/40 text-slate-100 text-sm leading-relaxed"
                      />
                    ) : (
                      <p className="text-sm text-purple-100 leading-relaxed">
                        {editedReply || currentItem.draft_reply}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      className="w-full sm:w-auto gap-1.5 rounded-xl text-xs"
                    >
                      <X className="h-4 w-4" />
                      <span>Reject Reply (R)</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                      className="w-full sm:w-auto gap-1.5 rounded-xl text-xs"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>{isEditing ? "Save Draft" : "Edit Copy (E)"}</span>
                    </Button>

                    <Button
                      variant="default"
                      onClick={handleSaveEditAndApprove}
                      className="w-full sm:w-auto gap-1.5 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500"
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve & Dispatch (A)</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
