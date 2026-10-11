"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPosts, reschedulePost, Post } from "@/lib/api-client";

// ── Types & Constants ────────────────────────────────────────────────────────

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const STATUS_STYLES: Record<Post["status"], { chip: string; badge: string; label: string }> = {
  draft:      { chip: "bg-muted border-border text-muted-foreground", badge: "bg-muted text-muted-foreground", label: "Draft" },
  approved:   { chip: "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: "Approved" },
  scheduled:  { chip: "bg-secondary border-border text-foreground", badge: "bg-secondary text-foreground", label: "Scheduled" },
  publishing: { chip: "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-300", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300", label: "Publishing" },
  published:  { chip: "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "Published" },
  failed:     { chip: "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400", badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400", label: "Failed" },
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
  const lastDay = new Date(year, month, 0);

  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const startDate = new Date(year, month - 1, 1 - startOffset);

  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const grid: Date[][] = [];

  let cur = new Date(startDate);
  for (let row = 0; row < totalCells / 7; row++) {
    const week: Date[] = [];
    for (let col = 0; col < 7; col++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
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
      className={`text-[10px] rounded px-1.5 py-0.5 border truncate cursor-grab active:cursor-grabbing select-none font-medium ${s.chip}`}
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
    <div className="w-80 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <p className="text-xs font-mono text-muted-foreground">Selected day</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">{dateLabel}</p>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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
                className="rounded-xl border border-border bg-surface p-4 space-y-3 shadow-subtle"
              >
                {/* Status + time */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${s.badge}`}>
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
                <p className="text-xs text-foreground/90 leading-relaxed line-clamp-4">{post.content}</p>

                {/* Hashtags */}
                {post.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[10px] font-mono text-foreground bg-muted border border-border px-1.5 py-0.5 rounded">
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
                    className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
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

// ── Main Component ────────────────────────────────────────────────────────────

interface ContentCalendarProps {
  initialPosts?: Post[];
}

export function ContentCalendar({ initialPosts }: ContentCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [posts, setPosts] = useState<Post[]>(initialPosts ?? []);
  const [loading, setLoading] = useState(!initialPosts);
  const [error, setError] = useState<string | null>(null);

  // Selected date for side panel
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Drag & drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Load posts if not provided initially
  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scheduled posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialPosts) {
      loadPosts();
    }
  }, [initialPosts, loadPosts]);

  // ── Month Navigation ──
  const prevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  // ── Calendar Grid ──
  const grid = buildCalendarGrid(year, month);
  const todayKey = isoDate(today);

  // Group posts by YYYY-MM-DD
  const postsByDay = posts.reduce<Record<string, Post[]>>((acc, p) => {
    const key = postDateKey(p);
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const selectedDayPosts = selectedDate
    ? (postsByDay[isoDate(selectedDate)] ?? [])
    : [];

  // ── Drag & Drop Reschedule Handlers ──
  const handleDragStart = (_e: React.DragEvent, postId: string) => {
    setDraggingId(postId);
  };

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    if (dragOverDate !== dateKey) {
      setDragOverDate(dateKey);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const postId = draggingId;
    setDraggingId(null);
    setDragOverDate(null);

    if (!postId) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const originalTime = post.scheduled_at ? new Date(post.scheduled_at) : new Date();
    const newScheduled = new Date(targetDate);
    newScheduled.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, scheduled_at: newScheduled.toISOString(), status: "scheduled" }
          : p
      )
    );

    try {
      await reschedulePost(postId, newScheduled.toISOString());
    } catch {
      // Revert on failure
      loadPosts();
    }
  };

  return (
    <div className="flex h-full rounded-2xl border border-border overflow-hidden bg-card shadow-subtle">
      {/* Calendar body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="font-semibold text-foreground text-sm w-40 text-center">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Day header row */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2.5 text-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-px bg-border p-px">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-full min-h-[80px] rounded-none bg-card" />
            ))}
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-px bg-border p-px overflow-y-auto">
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
                    isCurrentMonth ? "bg-card" : "bg-surface",
                    isSelected ? "ring-1 ring-inset ring-foreground/40 bg-accent/40" : "hover:bg-accent/30",
                    isDragOver ? "bg-accent ring-1 ring-inset ring-foreground/40" : "",
                  ].join(" ")}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between">
                    <span
                      className={[
                        "text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full",
                        isToday
                          ? "bg-foreground text-background font-bold"
                          : isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground/30",
                      ].join(" ")}
                    >
                      {day.getDate()}
                    </span>
                    {dayPosts.length > 2 && (
                      <span className="text-[9px] font-mono text-muted-foreground">
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
