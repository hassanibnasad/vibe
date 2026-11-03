"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Inbox,
  Users,
  Send,
  ArrowRight,
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Link2,
  Database,
  Check,
  ChevronRight,
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchDashboardMetrics,
  fetchPosts,
  fetchConnectors,
  fetchBrandProfile,
  fetchKnowledgeDocs,
  DashboardMetrics,
  Post,
  SocialConnection,
  BrandProfile,
  KnowledgeDoc,
} from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/utils";
import { FadeIn, StaggerContainer, StaggerItem } from "@/lib/motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardSpotlight } from "@/components/ui/CardSpotlight";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [connectors, setConnectors] = useState<SocialConnection[]>([]);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checklistDismissed, setChecklistDismissed] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);

    Promise.allSettled([
      fetchDashboardMetrics(),
      fetchPosts(),
      fetchConnectors(),
      fetchBrandProfile(),
      fetchKnowledgeDocs(),
    ]).then(([metricsRes, postsRes, connRes, brandRes, docsRes]) => {
      if (metricsRes.status === "fulfilled") setMetrics(metricsRes.value);
      if (postsRes.status === "fulfilled") setPosts(postsRes.value);
      if (connRes.status === "fulfilled") setConnectors(connRes.value);
      if (brandRes.status === "fulfilled") setBrandProfile(brandRes.value);
      if (docsRes.status === "fulfilled") setDocs(docsRes.value);

      if (metricsRes.status === "rejected" && postsRes.status === "rejected") {
        setError("Unable to connect to VibeAgent backend. Ensure services are running.");
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived setup checklist items
  const isLinkedInConnected = connectors.some(
    (c) => c.provider.toLowerCase() === "linkedin" && c.status === "active"
  );
  const isBrandConfigured = Boolean(brandProfile && brandProfile.brand_name);
  const isKnowledgeIndexed = docs.length > 0;
  const isFirstPostCreated = (metrics?.total_posts_published || 0) > 0 || posts.length > 0;

  const checklist = [
    {
      id: "brand",
      title: "Configure brand voice & guidelines",
      description: "Define archetype, value propositions, and guardrails",
      completed: isBrandConfigured,
      href: "/brand",
      actionText: "Configure brand",
      icon: ShieldCheck,
    },
    {
      id: "linkedin",
      title: "Connect LinkedIn account",
      description: "Authorize OAuth to enable automated publishing",
      completed: isLinkedInConnected,
      href: "/connections",
      actionText: "Connect LinkedIn",
      icon: Link2,
    },
    {
      id: "knowledge",
      title: "Index knowledge documents",
      description: "Upload product specs or guidelines for vector grounding",
      completed: isKnowledgeIndexed,
      href: "/knowledge",
      actionText: "Upload document",
      icon: Database,
    },
    {
      id: "post",
      title: "Draft and schedule first post",
      description: "Create an authentic LinkedIn post in Studio",
      completed: isFirstPostCreated,
      href: "/studio",
      actionText: "Open studio",
      icon: Send,
    },
  ];

  const completedCount = checklist.filter((item) => item.completed).length;
  const showChecklist = !checklistDismissed && completedCount < 4;

  // "Needs your attention" urgent items
  const failedPosts = posts.filter((p) => p.status === "failed");
  const reviewPendingCount = metrics?.review_queue_pending || 0;
  const disconnectedConnectors = connectors.filter((c) => c.status !== "active");

  const attentionItems: {
    id: string;
    title: string;
    description: string;
    type: "warning" | "danger" | "info";
    href: string;
    actionText: string;
  }[] = [];

  if (reviewPendingCount > 0) {
    attentionItems.push({
      id: "reviews",
      title: `${reviewPendingCount} item${reviewPendingCount > 1 ? "s" : ""} waiting for review`,
      description: "Inbound replies or generated drafts require operator approval before dispatch.",
      type: "warning",
      href: "/review-queue",
      actionText: "Review items",
    });
  }

  if (failedPosts.length > 0) {
    attentionItems.push({
      id: "failed-posts",
      title: `${failedPosts.length} post dispatch${failedPosts.length > 1 ? "es" : ""} failed`,
      description: "Network or authorization error during publication. Inspection recommended.",
      type: "danger",
      href: "/calendar",
      actionText: "View failed posts",
    });
  }

  if (disconnectedConnectors.length > 0) {
    attentionItems.push({
      id: "disconnected",
      title: "LinkedIn connection offline",
      description: "Authentication expired. Reconnect to resume scheduled publishing.",
      type: "warning",
      href: "/connections",
      actionText: "Reconnect account",
    });
  }

  // "Coming up this week" posts
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const scheduledUpcoming = posts.filter((p) => {
    if (p.status !== "scheduled" || !p.scheduled_at) return false;
    const postDate = new Date(p.scheduled_at);
    return postDate >= now && postDate <= nextWeek;
  });

  // Real published results
  const publishedPosts = posts.filter((p) => p.status === "published");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 pb-6 border-b border-border/40">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border/80 bg-card p-5 space-y-3">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* ── Shopify Editions Chapter Banner ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded bg-primary/10 border border-primary/25 text-primary font-semibold">
              Edition 2026
            </span>
            <span className="text-muted-foreground font-mono text-[11px]">· Operational Command</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-foreground tracking-tight">
            Today
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time synthesis telemetry, scheduled queues, and qualified lead conversion strata.
          </p>
        </div>

        {error && (
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono hover:bg-amber-500/20 transition-all duration-150"
          >
            <RefreshCw className="h-3 w-3" />
            Reconnect backend
          </button>
        )}
      </div>

      {/* Setup Checklist (Shown on first-run or incomplete setup) */}
      {showChecklist && (
        <FadeIn>
          <div className="rounded-xl border border-border/80 bg-card/90 p-5 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Activation Checklist</h2>
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    [{completedCount} / {checklist.length}]
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                  Complete these steps to activate automated LinkedIn content generation and lead tracking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChecklistDismissed(true)}
                className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
              >
                Dismiss
              </button>
            </div>

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {checklist.map((item) => {
                const Icon = item.icon;
                return (
                  <StaggerItem key={item.id}>
                    <div
                      className={`rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                        item.completed
                          ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                          : "border-border/80 bg-surface/50 hover:border-border-strong hover:bg-surface"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Icon className={`h-4 w-4 ${item.completed ? "text-primary" : "text-muted-foreground"}`} />
                          {item.completed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-primary">
                              <Check className="h-3 w-3" /> Done
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-muted-foreground">Pending</span>
                          )}
                        </div>
                        <h3 className="text-xs font-semibold text-foreground leading-snug">{item.title}</h3>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{item.description}</p>
                      </div>

                      {!item.completed && (
                        <div className="pt-3">
                          <Link href={item.href}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-7 text-xs font-medium gap-1"
                            >
                              <span>{item.actionText}</span>
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </FadeIn>
      )}

      {/* Needs Your Attention List */}
      <FadeIn delay={0.1}>
        <div className="rounded-xl border border-border/80 bg-card/90 p-5 space-y-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Needs your attention</h2>
              {attentionItems.length > 0 ? (
                <Badge variant="warning" className="text-[10px] font-mono tabular-nums">
                  {attentionItems.length} active
                </Badge>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-primary font-mono font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> All clear
                </span>
              )}
            </div>
          </div>

          {attentionItems.length === 0 ? (
            <div className="rounded-lg border border-border/60 bg-surface/50 p-3 text-xs text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span>No blocked drafts, failed dispatches, or offline connectors requiring operator intervention.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {attentionItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all duration-150 ${
                    item.type === "danger"
                      ? "border-rose-500/30 bg-rose-500/[0.04]"
                      : "border-amber-500/30 bg-amber-500/[0.04]"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        item.type === "danger" ? "text-rose-400" : "text-amber-400"
                      }`}
                    />
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">{item.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <Link href={item.href} className="shrink-0">
                    <Button
                      size="sm"
                      className={`h-7 text-xs font-medium gap-1 rounded-lg ${
                        item.type === "danger"
                          ? "bg-rose-600 text-white hover:bg-rose-500"
                          : "bg-amber-600 text-white hover:bg-amber-500"
                      }`}
                    >
                      <span>{item.actionText}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </FadeIn>

      {/* Compact 3-Metric Stats Row — Shopify Editions Bento Cards */}
      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Published posts",
            value: metrics?.total_posts_published ?? 0,
            sub: "Live across connected channels",
            icon: Send,
          },
          {
            label: "Waiting for review",
            value: metrics?.review_queue_pending ?? 0,
            sub: reviewPendingCount > 0 ? "Requires operator action" : "All drafts authorized",
            icon: Inbox,
          },
          {
            label: "Qualified leads",
            value: metrics?.mql_sql_leads ?? 0,
            sub: `From ${metrics?.total_leads ?? 0} indexed contacts`,
            icon: Users,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.label}>
              <CardSpotlight className="p-5 space-y-2 group">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium font-mono uppercase tracking-wider">{stat.label}</span>
                  <Icon className="h-4 w-4 group-hover:text-primary transition-colors" />
                </div>
                <div className="font-display text-4xl font-bold text-foreground tabular-nums tracking-tight">
                  {stat.value}
                </div>
                <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
              </CardSpotlight>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Dual Core Sections: Coming Up This Week & Real Post Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coming up this week */}
        <FadeIn delay={0.15}>
          <div className="rounded-xl border border-border/80 bg-card/90 overflow-hidden flex flex-col backdrop-blur-md shadow-subtle">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/70">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                  Coming up this week
                </h2>
              </div>
              <Link href="/calendar">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground">
                  Calendar
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </Link>
            </div>

            <div className="p-0 flex-1">
              {scheduledUpcoming.length === 0 ? (
                <div className="py-10 px-5 text-center space-y-2">
                  <Clock className="h-6 w-6 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs text-muted-foreground">No posts scheduled for the next 7 days.</p>
                  <Link href="/studio">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 mt-1">
                      <Plus className="h-3 w-3" /> Schedule a post
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {scheduledUpcoming.map((post) => (
                    <div key={post.id} className="p-3.5 space-y-1.5 hover:bg-surface/50 transition-colors">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-muted-foreground">
                          {post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Scheduled"}
                        </span>
                        <Badge variant="scheduled" className="text-[10px] font-mono py-0">
                          Scheduled
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground line-clamp-2 leading-relaxed">{post.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Real Post Results */}
        <FadeIn delay={0.2}>
          <div className="rounded-xl border border-border/80 bg-card/90 overflow-hidden flex flex-col backdrop-blur-md shadow-subtle">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/70">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                  Recent published posts
                </h2>
              </div>
              <Link href="/studio">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground">
                  Studio
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </Link>
            </div>

            <div className="p-0 flex-1">
              {publishedPosts.length === 0 ? (
                <div className="py-10 px-5 text-center space-y-2">
                  <Send className="h-6 w-6 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs text-muted-foreground">No posts published yet.</p>
                  <Link href="/studio">
                    <Button size="sm" className="h-7 text-xs gap-1 mt-1 bg-foreground text-background">
                      <Plus className="h-3 w-3" /> Create first post
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {publishedPosts.slice(0, 4).map((post) => (
                    <div key={post.id} className="p-3.5 space-y-1.5 hover:bg-surface/50 transition-colors">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-muted-foreground">
                          {formatRelativeTime(post.created_at)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="published" className="text-[10px] font-mono py-0">
                            <Check className="h-2.5 w-2.5 mr-1" /> Published
                          </Badge>
                          {post.platform_post_url && (
                            <a
                              href={post.platform_post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="View live on LinkedIn"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-foreground line-clamp-2 leading-relaxed">{post.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
