/**
 * API helpers for Ticket #006:
 * - fetchPostDraftQueue  — posts awaiting operator approval
 * - approvePostDraft / rejectPostDraft / requestRevision — revision lifecycle
 * - reschedulePost       — move a post to a new scheduled_at date
 * - fetchCalendarPosts   — posts for a given month (for the calendar grid)
 */

import { Post, ApiError } from "./api-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function calendarRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    clearTimeout(tid);
    if (!res.ok) {
      const detail = await res.json().then((b) => b.detail ?? JSON.stringify(b)).catch(() => res.statusText);
      throw new ApiError(res.status, res.statusText, detail);
    }
    return res.json() as Promise<T>;
  } catch (err) {
    clearTimeout(tid);
    if (err instanceof ApiError) throw err;
    throw new Error(`Calendar API error on ${endpoint}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface PostDraft {
  id: string;
  content: string;
  hashtags: string[];
  cta: string | null;
  platform: string;
  status: Post["status"];
  confidence_score: number | null;
  requires_review: boolean;
  ai_generated: boolean;
  current_revision_id: string | null;
  created_at: string;
  scheduled_at: string | null;
  campaign_id: string | null;
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

export async function fetchPostDraftQueue(): Promise<PostDraft[]> {
  const res = await calendarRequest<{ data: Post[] }>(
    "/posts?status=draft&requires_review=true",
    { cache: "no-store" } as RequestInit
  );
  return (res.data || []).map((p) => ({
    id: p.id,
    content: p.content,
    hashtags: p.hashtags ?? [],
    cta: p.cta ?? null,
    platform: p.platform ?? "linkedin",
    status: p.status,
    confidence_score: p.confidence_score ?? null,
    requires_review: p.requires_review,
    ai_generated: true,
    current_revision_id: null,
    created_at: p.created_at,
    scheduled_at: p.scheduled_at ?? null,
    campaign_id: p.campaign_id ?? null,
  }));
}

export async function fetchCalendarPosts(year: number, month: number): Promise<Post[]> {
  const from = new Date(year, month - 1, 1).toISOString();
  const to   = new Date(year, month, 0, 23, 59, 59).toISOString();
  const res  = await calendarRequest<{ data: Post[] }>(
    `/posts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=200`,
    { cache: "no-store" } as RequestInit
  );
  return res.data || [];
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function approvePostDraft(postId: string): Promise<void> {
  await calendarRequest(`/posts/${postId}/approve`, { method: "POST" });
}

export async function rejectPostDraft(postId: string, feedback: string): Promise<void> {
  await calendarRequest(`/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify({ error_message: feedback, status: "failed" }),
  });
}

export async function requestRevision(postId: string, feedback: string): Promise<void> {
  await calendarRequest(`/posts/${postId}/revisions`, {
    method: "POST",
    body: JSON.stringify({ feedback, source: "operator" }),
  });
}

export async function reschedulePost(postId: string, scheduledAt: string): Promise<void> {
  await calendarRequest(`/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify({ scheduled_at: scheduledAt }),
  });
}
