"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Inbox,
  Users,
  Send,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Activity,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <AnimatedCheck size={12} delay={0.05} />
            Published
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Scheduled
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-white/5 text-muted-foreground border border-white/10">
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
          <Skeleton className="h-4 w-40 rounded-full bg-white/5" />
          <Skeleton className="h-12 w-80 rounded-2xl bg-white/5" />
          <Skeleton className="h-4 w-96 rounded-full bg-white/5" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel rounded-2xl p-6 space-y-4">
              <Skeleton className="h-4 w-28 bg-white/5" />
              <Skeleton className="h-10 w-20 bg-white/5" />
            </div>
          ))}
        </div>
        <div className="glass-panel rounded-2xl p-8 space-y-4">
          <Skeleton className="h-6 w-48 bg-white/5" />
          <Skeleton className="h-20 w-full bg-white/5" />
        </div>
      </div>
    );
  }

  const activeMetrics: DashboardMetrics = metrics || {
    total_posts_published: 0,
    review_queue_pending: 0,
    total_leads: 0,
    mql_sql_leads: 0,
    avg_response_time_sec: 0.0,
    recent_posts: [],
  };

  const kpis = [
    {
      label: "Verified Dispatches",
      value: activeMetrics.total_posts_published,
      icon: Send,
      sub: "Confirmed live on social channels",
      gradient: "from-cyan-500/10 via-transparent to-transparent",
    },
    {
      label: "Review Gate",
      value: activeMetrics.review_queue_pending,
      icon: Inbox,
      alert: activeMetrics.review_queue_pending > 0,
      href: "/review-queue",
      sub: activeMetrics.review_queue_pending > 0 ? "Requires operator authorization" : "All dispatches authorized",
      gradient: activeMetrics.review_queue_pending > 0 ? "from-amber-500/10 via-transparent to-transparent" : "from-emerald-500/10 via-transparent to-transparent",
    },
    {
      label: "Qualified Leads (MQL/SQL)",
      value: activeMetrics.mql_sql_leads,
      icon: Users,
      sub: `${activeMetrics.total_leads} total prospects indexed`,
      gradient: "from-indigo-500/10 via-transparent to-transparent",
    },
    {
      label: "Agent Response Latency",
      value: `${activeMetrics.avg_response_time_sec.toFixed(1)}s`,
      icon: Activity,
      sub: "Measured autonomous cycle time",
      gradient: "from-violet-500/10 via-transparent to-transparent",
    },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Editorial Hero Statement */}
      <FadeIn>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
              <PulseBeacon status={error ? "idle" : "live"} />
              <span className="text-[11px] font-mono font-medium tracking-wide uppercase text-muted-foreground">
                {error ? "Standby / Local Simulation Mode" : "Autonomous Engine Active"}
              </span>
            </div>

            {error && (
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono hover:bg-amber-500/20 transition-all"
              >
                <RefreshCw className="h-3 w-3" />
                Backend offline · Click to reconnect
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Command <span className="text-gradient-cyan">Center</span>
              </h1>
              <p className="mt-2 text-base text-muted-foreground max-w-2xl leading-relaxed">
                Real-time operational visibility into autonomous content generation, approval gates, and BANT-qualified prospect funnels.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/studio">
                <Button
                  size="lg"
                  className="rounded-xl px-5 h-11 text-sm font-medium bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white shadow-[0_0_25px_-5px_rgba(56,189,248,0.4)] transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Launch Studio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Spacious KPI Metric Cards */}
      <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <StaggerItem key={kpi.label}>
              <div
                className={`group relative glass-panel glass-panel-hover rounded-2xl p-6 lg:p-7 overflow-hidden border border-white/[0.08] ${
                  kpi.alert ? "ring-1 ring-amber-500/40" : ""
                }`}
              >
                {/* Subtle top ambient glow */}
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${kpi.gradient} opacity-80`}
                />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground/80">
                      {kpi.label}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-muted-foreground group-hover:text-white transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-display text-4xl lg:text-5xl font-extrabold text-white tracking-tight tabular-nums">
                      {kpi.value}
                    </div>
                    <p className="text-xs text-muted-foreground/90 font-sans">{kpi.sub}</p>
                  </div>

                  {kpi.alert && kpi.href && (
                    <div className="pt-2">
                      <Link href={kpi.href}>
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs font-medium rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 gap-1.5 transition-all"
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
        <div className="glass-panel rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 lg:px-8 border-b border-white/[0.07] bg-white/[0.01]">
            <div>
              <h2 className="font-display text-lg font-bold text-white tracking-tight">
                Live Content Dispatches
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Authentic dispatches published or scheduled across connected social channels
              </p>
            </div>
            <Link href="/studio">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-white hover:bg-white/[0.06] rounded-xl">
                Open Studio
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Content Body */}
          <div className="p-0">
            {activeMetrics.recent_posts.length === 0 ? (
              <div className="py-16 px-6 text-center space-y-4 max-w-md mx-auto">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08] text-muted-foreground mx-auto">
                  <Send className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-semibold text-white text-base">No Dispatches Generated Yet</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your social channels are clean. Feed a campaign brief to Content Studio to let autonomous agents draft your next viral dispatch.
                  </p>
                </div>
                <Link href="/studio">
                  <Button
                    size="sm"
                    className="mt-2 rounded-xl text-xs bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.1] gap-1.5"
                  >
                    Draft First Brief
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {metrics.recent_posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground/80 tabular-nums">
                          {formatRelativeTime(post.created_at)}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-muted-foreground">
                          LinkedIn
                        </span>
                      </div>
                      <p className="font-sans text-sm text-foreground/95 leading-relaxed font-normal">
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
