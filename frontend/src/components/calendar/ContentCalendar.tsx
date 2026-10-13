"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Plus,
  LayoutGrid,
  CalendarDays,
  ListFilter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { fetchPosts, reschedulePost, Post } from "@/lib/api-client";

// ── Types & Constants ────────────────────────────────────────────────────────

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const STATUS_STYLES: Record<Post["status"], { chip: string; badge: string; label: string; dotColor: string }> = {
  draft:      { chip: "bg-muted border-border text-muted-foreground", badge: "bg-muted text-muted-foreground", label: "Draft", dotColor: "bg-zinc-400 dark:bg-zinc-500" },
  approved:   { chip: "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: "Approved", dotColor: "bg-blue-500" },
  scheduled:  { chip: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300", badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300", label: "Scheduled", dotColor: "bg-blue-500" },
  publishing: { chip: "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-300", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300", label: "Publishing", dotColor: "bg-amber-500" },
  published:  { chip: "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "Published", dotColor: "bg-emerald-500" },
  failed:     { chip: "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400", badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400", label: "Failed", dotColor: "bg-rose-500" },
};

type ViewMode = "month" | "week" | "agenda";

// ── Date Helpers (Strict Local Time to Avoid UTC Off-by-One Bugs) ─────────────

export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function postDateKey(post: Post): string | null {
  const dt = post.scheduled_at || post.published_at;
  if (!dt) return null;
  const d = new Date(dt);
  if (isNaN(d.getTime())) return null;
  return toLocalDateKey(d);
}

function buildCalendarGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const startDate = new Date(year, month - 1, 1 - startOffset);
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const grid: Date[][] = [];

  const cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  for (let row = 0; row < totalCells / 7; row++) {
    const week: Date[] = [];
    for (let col = 0; col < 7; col++) {
      week.push(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate()));
      cur.setDate(cur.getDate() + 1);
    }
    grid.push(week);
  }

  return grid;
}

function getCurrentWeekDates(baseDate: Date): Date[] {
  const dayOfWeek = baseDate.getDay();
  const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - startOffset);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

// ── Post Chip ─────────────────────────────────────────────────────────────────

interface PostChipProps {
  post: Post;
  onDragStart: (e: React.DragEvent, postId: string) => void;
  onClick?: () => void;
}

function PostChip({ post, onDragStart, onClick }: PostChipProps) {
  const s = STATUS_STYLES[post.status] || STATUS_STYLES.draft;
  const time = post.scheduled_at || post.published_at;
  const timeLabel = time ? new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          draggable
          onDragStart={(e) => onDragStart(e, post.id)}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className={`text-[11px] rounded px-1.5 py-0.5 border truncate cursor-grab active:cursor-grabbing select-none font-medium transition-all hover:brightness-105 ${s.chip}`}
        >
          {post.content.slice(0, 36)}{post.content.length > 36 ? "…" : ""}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs space-y-1 p-2 bg-popover text-popover-foreground border-border shadow-elevated">
        <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
          <span className="font-semibold uppercase tracking-wider">{s.label}</span>
          {timeLabel && <span className="text-muted-foreground">{timeLabel}</span>}
        </div>
        <p className="text-xs line-clamp-4 font-sans leading-relaxed text-foreground">{post.content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ── Side Panel ────────────────────────────────────────────────────────────────

interface DayPanelProps {
  date: Date | null;
  posts: Post[];
  onClose: () => void;
}

function DayPanel({ date, posts, onClose }: DayPanelProps) {
  if (!date) return null;
  const dateLabel = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const dateKey = toLocalDateKey(date);

  return (
    <div className="w-80 border-t lg:border-t-0 lg:border-l border-border bg-card flex flex-col shrink-0 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface/50">
        <div>
          <p className="text-[11px] font-mono text-muted-foreground">Selected Day</p>
          <p className="text-xs font-semibold text-foreground mt-0.5">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/studio?date=${dateKey}`}>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <button
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-xs"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Posts list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs text-muted-foreground font-medium">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
          <Link href={`/studio?date=${dateKey}`} className="text-[11px] text-primary hover:underline flex items-center gap-1">
            <Plus className="h-3 w-3" />
            Add post
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <CalendarIcon className="h-7 w-7 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No posts scheduled for this day.</p>
            <Link href={`/studio?date=${dateKey}`} className="mt-2">
              <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                <Plus className="h-3 w-3" />
                Schedule for {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Button>
            </Link>
          </div>
        ) : (
          posts.map((post) => {
            const s = STATUS_STYLES[post.status] || STATUS_STYLES.draft;
            const time = post.scheduled_at || post.published_at;
            return (
              <div
                key={post.id}
                className="rounded-lg border border-border bg-surface p-3.5 space-y-2.5 shadow-subtle"
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
                <p className="text-xs text-foreground leading-relaxed line-clamp-4">{post.content}</p>

                {/* Hashtags */}
                {post.hashtags && post.hashtags.length > 0 && (
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
                    className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View live post
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

// ── Main Calendar Component ──────────────────────────────────────────────────

interface ContentCalendarProps {
  initialPosts?: Post[];
}

export function ContentCalendar({ initialPosts }: ContentCalendarProps) {
  const { toast } = useToast();
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [statusFilter, setStatusFilter] = useState<Post["status"] | "all">("all");
  const [posts, setPosts] = useState<Post[]>(initialPosts ?? []);
  const [loading, setLoading] = useState(!initialPosts);
  const [error, setError] = useState<string | null>(null);

  // Selected date for side panel
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Drag & drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Load posts
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

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - 1);
      setCurrentDate(d);
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 14);
      setCurrentDate(d);
    }
    setSelectedDate(null);
  };

  const handleNext = () => {
    if (viewMode === "month") {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + 1);
      setCurrentDate(d);
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 14);
      setCurrentDate(d);
    }
    setSelectedDate(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Group posts by YYYY-MM-DD
  const todayKey = toLocalDateKey(today);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    if (statusFilter === "all") return posts;
    return posts.filter((p) => p.status === statusFilter);
  }, [posts, statusFilter]);

  const postsByDay = useMemo(() => {
    return filteredPosts.reduce<Record<string, Post[]>>((acc, p) => {
      const key = postDateKey(p);
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});
  }, [filteredPosts]);

  // Counts by status for legend filters
  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      scheduled: 0,
      published: 0,
      draft: 0,
      failed: 0,
    };
    posts.forEach((p) => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    });
    return counts;
  }, [posts]);

  // Drag & drop handlers with Drag Ghost, Highlighted Targets, and Undo Toast
  const handleDragStart = (e: React.DragEvent, postId: string) => {
    setDraggingId(postId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", postId);

    // Create custom lightweight drag ghost
    const ghost = document.createElement("div");
    ghost.className = "bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded shadow-lg fixed top-[-1000px]";
    ghost.textContent = "Rescheduling post...";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
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

    const originalScheduledAt = post.scheduled_at;
    const originalTime = originalScheduledAt ? new Date(originalScheduledAt) : new Date();
    const newScheduled = new Date(targetDate);
    newScheduled.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
    const newIso = newScheduled.toISOString();

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, scheduled_at: newIso, status: "scheduled" }
          : p
      )
    );

    try {
      await reschedulePost(postId, newIso);

      // Trigger Undo Toast
      toast({
        title: "Post rescheduled",
        description: `Moved to ${newScheduled.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
        duration: 5000,
        undoLabel: "Undo",
        onUndo: async () => {
          if (!originalScheduledAt) return;
          // Revert back
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId ? { ...p, scheduled_at: originalScheduledAt } : p
            )
          );
          try {
            await reschedulePost(postId, originalScheduledAt);
          } catch {
            loadPosts();
          }
        },
      });
    } catch {
      // Revert on failure
      loadPosts();
      toast({
        title: "Reschedule failed",
        description: "Could not update post schedule on the server.",
        variant: "error",
      });
    }
  };

  const selectedDayPosts = selectedDate
    ? (postsByDay[toLocalDateKey(selectedDate)] ?? [])
    : [];

  const grid = buildCalendarGrid(year, month);
  const weekDates = getCurrentWeekDates(currentDate);

  // Agenda items: sorted chronologically
  const agendaPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      const ta = new Date(a.scheduled_at || a.published_at || a.created_at).getTime();
      const tb = new Date(b.scheduled_at || b.published_at || b.created_at).getTime();
      return ta - tb;
    });
  }, [filteredPosts]);

  return (
    <div className="flex flex-col lg:flex-row rounded-xl border border-border overflow-hidden bg-card shadow-subtle">
      {/* Calendar body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border bg-surface/40">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-border bg-background p-0.5">
              <button
                onClick={handlePrev}
                aria-label="Previous"
                className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2 h-6 text-[11px] font-medium text-foreground hover:bg-accent rounded transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                aria-label="Next"
                className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <h2 className="font-sans font-semibold text-foreground text-xs sm:text-sm pl-2">
              {viewMode === "month"
                ? `${MONTH_NAMES[month - 1]} ${year}`
                : viewMode === "week"
                ? `Week of ${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "Upcoming Schedule"}
            </h2>
          </div>

          {/* View Switcher: Month, Week, Agenda */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-border bg-background p-0.5 text-xs">
              <button
                onClick={() => setViewMode("month")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  viewMode === "month"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  viewMode === "week"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarDays className="h-3 w-3" />
                Week
              </button>
              <button
                onClick={() => setViewMode("agenda")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  viewMode === "agenda"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListFilter className="h-3 w-3" />
                Agenda
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={loadPosts}
              className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Legend Filters with Counts */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-border bg-surface/20 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground font-medium mr-1">Filter:</span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors border ${
                statusFilter === "all"
                  ? "bg-accent border-border text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({posts.length})
            </button>

            {(
              [
                { status: "scheduled", label: "Scheduled", dotColor: "bg-blue-500" },
                { status: "published", label: "Published", dotColor: "bg-emerald-500" },
                { status: "draft",     label: "Draft",     dotColor: "bg-zinc-400 dark:bg-zinc-500" },
                { status: "failed",    label: "Failed",    dotColor: "bg-rose-500" },
              ] as const
            ).map((item) => {
              const active = statusFilter === item.status;
              const count = countsByStatus[item.status] || 0;
              return (
                <button
                  key={item.status}
                  onClick={() => setStatusFilter(active ? "all" : item.status)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition-colors border ${
                    active
                      ? "bg-accent border-border text-foreground font-semibold shadow-xs"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <div className={`h-2 w-2 rounded-full ${item.dotColor}`} />
                  <span>{item.label}</span>
                  <span className="font-mono text-[10px] opacity-75 tabular-nums">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>Drag cards to reschedule</span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* View Mode Rendering */}
        {viewMode === "month" && (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Day header row */}
            <div className="grid grid-cols-7 border-b border-border bg-surface/50">
              {DAY_NAMES.map((d) => (
                <div key={d} className="py-2 text-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-7 auto-rows-fr gap-px bg-border p-px">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-none bg-card" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 auto-rows-fr gap-px bg-border p-px min-h-[500px]">
                {grid.flat().map((day, idx) => {
                  const key = toLocalDateKey(day);
                  const isCurrentMonth = day.getMonth() === month - 1;
                  const isToday = key === todayKey;
                  const isSelected = selectedDate ? toLocalDateKey(selectedDate) === key : false;
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
                        "group relative min-h-[85px] max-h-[130px] p-2 flex flex-col gap-1 cursor-pointer transition-all",
                        isCurrentMonth ? "bg-card" : "bg-surface/50 text-muted-foreground/60",
                        isSelected ? "ring-2 ring-inset ring-primary bg-primary/5" : "hover:bg-surface",
                        isDragOver
                          ? "ring-2 ring-dashed ring-primary bg-primary/10 shadow-inner z-10"
                          : "",
                      ].join(" ")}
                    >
                      {/* Day number & Quick Hover + Button */}
                      <div className="flex items-center justify-between">
                        <span
                          className={[
                            "text-xs font-mono w-5 h-5 flex items-center justify-center rounded-full transition-colors",
                            isToday
                              ? "bg-primary text-primary-foreground font-bold"
                              : isCurrentMonth
                              ? "text-foreground font-medium"
                              : "text-muted-foreground/40",
                          ].join(" ")}
                        >
                          {day.getDate()}
                        </span>

                        <div className="flex items-center gap-1">
                          {dayPosts.length > 2 && (
                            <span className="text-[9px] font-mono text-muted-foreground tabular-nums">
                              +{dayPosts.length - 2}
                            </span>
                          )}

                          {/* Hover "+" button for quick create */}
                          <Link
                            href={`/studio?date=${key}`}
                            onClick={(e) => e.stopPropagation()}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            title={`Create post for ${key}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>

                      {/* Post chips */}
                      <div className="flex flex-col gap-1 overflow-hidden">
                        {dayPosts.slice(0, 2).map((post) => (
                          <PostChip
                            key={post.id}
                            post={post}
                            onDragStart={handleDragStart}
                            onClick={() => setSelectedDate(day)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {viewMode === "week" && (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="grid grid-cols-7 border-b border-border bg-surface/50">
              {weekDates.map((day, i) => {
                const key = toLocalDateKey(day);
                const isToday = key === todayKey;
                return (
                  <div key={i} className="py-2.5 px-2 text-center border-r last:border-r-0 border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                      {DAY_NAMES[i]}
                    </span>
                    <span
                      className={`inline-block mt-0.5 text-xs font-mono font-semibold rounded-full w-6 h-6 leading-6 ${
                        isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-7 gap-px bg-border p-px min-h-[480px]">
              {weekDates.map((day, i) => {
                const key = toLocalDateKey(day);
                const dayPosts = postsByDay[key] ?? [];
                const isSelected = selectedDate ? toLocalDateKey(selectedDate) === key : false;
                const isDragOver = dragOverDate === key;

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(isSelected ? null : day)}
                    onDragOver={(e) => handleDragOver(e, key)}
                    onDrop={(e) => handleDrop(e, day)}
                    onDragLeave={() => setDragOverDate(null)}
                    className={[
                      "group p-2.5 flex flex-col gap-2 cursor-pointer transition-colors bg-card",
                      isSelected ? "ring-2 ring-inset ring-primary bg-primary/5" : "hover:bg-surface",
                      isDragOver ? "ring-2 ring-dashed ring-primary bg-primary/10" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-border/60">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {dayPosts.length} posts
                      </span>
                      <Link
                        href={`/studio?date=${key}`}
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <div className="flex flex-col gap-1.5 overflow-y-auto">
                      {dayPosts.map((post) => (
                        <PostChip
                          key={post.id}
                          post={post}
                          onDragStart={handleDragStart}
                          onClick={() => setSelectedDate(day)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === "agenda" && (
          <div className="flex-1 p-6 space-y-4 max-h-[600px] overflow-y-auto">
            {agendaPosts.length === 0 ? (
              <div className="text-center py-16">
                <CalendarIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No posts matching this filter.</p>
              </div>
            ) : (
              agendaPosts.map((post) => {
                const s = STATUS_STYLES[post.status] || STATUS_STYLES.draft;
                const dt = post.scheduled_at || post.published_at || post.created_at;
                const d = new Date(dt);
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedDate(d)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-surface hover:bg-card transition-colors cursor-pointer"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${s.badge}`}>
                          {s.label}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at{" "}
                          {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                        {post.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/studio?edit=${post.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" className="h-7 text-xs border-border">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Side panel */}
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
