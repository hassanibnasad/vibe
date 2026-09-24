"use client";

/**
 * ContentCalendar — visual month-grid calendar for scheduled/published posts.
 *
 * Features:
 * - Month-grid layout with post chips on their scheduled date
 * - Day click → opens side panel with that day's posts
 * - Drag-to-reschedule (HTML5 drag events, no heavy DnD library)
 * - Post status color-coding: draft=slate, approved=blue, scheduled=indigo,
 *   publishing=amber, published=emerald, failed=rose
 * - Prev/Next month navigation
 * - Loading skeleton + empty state
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Post } from "@/lib/api-client";
import { fetchCalendarPosts, reschedulePost } from "@/lib/calendar-api";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const STATUS_STYLES: Record<Post["status"], { chip: string; badge: string; label: string }> = {
  draft:      { chip: "bg-slate-500/20 border-slate-500/30 text-slate-300",  badge: "bg-slate-500/20 text-slate-300",  label: "Draft" },
  approved:   { chip: "bg-blue-500/20  border-blue-500/30  text-blue-300",   badge: "bg-blue-500/20 text-blue-300",    label: "Approved" },
  scheduled:  { chip: "bg-indigo-500/20 border-indigo-500/30 text-indigo-300", badge: "bg-indigo-500/20 text-indigo-300", label: "Scheduled" },
  publishing: { chip: "bg-amber-500/20 border-amber-500/30 text-amber-300",  badge: "bg-amber-500/20 text-amber-300",  label: "Publishing" },
  published:  { chip: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300", badge: "bg-emerald-500/20 text-emerald-300", label: "Published" },
  failed:     { chip: "bg-rose-500/20  border-rose-500/30  text-rose-300",   badge: "bg-rose-500/20 text-rose-300",    label: "Failed" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function postDateKey(post: Post): string | null {
  const dt = post.scheduled_at || post.published_at;
  if (!dt) return null;
  return isoDate(new Date(dt));
}

function buildCalendarGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month - 1, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const grid: Date[][] = [];
  let week: Date[] = [];

  // Leading blank days from previous month
  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month - 2, new Date(year, month - 1, 0).getDate() - (startOffset - i - 1));
    week.push(d);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(new Date(year, month - 1, day));
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }

  // Trailing blank days
  if (week.length > 0) {
    let trailingDay = 1;
    while (week.length < 7) {
      week.push(new Date(year, month, trailingDay++));
    }
    grid.push(week);
  }

  return grid;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface PostChipProps {
  post: Post;
  onDragStart: (e: React.DragEvent, postId: string) => void;
}

function PostChip({ post, onDragStart }: PostChipProps) {
  const s = STATUS_STYLES[post.status];
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, post.id)}
      title={post.content}
      className={`text-[10px] rounded px-1.5 py-0.5 border truncate cursor-grab active:cursor-grabbing select-none ${s.chip}`}
    >
      {post.content.slice(0, 40)}{post.content.length > 40 ? "…" : ""}
    </div>
  );
}

interface DayPanelProps {
  date: Date | null;
  posts: Post[];
  onClose: () => void;
}

function DayPanel({ date, posts, onClose }: DayPanelProps) {
  if (!date) return null;
  const dateLabel = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="w-80 border-l border-white/[0.07] bg-[#0d0d0f] flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
        <div>
          <p className="text-xs font-mono text-muted-foreground">Selected day</p>
          <p className="text-sm font-semibold text-white mt-0.5">{dateLabel}</p>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Posts list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Calendar className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No posts scheduled for this day.</p>
          </div>
        ) : (
          posts.map((post) => {
            const s = STATUS_STYLES[post.status];
            const time = post.scheduled_at || post.published_at;
            return (
              <div
                key={post.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3"
              >
                {/* Status + time */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${s.badge}`}>
                    {s.label}
                  </span>
                  {time && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  )}
                </div>

                {/* Content preview */}
                <p className="text-xs text-foreground/80 leading-relaxed line-clamp-4">{post.content}</p>

                {/* Hashtags */}
                {post.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[10px] font-mono text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Published link */}
                {post.platform_post_url && (
                  <a
                    href={post.platform_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on LinkedIn
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function ContentCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const todayKey = isoDate(now);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCalendarPosts(year, month);
      setPosts(data);
    } catch {
      setError("Could not load posts. Check your API connection.");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // Index posts by date key
  const postsByDay = React.useMemo(() => {
    const map: Record<string, Post[]> = {};
    for (const p of posts) {
      const key = postDateKey(p);
      if (key) {
        (map[key] ??= []).push(p);
      }
    }
    return map;
  }, [posts]);

  const selectedDayPosts = selectedDate ? (postsByDay[isoDate(selectedDate)] ?? []) : [];
  const grid = buildCalendarGrid(year, month);

  // Navigation
  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
    setSelectedDate(null);
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, postId: string) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(postId);
  };
  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(dateKey);
  };
  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDate(null);
    if (!draggingId) return;

    const post = posts.find((p) => p.id === draggingId);
    if (!post) return;

    // Preserve existing time if any, else default to 9am
    const existingTime = post.scheduled_at ? new Date(post.scheduled_at) : null;
    const newDt = new Date(targetDate);
    newDt.setHours(existingTime?.getHours() ?? 9, existingTime?.getMinutes() ?? 0, 0, 0);

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === draggingId ? { ...p, scheduled_at: newDt.toISOString() } : p
      )
    );

    try {
      await reschedulePost(draggingId, newDt.toISOString());
    } catch {
      // Revert on failure
      await loadPosts();
    } finally {
      setDraggingId(null);
    }
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverDate(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const currentMonthKey = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <div className="flex h-full rounded-2xl border border-white/[0.07] overflow-hidden bg-[#0a0a0c]">
      {/* Calendar body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="font-semibold text-white text-sm w-40 text-center">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="hidden lg:flex items-center gap-3">
              {(["scheduled", "published", "draft", "failed"] as const).map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${STATUS_STYLES[s].chip.split(" ")[0]}`} />
                  <span className="text-[10px] text-muted-foreground">{STATUS_STYLES[s].label}</span>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadPosts}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Day header row */}
        <div className="grid grid-cols-7 border-b border-white/[0.05]">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2.5 text-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-px bg-white/[0.04] p-px">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-full min-h-[80px] rounded-none bg-[#0d0d0f]" />
            ))}
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-px bg-white/[0.04] p-px overflow-y-auto">
            {grid.flat().map((day, idx) => {
              const key = isoDate(day);
              const isCurrentMonth = day.getMonth() === month - 1;
              const isToday = key === todayKey;
              const isSelected = selectedDate ? isoDate(selectedDate) === key : false;
              const isDragOver = dragOverDate === key;
              const dayPosts = postsByDay[key] ?? [];

              return (
                <div
                  key={`${key}-${idx}`}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  onDragOver={(e) => handleDragOver(e, key)}
                  onDrop={(e) => handleDrop(e, day)}
                  onDragLeave={() => setDragOverDate(null)}
                  className={[
                    "min-h-[80px] p-2 flex flex-col gap-1 cursor-pointer transition-colors",
                    isCurrentMonth ? "bg-[#0d0d0f]" : "bg-[#0a0a0c]",
                    isSelected ? "ring-1 ring-inset ring-cyan-400/40 bg-cyan-400/[0.04]" : "hover:bg-white/[0.025]",
                    isDragOver ? "bg-indigo-500/10 ring-1 ring-inset ring-indigo-400/40" : "",
                  ].join(" ")}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between">
                    <span
                      className={[
                        "text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full",
                        isToday
                          ? "bg-cyan-400 text-black font-bold"
                          : isCurrentMonth
                          ? "text-foreground/70"
                          : "text-muted-foreground/25",
                      ].join(" ")}
                    >
                      {day.getDate()}
                    </span>
                    {dayPosts.length > 2 && (
                      <span className="text-[9px] font-mono text-muted-foreground/50">
                        +{dayPosts.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Post chips (max 2 visible) */}
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {dayPosts.slice(0, 2).map((post) => (
                      <PostChip
                        key={post.id}
                        post={post}
                        onDragStart={handleDragStart}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Side panel (shown when a day is selected) */}
      {selectedDate && (
        <DayPanel
          date={selectedDate}
          posts={selectedDayPosts}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
