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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch {
    // Fallback to rich mock data
  }

  return {
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
        content: "Autonomous marketing agents don't just generate copy—they listen, qualify, and route leads while you sleep. Here's how our multi-agent architecture operates on LinkedIn.",
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
        incoming_message: "We're currently evaluating tools for our 50-person SDR team. Can this integrate with our custom Hatchet workflow and self-hosted PostgreSQL?",
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
      }
    ],
  };
}

export async function generatePost(brief: string, tone: string = "professional", platform: string = "linkedin", variants: number = 1): Promise<Post[]> {
  try {
    const res = await fetch(`${API_BASE}/posts/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief, tone, platforms: [platform], variants }),
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [data];
    }
  } catch {
    // Fallback simulated generation
  }

  return [
    {
      id: `gen-${Date.now()}`,
      content: `🚀 How high-growth teams automate their social funnel with AI Agents:\n\n1. Real-time comment monitoring\n2. Contextual RAG-grounded replies\n3. Automated BANT lead scoring\n\nThe result? Zero missed inbound opportunities and 4x faster sales handoffs.`,
      platform,
      status: "draft",
      confidence_score: 0.92,
      requires_review: false,
      hashtags: ["#GrowthHacking", "#B2BMarketing", "#AIAgents"],
      cta: "How does your team currently qualify inbound social leads?",
      tone,
      created_at: new Date().toISOString(),
      variant_label: "A",
    },
    {
      id: `gen-${Date.now() + 1}`,
      content: `Most B2B companies lose 60% of social leads because response times exceed 4 hours.\n\nAutonomous agents respond in under 2 seconds with brand-verified knowledge.\n\nSpeed-to-lead isn't a luxury—it's your conversion moat.`,
      platform,
      status: "draft",
      confidence_score: 0.88,
      requires_review: false,
      hashtags: ["#SalesPipeline", "#B2BSales", "#RevenueOperations"],
      cta: "What is your average lead response time today?",
      tone,
      created_at: new Date().toISOString(),
      variant_label: "B",
    }
  ];
}
