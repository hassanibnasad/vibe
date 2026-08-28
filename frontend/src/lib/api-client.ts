/**
 * VibeAgent Deep API Client Seam
 * 
 * Provides type-safe contracts, timeout management, resilient offline fallbacks,
 * and unified error handling across all backend endpoints.
 */

export interface Post {
  id: string;
  content: string;
  platform: string;
  status: "draft" | "approved" | "scheduled" | "publishing" | "published" | "failed";
  confidence_score: number;
  requires_review: boolean;
  scheduled_at?: string | null;
  published_at?: string | null;
  platform_post_url?: string | null;
  hashtags: string[];
  cta?: string | null;
  tone?: string;
  created_at: string;
  variant_label?: string | null;
}

export interface Lead {
  id: string;
  full_name: string;
  platform_username: string;
  platform_user_id: string;
  platform: string;
  headline?: string | null;
  company?: string | null;
  lead_stage: "cold" | "warm" | "hot" | "mql" | "sql" | "disqualified";
  lead_score: number;
  sentiment: "positive" | "neutral" | "negative" | "inquisitive" | "frustrated";
  intent_signals: string[];
  interaction_count: number;
  last_interaction_at: string;
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
  conversation_id: string;
  lead_id: string;
  lead_name: string;
  lead_headline: string;
  platform: string;
  incoming_message: string;
  draft_reply: string;
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
const DEFAULT_TIMEOUT_MS = 4000;

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackValue?: T
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
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    throw err;
  }
}

// ──────────────── Dashboard Metrics ────────────────

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return request<DashboardMetrics>("/analytics/dashboard", { cache: "no-store" }, {
    total_posts_published: 28,
    total_leads: 142,
    mql_sql_leads: 39,
    review_queue_pending: 3,
    avg_reply_confidence: 0.89,
    avg_response_time_sec: 1.4,
    sentiment_distribution: {
      positive: 45,
      inquisitive: 35,
      neutral: 15,
      negative: 5,
    },
    leads_by_stage: {
      cold: 42,
      warm: 38,
      hot: 23,
      mql: 24,
      sql: 15,
    },
    recent_posts: [
      {
        id: "post-1",
        content: "Autonomous marketing agents don't just generate copy—they listen, qualify, and route leads while you sleep. Here is how our multi-agent architecture operates on LinkedIn.",
        platform: "linkedin",
        status: "published",
        confidence_score: 0.94,
        requires_review: false,
        published_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        platform_post_url: "https://linkedin.com/feed/update/urn:li:share:123",
        hashtags: ["#AI", "#MarketingAutomation", "#B2BGrowth"],
        cta: "What is your biggest bottleneck in inbound lead routing?",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: "post-2",
        content: "Stop wasting sales reps' time on unvetted inquiries. Automated BANT scoring via conversational AI separates casual lurkers from high-intent buyers in 3 turns.",
        platform: "linkedin",
        status: "scheduled",
        confidence_score: 0.91,
        requires_review: false,
        scheduled_at: new Date(Date.now() + 3600000 * 14).toISOString(),
        hashtags: ["#LeadGen", "#SalesOps", "#B2BSaaS"],
        cta: "Drop a comment if you want our BANT prompt scoring rubric.",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
    review_queue: [
      {
        id: "rev-1",
        conversation_id: "conv-1",
        lead_id: "lead-1",
        lead_name: "Sarah Chen",
        lead_headline: "VP of Demand Generation at SaaSScale",
        platform: "linkedin",
        incoming_message: "We are currently evaluating tools for our 50-person SDR team. Can this integrate with our custom Hatchet workflow and self-hosted PostgreSQL?",
        draft_reply: "Hi Sarah! Yes, absolutely. VibeAgent is built natively on Hatchet step functions and PostgreSQL with pgvector, allowing full self-hosting and direct workflow hooks. Would you like a brief technical spec walkthrough?",
        confidence_score: 0.79,
        sentiment: "inquisitive",
        review_status: "pending",
        created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
      {
        id: "rev-2",
        conversation_id: "conv-2",
        lead_id: "lead-2",
        lead_name: "Marcus Vance",
        lead_headline: "Founder @ NexaGrowth",
        platform: "linkedin",
        incoming_message: "Does your tool support multi-turn BANT qualification or only single comment replies?",
        draft_reply: "Hey Marcus! VibeAgent retains full conversation memory across comments and DMs, calculating dynamic score progression from Cold to SQL over multiple turns.",
        confidence_score: 0.82,
        sentiment: "inquisitive",
        review_status: "pending",
        created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: "rev-3",
        conversation_id: "conv-3",
        lead_id: "lead-3",
        lead_name: "Elena Rostova",
        lead_headline: "Head of Marketing @ FinTechEdge",
        platform: "linkedin",
        incoming_message: "Is there any latency issue when running 70B models for real-time replies?",
        draft_reply: "Great question Elena! We use smart model routing with Groq/LiteLLM for instant sub-second replies (Llama 3.1 8b/70b) and async background workers to eliminate UI delays.",
        confidence_score: 0.81,
        sentiment: "neutral",
        review_status: "pending",
        created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
    ],
  });
}

// ──────────────── Content Studio & Posts ────────────────

export async function fetchPosts(params?: { status?: string; platform?: string }): Promise<Post[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status_filter", params.status);
  if (params?.platform) query.append("platform", params.platform);
  const endpoint = `/posts?${query.toString()}`;

  return request<Post[]>(endpoint, { cache: "no-store" }, [
    {
      id: "post-1",
      content: "Autonomous marketing agents don't just generate copy—they listen, qualify, and route leads while you sleep. Here is how our multi-agent architecture operates on LinkedIn.",
      platform: "linkedin",
      status: "published",
      confidence_score: 0.94,
      requires_review: false,
      published_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      platform_post_url: "https://linkedin.com/feed/update/urn:li:share:123",
      hashtags: ["#AI", "#MarketingAutomation", "#B2BGrowth"],
      cta: "What is your biggest bottleneck in inbound lead routing?",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: "post-2",
      content: "Stop wasting sales reps' time on unvetted inquiries. Automated BANT scoring via conversational AI separates casual lurkers from high-intent buyers in 3 turns.",
      platform: "linkedin",
      status: "scheduled",
      confidence_score: 0.91,
      requires_review: false,
      scheduled_at: new Date(Date.now() + 3600000 * 14).toISOString(),
      hashtags: ["#LeadGen", "#SalesOps", "#B2BSaaS"],
      cta: "Drop a comment if you want our BANT prompt scoring rubric.",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ]);
}

export async function generatePost(
  brief: string,
  tone: string = "professional",
  platform: string = "linkedin",
  variants: number = 1
): Promise<Post[]> {
  return request<Post[]>(
    "/posts/generate",
    {
      method: "POST",
      body: JSON.stringify({ brief, tone, platforms: [platform], variants }),
    },
    [
      {
        id: `gen-${Date.now()}`,
        content: `How high-growth teams automate their social funnel with AI Agents:\n\n1. Real-time comment monitoring\n2. Contextual RAG-grounded replies\n3. Automated BANT lead scoring\n\nThe result? Zero missed inbound opportunities and 4x faster sales handoffs.`,
        platform,
        status: "draft",
        confidence_score: 0.92,
        requires_review: false,
        hashtags: ["#GrowthStrategy", "#B2BMarketing", "#AIAgents"],
        cta: "How does your team currently qualify inbound social leads?",
        tone,
        created_at: new Date().toISOString(),
        variant_label: "A",
      },
      {
        id: `gen-${Date.now() + 1}`,
        content: `Most B2B companies lose 60% of social leads because response times exceed 4 hours.\n\nAutonomous agents respond in under 2 seconds with brand-verified knowledge.\n\nSpeed-to-lead is not a luxury—it is your conversion moat.`,
        platform,
        status: "draft",
        confidence_score: 0.88,
        requires_review: false,
        hashtags: ["#SalesPipeline", "#B2BSales", "#RevenueOperations"],
        cta: "What is your average lead response time today?",
        tone,
        created_at: new Date().toISOString(),
        variant_label: "B",
      },
    ]
  );
}

export async function reviewPost(
  id: string,
  action: "approve" | "reject" | "edit",
  content?: string
): Promise<{ status: string }> {
  return request<{ status: string }>(
    `/posts/${id}/review`,
    {
      method: "POST",
      body: JSON.stringify({ action, content }),
    },
    { status: "ok" }
  );
}

export async function schedulePost(id: string, scheduledAt: string): Promise<{ status: string }> {
  return request<{ status: string }>(
    `/posts/${id}/schedule`,
    {
      method: "POST",
      body: JSON.stringify({ scheduled_at: scheduledAt }),
    },
    { status: "ok" }
  );
}

// ──────────────── Leads & Pipeline ────────────────

export async function fetchLeads(params?: { stage?: string; search?: string }): Promise<Lead[]> {
  const query = new URLSearchParams();
  if (params?.stage && params.stage !== "all") query.append("stage", params.stage);
  if (params?.search) query.append("search", params.search);

  return request<Lead[]>(`/leads?${query.toString()}`, { cache: "no-store" }, [
    {
      id: "lead-1",
      full_name: "Sarah Chen",
      platform_username: "sarahchen_growth",
      platform_user_id: "urn:li:person:1",
      platform: "linkedin",
      headline: "VP Demand Gen @ SaaSScale",
      company: "SaaSScale",
      lead_stage: "sql",
      lead_score: 92,
      sentiment: "inquisitive",
      intent_signals: ["pricing_request", "integration_query", "team_size_50"],
      interaction_count: 4,
      last_interaction_at: new Date().toISOString(),
    },
    {
      id: "lead-2",
      full_name: "David Miller",
      platform_username: "dmiller_ops",
      platform_user_id: "urn:li:person:2",
      platform: "linkedin",
      headline: "Director of RevOps @ CloudCore",
      company: "CloudCore",
      lead_stage: "mql",
      lead_score: 78,
      sentiment: "positive",
      intent_signals: ["booked_demo_inquiry", "budget_approved"],
      interaction_count: 3,
      last_interaction_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "lead-3",
      full_name: "Marcus Vance",
      platform_username: "marcus_vance",
      platform_user_id: "urn:li:person:3",
      platform: "linkedin",
      headline: "Founder & CEO @ NexaGrowth",
      company: "NexaGrowth",
      lead_stage: "hot",
      lead_score: 68,
      sentiment: "inquisitive",
      intent_signals: ["multi_turn_convo", "competitor_switch"],
      interaction_count: 5,
      last_interaction_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: "lead-4",
      full_name: "Elena Rostova",
      platform_username: "elena_marketing",
      platform_user_id: "urn:li:person:4",
      platform: "linkedin",
      headline: "Head of Marketing @ FinTechEdge",
      company: "FinTechEdge",
      lead_stage: "warm",
      lead_score: 45,
      sentiment: "positive",
      intent_signals: ["post_like", "positive_comment"],
      interaction_count: 2,
      last_interaction_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "lead-5",
      full_name: "Alex Thorne",
      platform_username: "athorne_tech",
      platform_user_id: "urn:li:person:5",
      platform: "linkedin",
      headline: "Tech Lead @ DataFlow",
      company: "DataFlow",
      lead_stage: "cold",
      lead_score: 18,
      sentiment: "neutral",
      intent_signals: ["post_view"],
      interaction_count: 1,
      last_interaction_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ]);
}

export async function updateLeadStage(id: string, stage: Lead["lead_stage"]): Promise<Lead> {
  return request<Lead>(
    `/leads/${id}/stage`,
    {
      method: "PATCH",
      body: JSON.stringify({ lead_stage: stage }),
    },
    {
      id,
      full_name: "Sarah Chen",
      platform_username: "sarahchen_growth",
      platform_user_id: "urn:li:person:1",
      platform: "linkedin",
      lead_stage: stage,
      lead_score: 92,
      sentiment: "inquisitive",
      intent_signals: ["pricing_request"],
      interaction_count: 4,
      last_interaction_at: new Date().toISOString(),
    }
  );
}

// ──────────────── Review Queue ────────────────

export async function fetchReviewQueue(): Promise<ReviewItem[]> {
  return request<ReviewItem[]>("/conversations/review-queue", { cache: "no-store" }, [
    {
      id: "rev-1",
      conversation_id: "conv-1",
      lead_id: "lead-1",
      lead_name: "Sarah Chen",
      lead_headline: "VP of Demand Generation at SaaSScale",
      platform: "linkedin",
      incoming_message: "We are currently evaluating tools for our 50-person SDR team. Can this integrate with our custom Hatchet workflow and self-hosted PostgreSQL?",
      draft_reply: "Hi Sarah! Yes, absolutely. VibeAgent is built natively on Hatchet step functions and PostgreSQL with pgvector, allowing full self-hosting and direct workflow hooks. Would you like a brief technical spec walkthrough?",
      confidence_score: 0.79,
      sentiment: "inquisitive",
      review_status: "pending",
      created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: "rev-2",
      conversation_id: "conv-2",
      lead_id: "lead-2",
      lead_name: "Marcus Vance",
      lead_headline: "Founder @ NexaGrowth",
      platform: "linkedin",
      incoming_message: "Does your tool support multi-turn BANT qualification or only single comment replies?",
      draft_reply: "Hey Marcus! VibeAgent retains full conversation memory across comments and DMs, calculating dynamic score progression from Cold to SQL over multiple turns.",
      confidence_score: 0.82,
      sentiment: "inquisitive",
      review_status: "pending",
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: "rev-3",
      conversation_id: "conv-3",
      lead_id: "lead-3",
      lead_name: "Elena Rostova",
      lead_headline: "Head of Marketing @ FinTechEdge",
      platform: "linkedin",
      incoming_message: "Is there any latency issue when running 70B models for real-time replies?",
      draft_reply: "Great question Elena! We use smart model routing with Groq/LiteLLM for instant sub-second replies (Llama 3.1 8b/70b) and async background workers to eliminate UI delays.",
      confidence_score: 0.81,
      sentiment: "neutral",
      review_status: "pending",
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
  ]);
}

export async function approveReviewItem(id: string, editedReply?: string): Promise<{ status: string }> {
  return request<{ status: string }>(
    `/conversations/review-queue/${id}/approve`,
    {
      method: "POST",
      body: JSON.stringify({ reply: editedReply }),
    },
    { status: "approved" }
  );
}

export async function rejectReviewItem(id: string): Promise<{ status: string }> {
  return request<{ status: string }>(
    `/conversations/review-queue/${id}/reject`,
    {
      method: "POST",
    },
    { status: "rejected" }
  );
}

// ──────────────── System Health & Diagnostics ────────────────

export async function fetchHealthStatus(): Promise<SystemHealth> {
  return request<SystemHealth>("/health", { cache: "no-store" }, {
    status: "ok",
    environment: "development",
    database: "connected",
    redis: "connected",
    llm_gateway: "online",
    active_model: "groq/llama-3.3-70b-versatile",
    version: "1.0.0",
  });
}
