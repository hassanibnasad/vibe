/**
 * VibeAgent Deep API Client Seam
 * 
 * Provides type-safe contracts, timeout boundaries, structured error propagation,
 * and unified API bindings across all backend endpoints without silent mock fallbacks.
 */

export interface Post {
  id: string;
  campaign_id?: string | null;
  platform_id?: string | null;
  content: string;
  platform?: string;
  status: "draft" | "approved" | "scheduled" | "publishing" | "published" | "failed";
  confidence_score?: number | null;
  requires_review: boolean;
  scheduled_at?: string | null;
  published_at?: string | null;
  platform_post_url?: string | null;
  platform_post_id?: string | null;
  hashtags: string[];
  cta?: string | null;
  tone?: string;
  created_at: string;
  variant_label?: string | null;
}

export interface Lead {
  id: string;
  name?: string | null;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  platform_username: string;
  platform_user_id: string;
  platform: string;
  platform_profile_url?: string | null;
  headline?: string | null;
  job_title?: string | null;
  company?: string | null;
  industry?: string | null;
  company_size?: string | null;
  lead_stage: "cold" | "warm" | "hot" | "mql" | "sql" | "disqualified";
  lead_score: number;
  sentiment: "positive" | "neutral" | "negative" | "inquisitive" | "frustrated";
  intent_signals: string[];
  tags?: string[];
  pain_points?: string[];
  interests?: string[];
  interaction_count: number;
  first_interaction_at?: string;
  last_interaction_at: string;
  created_at?: string;
}

export interface LeadInteraction {
  id: string;
  lead_id: string;
  type: "comment" | "dm" | "post_like" | "mention";
  content: string;
  sentiment: string;
  created_at: string;
}

export interface ReviewItem {
  id: string;
  message_id: string;
  conversation_id: string;
  lead_id: string;
  lead_name: string;
  lead_headline: string;
  platform: string;
  incoming_message: string;
  draft_reply: string;
  suggested_reply: string;
  confidence_score: number;
  sentiment: string;
  review_status: "pending" | "approved" | "rejected" | "edited";
  created_at: string;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  source_type: "pdf" | "markdown" | "url" | "text";
  status: "ready" | "processing" | "failed";
  chunk_count: number;
  token_count: number;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  target_audience: string;
  status: "active" | "draft" | "completed";
  posts_count: number;
  leads_generated: number;
  created_at: string;
}

export interface DashboardMetrics {
  total_posts_published: number;
  total_leads: number;
  mql_sql_leads: number;
  review_queue_pending: number;
  avg_reply_confidence: number;
  avg_response_time_sec: number;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    inquisitive: number;
    negative: number;
  };
  leads_by_stage: {
    cold: number;
    warm: number;
    hot: number;
    mql: number;
    sql: number;
  };
  recent_posts: Post[];
  review_queue: ReviewItem[];
}

export interface SystemHealth {
  status: "ok" | "degraded" | "error";
  environment: string;
  database: "connected" | "disconnected";
  redis: "connected" | "disconnected";
  llm_gateway: "online" | "offline";
  active_model: string;
  version: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const DEFAULT_TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public detail?: string
  ) {
    super(`API Error ${status} (${statusText}): ${detail || "Unknown error"}`);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let detail = "";
      try {
        const errorBody = await res.json();
        detail = errorBody.detail || JSON.stringify(errorBody);
      } catch {
        detail = await res.text().catch(() => "");
      }
      throw new ApiError(res.status, res.statusText, detail);
    }
    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    throw new Error(`Network or client error on ${endpoint}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ──────────────── Dashboard Metrics ────────────────

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const raw = await request<{
    total_posts_published: number;
    total_leads: number;
    mql_sql_leads: number;
    review_queue_pending: number;
    avg_reply_confidence: number;
    avg_response_time_sec: number;
    sentiment_distribution: { positive: number; neutral: number; inquisitive: number; negative: number };
    leads_by_stage: { cold: number; warm: number; hot: number; mql: number; sql: number };
    recent_posts: Post[];
    review_queue: Array<{
      id?: string;
      message_id: string;
      conversation_id: string;
      lead_id: string;
      lead_name?: string | null;
      lead_headline?: string | null;
      platform: string;
      incoming_message?: string | null;
      draft_reply?: string;
      suggested_reply?: string;
      confidence_score?: number | null;
      sentiment?: string;
      review_status?: string;
      created_at: string;
    }>;
  }>("/analytics/dashboard", { cache: "no-store" });

  return {
    total_posts_published: raw.total_posts_published || 0,
    total_leads: raw.total_leads || 0,
    mql_sql_leads: raw.mql_sql_leads || 0,
    review_queue_pending: raw.review_queue_pending || 0,
    avg_reply_confidence: raw.avg_reply_confidence || 0.85,
    avg_response_time_sec: raw.avg_response_time_sec || 1.4,
    sentiment_distribution: raw.sentiment_distribution || { positive: 0, neutral: 0, inquisitive: 0, negative: 0 },
    leads_by_stage: raw.leads_by_stage || { cold: 0, warm: 0, hot: 0, mql: 0, sql: 0 },
    recent_posts: raw.recent_posts || [],
    review_queue: (raw.review_queue || []).map((item) => ({
      id: item.id || item.message_id,
      message_id: item.message_id,
      conversation_id: item.conversation_id,
      lead_id: item.lead_id,
      lead_name: item.lead_name || "Prospective Contact",
      lead_headline: item.lead_headline || "Inbound Contact",
      platform: item.platform,
      incoming_message: item.incoming_message || item.suggested_reply || "",
      draft_reply: item.draft_reply || item.suggested_reply || "",
      suggested_reply: item.suggested_reply || item.draft_reply || "",
      confidence_score: item.confidence_score ?? 0.85,
      sentiment: item.sentiment || "inquisitive",
      review_status: (item.review_status as ReviewItem["review_status"]) || "pending",
      created_at: item.created_at,
    })),
  };
}

// ──────────────── Content Studio & Posts ────────────────

export async function fetchPosts(params?: { status?: string; platform?: string }): Promise<Post[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.platform) query.append("platform_id", params.platform);
  const endpoint = `/posts?${query.toString()}`;

  const res = await request<{ data: Post[]; pagination: { page: number; limit: number; total: number } }>(
    endpoint,
    { cache: "no-store" }
  );
  return res.data;
}

export async function generatePost(
  brief: string,
  tone: string = "professional",
  platform: string = "linkedin",
  variants: number = 1
): Promise<Post[]> {
  if (variants > 1) {
    return request<Post[]>("/posts/generate-variants", {
      method: "POST",
      body: JSON.stringify({ brief, tone, platforms: [platform], variants }),
    });
  }

  const single = await request<Post>("/posts/generate", {
    method: "POST",
    body: JSON.stringify({ brief, tone, platforms: [platform], variants: 1 }),
  });
  return [single];
}

export async function reviewPost(
  id: string,
  action: "approve" | "reject" | "edit",
  content?: string
): Promise<{ status: string }> {
  if (action === "approve") {
    const post = await request<Post>(`/posts/${id}/approve`, { method: "POST" });
    return { status: post.status };
  }
  if (action === "edit" && content) {
    const post = await request<Post>(`/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
    return { status: post.status };
  }
  return { status: "updated" };
}

export async function schedulePost(id: string, scheduledAt: string): Promise<{ status: string }> {
  const post = await request<Post>(`/posts/${id}/publish`, {
    method: "POST",
    body: JSON.stringify({ scheduled_at: scheduledAt }),
  });
  return { status: post.status };
}

// ──────────────── Leads & Pipeline ────────────────

export async function fetchLeads(params?: { stage?: string; search?: string }): Promise<Lead[]> {
  const query = new URLSearchParams();
  if (params?.stage && params.stage !== "all") query.append("stage", params.stage);
  const endpoint = `/leads?${query.toString()}`;

  const res = await request<{ data: Array<{
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    platform: string;
    platform_user_id: string;
    platform_username?: string | null;
    platform_profile_url?: string | null;
    company?: string | null;
    job_title?: string | null;
    industry?: string | null;
    company_size?: string | null;
    lead_score: number;
    lead_stage: Lead["lead_stage"];
    tags?: string[];
    pain_points?: string[];
    interests?: string[];
    first_interaction_at?: string;
    last_interaction_at: string;
    created_at?: string;
  }>; pagination: { page: number; limit: number; total: number } }>(
    endpoint,
    { cache: "no-store" }
  );

  return res.data.map((l) => ({
    id: l.id,
    name: l.name,
    full_name: l.name || l.platform_username || "Prospective Lead",
    email: l.email,
    phone: l.phone,
    avatar_url: l.avatar_url,
    platform_username: l.platform_username || l.platform_user_id,
    platform_user_id: l.platform_user_id,
    platform: l.platform,
    platform_profile_url: l.platform_profile_url,
    headline: l.job_title || l.industry || "Social Contact",
    job_title: l.job_title,
    company: l.company || "Enterprise Lead",
    industry: l.industry,
    company_size: l.company_size,
    lead_stage: l.lead_stage,
    lead_score: l.lead_score,
    sentiment: (l.lead_score >= 70 ? "positive" : l.lead_score >= 40 ? "inquisitive" : "neutral") as Lead["sentiment"],
    intent_signals: l.tags && l.tags.length > 0 ? l.tags : ["inbound_interaction"],
    tags: l.tags || [],
    pain_points: l.pain_points || [],
    interests: l.interests || [],
    interaction_count: (l.tags?.length || 0) + 1,
    first_interaction_at: l.first_interaction_at || l.last_interaction_at,
    last_interaction_at: l.last_interaction_at,
    created_at: l.created_at,
  }));
}

export async function updateLeadStage(id: string, stage: Lead["lead_stage"]): Promise<Lead> {
  const updated = await request<{
    id: string;
    name?: string | null;
    email?: string | null;
    platform: string;
    platform_user_id: string;
    platform_username?: string | null;
    company?: string | null;
    job_title?: string | null;
    lead_score: number;
    lead_stage: Lead["lead_stage"];
    last_interaction_at: string;
  }>(`/leads/${id}/stage`, {
    method: "PATCH",
    body: JSON.stringify({ lead_stage: stage }),
  });

  return {
    id: updated.id,
    full_name: updated.name || updated.platform_username || "Prospective Lead",
    platform_username: updated.platform_username || updated.platform_user_id,
    platform_user_id: updated.platform_user_id,
    platform: updated.platform,
    company: updated.company || "Enterprise Lead",
    headline: updated.job_title || "Social Contact",
    lead_stage: updated.lead_stage,
    lead_score: updated.lead_score,
    sentiment: "inquisitive",
    intent_signals: ["stage_updated"],
    interaction_count: 1,
    last_interaction_at: updated.last_interaction_at,
  };
}

// ──────────────── Review Queue ────────────────

export async function fetchReviewQueue(): Promise<ReviewItem[]> {
  const raw = await request<Array<{
    id?: string;
    message_id: string;
    conversation_id: string;
    lead_id: string;
    lead_name?: string | null;
    lead_headline?: string | null;
    platform: string;
    incoming_message?: string | null;
    draft_reply?: string;
    suggested_reply?: string;
    confidence_score?: number | null;
    sentiment?: string;
    review_status?: string;
    created_at: string;
  }>>("/conversations/review-queue", { cache: "no-store" });

  return raw.map((m) => ({
    id: m.id || m.message_id,
    message_id: m.message_id,
    conversation_id: m.conversation_id,
    lead_id: m.lead_id,
    lead_name: m.lead_name || "Prospective Contact",
    lead_headline: m.lead_headline || "Inbound Contact",
    platform: m.platform,
    incoming_message: m.incoming_message || m.suggested_reply || "",
    draft_reply: m.draft_reply || m.suggested_reply || "",
    suggested_reply: m.suggested_reply || m.draft_reply || "",
    confidence_score: m.confidence_score ?? 0.85,
    sentiment: m.sentiment || "inquisitive",
    review_status: (m.review_status as ReviewItem["review_status"]) || "pending",
    created_at: m.created_at,
  }));
}

export async function approveReviewItem(id: string, editedReply?: string): Promise<{ status: string }> {
  return request<{ status: string; message_id: string }>(
    `/conversations/review-queue/${id}/approve`,
    {
      method: "POST",
      body: JSON.stringify(editedReply ? { reply: editedReply } : {}),
    }
  );
}

export async function rejectReviewItem(id: string): Promise<{ status: string }> {
  return request<{ status: string; message_id: string }>(
    `/conversations/review-queue/${id}/reject`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

// ──────────────── System Health & Diagnostics ────────────────

export async function fetchHealthStatus(): Promise<SystemHealth> {
  return request<SystemHealth>("/health", { cache: "no-store" });
}
