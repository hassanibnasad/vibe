"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Link2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Trash2,
  Calendar,
  Lock,
  ArrowRight,
  Info,
  Clock,
  Radio,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchConnectors,
  disconnectConnector,
  getLinkedInAuthUrl,
  SocialConnection,
} from "@/lib/api-client";
import { FadeIn } from "@/lib/motion";
import { AnimatedCheck, PulseBeacon } from "@/components/ui/AnimatedCheck";
import { formatRelativeTime } from "@/lib/utils";

function LinkedInBrandIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.81a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z" />
    </svg>
  );
}

function ConnectorsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [targetDisconnectId, setTargetDisconnectId] = useState<string | null>(null);

  // Check query params for OAuth result
  const justConnected = searchParams.get("linkedin") === "connected";
  const oauthError = searchParams.get("error");
  const oauthErrorDesc = searchParams.get("error_description");

  const loadConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConnectors();
      setConnections(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load channel connectors."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const linkedInConnection = connections.find(
    (c) => c.provider.toLowerCase() === "linkedin" && c.status !== "disconnected"
  );

  const isLinkedInActive = linkedInConnection?.status === "active";

  const handleConnectLinkedIn = () => {
    setActionInProgress(true);
    const authUrl = getLinkedInAuthUrl();
    window.location.href = authUrl;
  };

  const handleConfirmDisconnect = async () => {
    if (!targetDisconnectId) return;
    setActionInProgress(true);
    try {
      await disconnectConnector(targetDisconnectId);
      setDisconnectDialogOpen(false);
      setTargetDisconnectId(null);
      await loadConnections();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect channel."
      );
    } finally {
      setActionInProgress(false);
    }
  };

  const clearOAuthBanner = () => {
    router.replace("/connections");
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Top Editorial Header */}
      <FadeIn>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Social Gateway Seam
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Social <span className="text-gradient-cyan">Connectors</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Manage authenticated social platform credentials for autonomous dispatches,
                scheduled publications, and audience sentiment qualification.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadConnections}
              disabled={loading}
              className="gap-2 rounded-xl border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-xs h-9 shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Sync Status
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* OAuth Callback Success Banner */}
      {justConnected && (
        <FadeIn>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 backdrop-blur-xl flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-semibold text-white text-sm">
                  LinkedIn Account Connected Successfully
                </h4>
                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  Your LinkedIn credentials have been securely encrypted and stored. The autonomous
                  publisher and review queue can now publish verified dispatches to your profile.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearOAuthBanner}
              className="text-xs text-emerald-300 hover:text-white hover:bg-emerald-500/20 h-8 px-3 rounded-lg shrink-0"
            >
              Dismiss
            </Button>
          </div>
        </FadeIn>
      )}

      {/* OAuth Callback Error Banner */}
      {(oauthError || error) && (
        <FadeIn>
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 backdrop-blur-xl flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-semibold text-white text-sm">
                  Connection Notice
                </h4>
                <p className="text-xs text-rose-200/80 leading-relaxed">
                  {oauthError
                    ? `OAuth Authorization issue: ${oauthError} ${oauthErrorDesc ? `— ${oauthErrorDesc}` : ""}`
                    : error}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setError(null);
                if (oauthError) clearOAuthBanner();
              }}
              className="text-xs text-rose-300 hover:text-white hover:bg-rose-500/20 h-8 px-3 rounded-lg shrink-0"
            >
              Dismiss
            </Button>
          </div>
        </FadeIn>
      )}

      {/* Primary Connector: LinkedIn Personal Profile */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-display font-bold text-lg text-white">Active Channel</h2>
            <p className="text-xs text-muted-foreground">
              Direct connection for personal-profile dispatches and review queue approval
            </p>
          </div>
        </div>

        {loading ? (
          <div className="glass-panel rounded-3xl p-8 border border-white/[0.08] space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-48 bg-white/5" />
              <Skeleton className="h-8 w-24 bg-white/5 rounded-full" />
            </div>
            <Skeleton className="h-28 w-full bg-white/5 rounded-2xl" />
          </div>
        ) : (
          <div
            className={`glass-panel rounded-3xl p-7 sm:p-8 border transition-all duration-300 relative overflow-hidden ${
              isLinkedInActive
                ? "border-cyan-500/30 shadow-[0_0_30px_-10px_rgba(56,189,248,0.15)]"
                : "border-white/[0.08]"
            }`}
          >
            {/* Ambient accent header glow */}
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b opacity-50 ${
                isLinkedInActive
                  ? "from-cyan-500/10 via-transparent to-transparent"
                  : "from-white/[0.02] to-transparent"
              }`}
            />

            <div className="relative z-10 space-y-7">
              {/* Connector Card Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A66C2]/15 text-[#0A66C2] border border-[#0A66C2]/30 shadow-[0_0_20px_-5px_rgba(10,102,194,0.3)]">
                    <LinkedInBrandIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display font-bold text-lg text-white">LinkedIn Personal Profile</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-muted-foreground">
                        OAuth 2.0
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Operator 3-legged user consent via Microsoft LinkedIn Identity API
                    </p>
                  </div>
                </div>

                <div>
                  {isLinkedInActive ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono">
                      <PulseBeacon status="live" />
                      <span>Active · Connected</span>
                    </div>
                  ) : linkedInConnection ? (
                    <Badge variant="outline" className="text-xs font-mono border-amber-500/30 text-amber-300 bg-amber-500/10">
                      {linkedInConnection.status}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs font-mono text-muted-foreground border-white/[0.08]">
                      Not Connected
                    </Badge>
                  )}
                </div>
              </div>

              {/* Connected State Content */}
              {isLinkedInActive && linkedInConnection ? (
                <div className="space-y-6">
                  {/* Metadata Specs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-4 space-y-1.5">
                      <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
                        Authenticated Identity
                      </div>
                      <div className="font-sans font-semibold text-white text-sm">
                        {linkedInConnection.display_name || "Authorized Member"}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground/80 truncate">
                        {linkedInConnection.author_urn}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-4 space-y-1.5">
                      <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-emerald-400" />
                        Token Status & Expiry
                      </div>
                      <div className="font-sans font-semibold text-white text-sm">
                        {linkedInConnection.expires_at
                          ? `Valid until ${new Date(linkedInConnection.expires_at).toLocaleDateString()}`
                          : "Standard Session Active"}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground/80">
                        {linkedInConnection.connected_at
                          ? `Connected ${formatRelativeTime(linkedInConnection.connected_at)}`
                          : "Authenticated"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-4 space-y-1.5">
                      <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-indigo-400" />
                        Token Security
                      </div>
                      <div className="font-sans font-semibold text-white text-sm">
                        Fernet AES-128-CBC
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground/80">
                        Encrypted with HMAC-SHA256
                      </div>
                    </div>
                  </div>

                  {/* Granted Scopes Pill List */}
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">
                        Granted OAuth Scopes
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <AnimatedCheck size={12} />
                        Permissions Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-mono text-xs text-white">openid</div>
                          <div className="text-[10px] text-muted-foreground">Identity verification</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-mono text-xs text-white">profile</div>
                          <div className="text-[10px] text-muted-foreground">Basic member profile</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-mono text-xs text-white">w_member_social</div>
                          <div className="text-[10px] text-muted-foreground">Publish posts & media</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connected Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleConnectLinkedIn}
                        disabled={actionInProgress}
                        className="rounded-xl h-9 text-xs border-white/[0.08] hover:bg-white/[0.05] text-muted-foreground hover:text-white"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Re-authorize Account
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTargetDisconnectId(linkedInConnection.id);
                        setDisconnectDialogOpen(true);
                      }}
                      disabled={actionInProgress}
                      className="rounded-xl h-9 text-xs border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Disconnect Account
                    </Button>
                  </div>
                </div>
              ) : (
                /* Unconnected / Empty State */
                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-6 space-y-4">
                    <h4 className="font-display font-semibold text-white text-sm">
                      Connect your LinkedIn profile to unlock:
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>Autonomous publishing of approved drafts from Content Studio</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>Drag-and-drop scheduled calendar dispatching via Hatchet workflows</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>Encrypted token storage with zero plain-text credential persistence</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>Safe review queue approval gate before any post goes live</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>
                        Requests only personal publishing rights (<code className="text-white/80">w_member_social</code>).
                      </span>
                    </div>

                    <Button
                      onClick={handleConnectLinkedIn}
                      disabled={actionInProgress}
                      className="w-full sm:w-auto h-11 px-6 rounded-xl text-sm font-medium bg-[#0A66C2] hover:bg-[#004182] text-white shadow-[0_0_20px_-3px_rgba(10,102,194,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <LinkedInBrandIcon className="h-4 w-4 mr-2" />
                      Connect LinkedIn Account
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Additional Roadmap Platform Connectors */}
      <div className="space-y-4 pt-4">
        <div className="space-y-0.5">
          <h2 className="font-display font-bold text-lg text-white">Additional Platform Connectors</h2>
          <p className="text-xs text-muted-foreground">
            Multi-channel social orchestration connectors scheduled in the architecture roadmap
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* X / Twitter */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.06] space-y-3 opacity-75">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-white">
                  <span className="font-bold text-sm">𝕏</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">X / Twitter</h4>
                  <span className="text-[10px] font-mono text-muted-foreground">API v2 Connector</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-muted-foreground">
                Roadmap
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Thread authoring, short-form viral commentary, and automated audience reply flows.
            </p>
          </div>

          {/* Instagram */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.06] space-y-3 opacity-75">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-white/[0.08] text-rose-400">
                  <span className="font-bold text-sm">IG</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">Instagram Professional</h4>
                  <span className="text-[10px] font-mono text-muted-foreground">Graph API Connector</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-muted-foreground">
                Roadmap
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Visual carousel scheduling, story updates, and inbound direct message lead capture.
            </p>
          </div>

          {/* WhatsApp Business */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.06] space-y-3 opacity-75">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <span className="font-bold text-sm">WA</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">WhatsApp Business</h4>
                  <span className="text-[10px] font-mono text-muted-foreground">Cloud API Connector</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-muted-foreground">
                Roadmap
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              High-intent conversational lead triage, automated meeting booking, and BANT scoring.
            </p>
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base text-white">Disconnect LinkedIn Channel?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Disconnecting will revoke active authorization for your LinkedIn profile. Scheduled
              dispatches will not be able to publish until you re-authorize this channel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisconnectDialogOpen(false)}
              className="text-xs border-white/[0.08]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDisconnect}
              disabled={actionInProgress}
              className="text-xs"
            >
              Confirm Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-6xl mx-auto p-8">
          <Skeleton className="h-10 w-48 bg-white/5" />
          <Skeleton className="h-64 w-full bg-white/5 rounded-3xl" />
        </div>
      }
    >
      <ConnectorsContent />
    </Suspense>
  );
}
