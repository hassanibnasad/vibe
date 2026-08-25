"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Inbox,
  Users,
  Send,
  Zap,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fetchDashboardMetrics, DashboardMetrics } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/utils";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardMetrics().then((data) => {
      setMetrics(data);
      setLoading(false);
    });
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-purple-400">
          <Zap className="h-6 w-6 animate-pulse" />
          <span className="text-sm font-medium">Connecting to VibeAgent Gateway...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome & Review Queue Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-indigo-950/40 p-6 backdrop-blur-xl shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white tracking-tight">Autonomous Engine Active</h2>
          </div>
          <p className="text-sm text-slate-400">
            Monitoring LinkedIn interactions, drafting contextual replies, and scoring leads in real time.
          </p>
        </div>

        {metrics.review_queue_pending > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>{metrics.review_queue_pending} Replies Need Review</span>
              </div>
              <p className="text-[11px] text-slate-400">Confidence below threshold (0.85)</p>
            </div>
            <Link href="/review-queue">
              <Button variant="emerald" className="gap-2 rounded-xl">
                <span>Open Review Queue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Published Posts</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Send className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white">{metrics.total_posts_published}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+18% vs last week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Leads Identified</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white">{metrics.total_leads}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-400">
                <span>Across all campaigns</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Qualified Leads (MQL/SQL)</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white">{metrics.mql_sql_leads}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>27.4% conversion rate</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Avg AI Reply Speed</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white">{metrics.avg_response_time_sec}s</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-cyan-400">
                <span>Groq Llama-3.3 70B</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Funnel & Review Queue Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lead Funnel Pipeline Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>BANT Funnel Progression</span>
              <Link href="/leads" className="text-xs text-purple-400 hover:underline">
                View Kanban
              </Link>
            </CardTitle>
            <CardDescription>
              Dynamic stage transitions based on conversational intent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Sales Qualified (SQL)</span>
                <span className="font-semibold text-purple-300">{metrics.leads_by_stage.sql} leads</span>
              </div>
              <Progress value={(metrics.leads_by_stage.sql / metrics.total_leads) * 100} className="h-2" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Marketing Qualified (MQL)</span>
                <span className="font-semibold text-cyan-300">{metrics.leads_by_stage.mql} leads</span>
              </div>
              <Progress value={(metrics.leads_by_stage.mql / metrics.total_leads) * 100} className="h-2" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Hot Intent</span>
                <span className="font-semibold text-orange-300">{metrics.leads_by_stage.hot} leads</span>
              </div>
              <Progress value={(metrics.leads_by_stage.hot / metrics.total_leads) * 100} className="h-2" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Warm Engagement</span>
                <span className="font-semibold text-slate-300">{metrics.leads_by_stage.warm} leads</span>
              </div>
              <Progress value={(metrics.leads_by_stage.warm / metrics.total_leads) * 100} className="h-2" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Cold Inbound</span>
                <span className="font-semibold text-slate-400">{metrics.leads_by_stage.cold} leads</span>
              </div>
              <Progress value={(metrics.leads_by_stage.cold / metrics.total_leads) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Live Pending Review Queue Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-purple-400" />
                  <span>Human-in-the-Loop Review Queue</span>
                </CardTitle>
                <CardDescription>
                  Inbound interactions pending operator approval
                </CardDescription>
              </div>
              <Link href="/review-queue">
                <Button variant="outline" size="sm" className="rounded-lg text-xs">
                  Review All ({metrics.review_queue.length})
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.review_queue.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-slate-700"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2 font-medium text-slate-200">
                    <span className="h-2 w-2 rounded-full bg-purple-400" />
                    <span>{item.lead_name}</span>
                    <span className="text-slate-500">• {item.lead_headline}</span>
                  </div>
                  <Badge variant="warning">
                    Confidence {Math.round(item.confidence_score * 100)}%
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-3">
                  <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Incoming Comment
                    </span>
                    <p className="text-slate-300 line-clamp-2">{item.incoming_message}</p>
                  </div>
                  <div className="rounded-lg bg-purple-950/20 p-3 border border-purple-500/20">
                    <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1">
                      AI Generated Draft Reply
                    </span>
                    <p className="text-purple-200 line-clamp-2">{item.draft_reply}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts Stream */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>Recent Posts & Live Engagement</span>
              </CardTitle>
              <CardDescription>
                AI-generated marketing posts deployed to LinkedIn
              </CardDescription>
            </div>
            <Link href="/studio">
              <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span>Create Post</span>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.recent_posts.map((post) => (
              <div
                key={post.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={post.status === "published" ? "success" : "default"}>
                      {post.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {formatRelativeTime(post.created_at)}
                    </span>
                    {post.variant_label && (
                      <Badge variant="outline" className="text-[10px]">
                        Variant {post.variant_label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-200 line-clamp-2">{post.content}</p>
                  <div className="flex gap-2">
                    {post.hashtags.map((tag) => (
                      <span key={tag} className="text-[11px] text-purple-400 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {post.platform_post_url && (
                    <a
                      href={post.platform_post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <span>View live</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Plus(props: { className?: string }) {
  return (
    <svg className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
