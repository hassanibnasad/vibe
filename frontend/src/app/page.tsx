"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Inbox,
  Users,
  Send,
  ArrowRight,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  Activity,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchDashboardMetrics, DashboardMetrics, Post } from "@/lib/api-client";
import { formatRelativeTime, formatConfidence } from "@/lib/utils";

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
        setError("Unable to connect to VibeAgent API gateway. Verify backend service is running.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPostStatusBadge = (status: Post["status"]) => {
    switch (status) {
      case "published":
        return <Badge variant="published" className="text-[10px] py-0 h-4">Published</Badge>;
      case "scheduled":
        return <Badge variant="scheduled" className="text-[10px] py-0 h-4">Scheduled</Badge>;
      case "failed":
        return <Badge variant="failed" className="text-[10px] py-0 h-4">Failed</Badge>;
      default:
        return <Badge variant="draft" className="text-[10px] py-0 h-4">Draft</Badge>;
    }
  };

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error || !metrics) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-3 max-w-md mx-auto text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div className="font-semibold text-sm text-foreground">API connection error</div>
        <p className="text-xs text-muted-foreground">{error || "Failed to load dashboard metrics."}</p>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5 mt-2">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry request</span>
        </Button>
      </div>
    );
  }

  const hasPendingReviews = metrics.review_queue_pending > 0;
  const avgConfidence = formatConfidence(metrics.avg_reply_confidence, 0.85);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 4 Focused KPI Cards — Review Queue card is the single source of truth for queue count */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Published Posts */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Published posts</span>
              <Send className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
                {metrics.total_posts_published}
              </span>
              <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                <span>+18% vs 7d</span>
              </span>
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              Channel: LinkedIn corporate
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Review Queue — Single source of truth with primary action */}
        <Card className={hasPendingReviews ? "border-amber-500/40 bg-amber-500/[0.02]" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Review queue</span>
              <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
                {metrics.review_queue_pending}
              </span>
              {hasPendingReviews ? (
                <Badge variant="review" className="text-[10px] py-0 h-4 font-mono">
                  Action required
                </Badge>
              ) : (
                <Badge variant="published" className="text-[10px] py-0 h-4">
                  Queue clear
                </Badge>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Operator authorization gate
              </span>
              {hasPendingReviews && (
                <Link href="/review-queue">
                  <Button size="sm" className="h-6 px-2 text-[11px] gap-1">
                    <span>Triage ({metrics.review_queue_pending})</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Qualified Leads */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Qualified leads</span>
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
                {metrics.mql_sql_leads}
              </span>
              <Badge variant="sql" className="text-[10px] py-0 h-4 font-mono tabular-nums">
                2 SQL ready
              </Badge>
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              Scored via BANT rubric ({metrics.total_leads} total)
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Median Response Latency */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Median reply latency</span>
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
                {metrics.avg_response_time_sec.toFixed(1)}s
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[11px] font-medium text-emerald-400 cursor-help">
                    Target &lt; 5.0s
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span>Down from 4.2h manual operator baseline</span>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              Confidence average: <span className="font-mono">{avgConfidence.percentage}</span> ({avgConfidence.label})
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Live Stream & Operational Summary */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left 2 Cols: Recent Dispatches & Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b border-border space-y-0">
              <div>
                <CardTitle className="text-xs font-semibold">Live content stream</CardTitle>
                <CardDescription className="text-[11px]">
                  Recent publications and scheduled broadcasts on LinkedIn
                </CardDescription>
              </div>
              <Link href="/studio">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  <span>Open studio</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Time</TableHead>
                    <TableHead>Excerpt</TableHead>
                    <TableHead className="w-[100px]">Channel</TableHead>
                    <TableHead className="w-[90px] text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.recent_posts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs">
                        No recent dispatches recorded. Create a post in Content studio to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    metrics.recent_posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
                          {formatRelativeTime(post.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground line-clamp-1 text-xs">
                            {post.content.split("\n")[0]}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            ID: {post.id}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[11px] font-medium">
                          LinkedIn
                        </TableCell>
                        <TableCell className="text-right">
                          {getPostStatusBadge(post.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Agent Telemetry & Quick Navigation */}
        <div className="space-y-4">
          {/* Active Agents Health */}
          <Card>
            <CardHeader className="p-4 pb-3 border-b border-border">
              <CardTitle className="text-xs font-semibold">Automation agents</CardTitle>
              <CardDescription className="text-[11px]">
                Autonomous background workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="font-medium">Content generator</span>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">Idle</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="font-medium">Engagement monitor</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">Monitoring</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="font-medium">Lead qualifier (BANT)</span>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">Idle</span>
              </div>

              <div className="pt-2 border-t border-border space-y-1.5">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Verification threshold</span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <span>Drafts with confidence &lt; 0.85 are routed to Review queue</span>
                    </TooltipContent>
                  </Tooltip>
                  <span className="font-mono text-foreground tabular-nums">85%</span>
                </div>
                <Progress value={85} className="h-1" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card>
            <CardHeader className="p-4 pb-3 border-b border-border">
              <CardTitle className="text-xs font-semibold">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Link href="/studio" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                  <Send className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>Draft campaign brief</span>
                </Button>
              </Link>
              <Link href="/review-queue" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                  <Inbox className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>Triage pending replies</span>
                </Button>
              </Link>
              <Link href="/leads" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                  <Users className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>Inspect lead pipeline</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
