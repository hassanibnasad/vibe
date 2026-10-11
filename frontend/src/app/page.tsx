"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Inbox,
  Users,
  Send,
  ArrowRight,
  RefreshCw,
  Activity,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardMetrics, DashboardMetrics, Post } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/utils";
import { FadeIn, StaggerContainer, StaggerItem } from "@/lib/motion";
import { AnimatedCheck, PulseBeacon } from "@/components/ui/AnimatedCheck";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchDashboardMetrics()
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to connect to VibeAgent API backend. Ensure services are running.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: Post["status"]) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <AnimatedCheck size={12} delay={0.05} />
            Published
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-secondary text-foreground border border-border">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/70 animate-pulse" />
            Scheduled
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground border border-border">
            Draft
          </span>
        );
    }
  };

  // Loading skeleton state
  if (loading) {
    return (
      <div className="space-y-12">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40 rounded-full bg-muted" />
          <Skeleton className="h-12 w-80 rounded-xl bg-muted" />
          <Skeleton className="h-4 w-96 rounded-full bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-4">
              <Skeleton className="h-4 w-28 bg-muted" />
              <Skeleton className="h-10 w-20 bg-muted" />
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-8 space-y-4">
          <Skeleton className="h-6 w-48 bg-muted" />
          <Skeleton className="h-20 w-full bg-muted" />
        </div>
      </div>
    );
  }

  const activeMetrics: DashboardMetrics = metrics || {
    total_posts_published: 0,
    review_queue_pending: 0,
    total_leads: 0,
    mql_sql_leads: 0,
    avg_reply_confidence: 0,
    avg_response_time_sec: 0.0,
    sentiment_distribution: {
      positive: 0,
      neutral: 0,
      inquisitive: 0,
      negative: 0,
    },
    leads_by_stage: {
      cold: 0,
      warm: 0,
      hot: 0,
      mql: 0,
      sql: 0,
    },
    recent_posts: [],
    review_queue: [],
  };

  const kpis = [
    {
      label: "Verified Dispatches",
      value: activeMetrics.total_posts_published,
      icon: Send,
      sub: "Confirmed live on social channels",
    },
    {
      label: "Review Gate",
      value: activeMetrics.review_queue_pending,
      icon: Inbox,
      alert: activeMetrics.review_queue_pending > 0,
      href: "/review-queue",
      sub: activeMetrics.review_queue_pending > 0 ? "Requires operator authorization" : "All dispatches authorized",
    },
    {
      label: "Qualified Leads (MQL/SQL)",
      value: activeMetrics.mql_sql_leads,
      icon: Users,
      sub: `${activeMetrics.total_leads} total prospects indexed`,
    },
    {
      label: "Agent Response Latency",
      value: `${activeMetrics.avg_response_time_sec.toFixed(1)}s`,
      icon: Activity,
      sub: "Measured autonomous cycle time",
    },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Editorial Hero Statement */}
      <FadeIn>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border">
              <PulseBeacon status={error ? "idle" : "live"} />
              <span className="text-[11px] font-mono font-medium tracking-wide uppercase text-muted-foreground">
                {error ? "Standby / Local Simulation Mode" : "Autonomous Engine Active"}
              </span>
            </div>

            {error && (
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-mono hover:bg-amber-500/20 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Backend offline · Click to reconnect
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
                Command Center
              </h1>
              <p className="mt-2 text-base text-muted-foreground max-w-2xl leading-relaxed">
                Real-time operational visibility into autonomous content generation, approval gates, and BANT-qualified prospect funnels.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/studio">
                <Button
                  size="lg"
                  className="rounded-lg px-5 h-10 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-subtle"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Launch Studio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* High-Contrast Clean Metric Cards */}
      <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <StaggerItem key={kpi.label}>
              <div
                className={`group relative bg-card rounded-xl p-6 lg:p-7 border transition-colors ${
                  kpi.alert
                    ? "border-amber-500/50"
                    : "border-border hover:border-border-strong"
                }`}
              >
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">
                      {kpi.label}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-border text-muted-foreground group-hover:text-foreground transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-display text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight tabular-nums">
                      {kpi.value}
                    </div>
                    <p className="text-xs text-muted-foreground font-sans">{kpi.sub}</p>
                  </div>

                  {kpi.alert && kpi.href && (
                    <div className="pt-2">
                      <Link href={kpi.href}>
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs font-medium rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 gap-1.5 transition-colors"
                        >
                          Triage Pending ({kpi.value})
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Live Dispatches Section */}
      <FadeIn delay={0.2}>
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-subtle">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 lg:px-8 border-b border-border bg-card">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground tracking-tight">
                Live Content Dispatches
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Authentic dispatches published or scheduled across connected social channels
              </p>
            </div>
            <Link href="/studio">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg">
                Open Studio
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Content Body */}
          <div className="p-0">
            {activeMetrics.recent_posts.length === 0 ? (
              <div className="py-16 px-6 text-center space-y-4 max-w-md mx-auto">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface border border-border text-muted-foreground mx-auto">
                  <Send className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-semibold text-foreground text-base">No Dispatches Generated Yet</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your social channels are clean. Feed a campaign brief to Content Studio to let autonomous agents draft your next dispatch.
                  </p>
                </div>
                <Link href="/studio">
                  <Button
                    size="sm"
                    className="mt-2 rounded-lg text-xs bg-foreground text-background hover:bg-foreground/90 gap-1.5 font-medium"
                  >
                    Draft First Brief
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activeMetrics.recent_posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-accent/40 transition-colors"
                  >
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {formatRelativeTime(post.created_at)}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface border border-border text-muted-foreground">
                          LinkedIn
                        </span>
                      </div>
                      <p className="font-sans text-sm text-foreground leading-relaxed font-normal">
                        {post.content.split("\n")[0]}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {getStatusBadge(post.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
