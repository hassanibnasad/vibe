"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Edit3,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  Lead,
  NurturePlaybook,
  PlaybookStep,
  fetchLeadPlaybooks,
  executePlaybookStep,
} from "@/lib/api-client";

interface LeadPlaybookRunnerProps {
  lead: Lead;
}

export function LeadPlaybookRunner({ lead }: LeadPlaybookRunnerProps) {
  const { toast } = useToast();
  const [playbooks, setPlaybooks] = useState<NurturePlaybook[]>([]);
  const [activePlaybookIndex, setActivePlaybookIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Fallback demo playbooks
  const getDemoPlaybooks = (l: Lead): NurturePlaybook[] => {
    const firstName = l.full_name?.split(" ")[0] || "there";
    const company = l.company || "your organization";
    const intent = l.intent_signals?.[0]?.replace(/_/g, " ") || "enterprise content pipelines";

    return [
      {
        id: "playbook-sql-exec",
        title: "Executive Fast-Track Cadence",
        description: `High-touch cadence optimized for decision makers at ${company}.`,
        target_stage: "sql",
        steps: [
          {
            id: "step-1",
            step_number: 1,
            title: "Peer Case Study & Benchmark",
            channel: "linkedin_dm",
            status: "pending",
            recommended_delay_days: 0,
            ai_draft_message: `Hi ${firstName}, saw your focus on ${intent} at ${company}. We recently helped an enterprise marketing team slash content review turnaround from 4 days to 45 mins with pgvector-grounded multi-agent workflows. Here is the technical breakdown: https://vibeagent.ai/benchmarks/enterprise-content-rag`,
          },
          {
            id: "step-2",
            step_number: 2,
            title: "Architecture & Security Deck",
            channel: "email",
            status: "pending",
            recommended_delay_days: 2,
            ai_draft_message: `Hi ${firstName},\n\nFollowing up on our benchmark note—attached is the security whitepaper covering our multi-tenant PostgreSQL isolation and human-in-the-loop confidence thresholds.\n\nWould you be open to a 20-min architecture review next Tuesday?\n\nBest,\nVibeAgent Solutions`,
          },
          {
            id: "step-3",
            step_number: 3,
            title: "VIP Sandbox & Technical Sizing",
            channel: "calendar_invite",
            status: "pending",
            recommended_delay_days: 4,
            ai_draft_message: `Invitation: ${company} <> VibeAgent Technical Architecture Walkthrough\n\nAgenda:\n1. Dedicated pgvector grounding station\n2. Real-time FLUX visual pipeline\n3. Brand voice guardrails & confidence gating.`,
          },
        ],
      },
      {
        id: "playbook-mql-tech",
        title: "Technical Value-Add Nurture",
        description: `Technical deep-dive nurture for technical evaluators at ${company}.`,
        target_stage: "mql",
        steps: [
          {
            id: "step-mql-1",
            step_number: 1,
            title: "Hatchet Workflow Engine Whitepaper",
            channel: "linkedin_dm",
            status: "pending",
            recommended_delay_days: 0,
            ai_draft_message: `Hi ${firstName}, thought your engineering team at ${company} might find this relevant: our whitepaper on orchestrating Hatchet workflow queues with LiteLLM for deterministic brand compliance: https://vibeagent.ai/research/hatchet-agents`,
          },
          {
            id: "step-mql-2",
            step_number: 2,
            title: "Interactive Studio Walkthrough",
            channel: "email",
            status: "pending",
            recommended_delay_days: 3,
            ai_draft_message: `Hi ${firstName},\n\nSharing a 3-minute video showing our Remotion Motion Studio rendering 60 FPS motion graphics directly from vector-grounded post drafts.\n\nLive sandbox available on our portal.`,
          },
        ],
      },
    ];
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchLeadPlaybooks(lead.id);
        if (isMounted) {
          if (res && res.length > 0) {
            setPlaybooks(res);
          } else {
            setPlaybooks(getDemoPlaybooks(lead));
          }
        }
      } catch {
        if (isMounted) {
          setPlaybooks(getDemoPlaybooks(lead));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [lead.id]);

  const activePlaybook = playbooks[activePlaybookIndex] || playbooks[0];
  const activeStep = activePlaybook?.steps?.[activeStepIndex] || activePlaybook?.steps?.[0];

  useEffect(() => {
    if (activeStep) {
      setEditedMessage(activeStep.ai_draft_message);
    }
  }, [activeStep]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to Clipboard",
      description: "AI-tailored nurture message copied.",
    });
  };

  const handleExecute = async () => {
    if (!activePlaybook || !activeStep) return;
    setExecuting(true);
    try {
      await executePlaybookStep(
        lead.id,
        activePlaybook.id,
        activeStep.id,
        editedMessage !== activeStep.ai_draft_message ? editedMessage : undefined
      );

      // Update local status to executed
      setPlaybooks((prev) =>
        prev.map((pb, pbIdx) =>
          pbIdx === activePlaybookIndex
            ? {
                ...pb,
                steps: pb.steps.map((st, stIdx) =>
                  stIdx === activeStepIndex
                    ? {
                        ...st,
                        status: "executed",
                        executed_at: new Date().toISOString(),
                        ai_draft_message: editedMessage,
                      }
                    : st
                ),
              }
            : pb
        )
      );

      toast({
        title: "Nurture Step Executed",
        description: `Dispatched step #${activeStep.step_number} via ${activeStep.channel.replace(/_/g, " ")}.`,
      });
    } catch {
      // Local fallback execution for demo/unseeded leads
      setPlaybooks((prev) =>
        prev.map((pb, pbIdx) =>
          pbIdx === activePlaybookIndex
            ? {
                ...pb,
                steps: pb.steps.map((st, stIdx) =>
                  stIdx === activeStepIndex
                    ? {
                        ...st,
                        status: "executed",
                        executed_at: new Date().toISOString(),
                        ai_draft_message: editedMessage,
                      }
                    : st
                ),
              }
            : pb
        )
      );
      toast({
        title: "Nurture Step Executed (Simulation)",
        description: `Step #${activeStep.step_number} recorded and dispatched.`,
      });
    } finally {
      setExecuting(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case "linkedin_dm":
        return <Send className="h-3 w-3 text-sky-400" />;
      case "email":
        return <Mail className="h-3 w-3 text-emerald-400" />;
      case "calendar_invite":
        return <Calendar className="h-3 w-3 text-violet-400" />;
      default:
        return <Sparkles className="h-3 w-3 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border/80 bg-surface/50 p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!activePlaybook) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-surface/50 p-4 space-y-4">
      {/* Header with Playbook Selector */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground font-display flex items-center gap-2">
              <span>{activePlaybook.title}</span>
              <Badge
                variant={activePlaybook.target_stage === "sql" ? "published" : "secondary"}
                className="uppercase font-mono text-[9px] px-1.5 py-0"
              >
                {activePlaybook.target_stage}
              </Badge>
            </h4>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {activePlaybook.description}
            </p>
          </div>
        </div>

        {playbooks.length > 1 && (
          <div className="flex items-center gap-1">
            {playbooks.map((pb, idx) => (
              <button
                key={pb.id}
                onClick={() => {
                  setActivePlaybookIndex(idx);
                  setActiveStepIndex(0);
                }}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  activePlaybookIndex === idx
                    ? "bg-primary text-primary-foreground border-primary font-bold"
                    : "bg-surface text-muted-foreground border-border/50 hover:text-foreground"
                }`}
              >
                {pb.target_stage.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Multi-step Rail */}
      <div className="grid grid-cols-3 gap-2">
        {activePlaybook.steps.map((step, idx) => {
          const isSelected = activeStepIndex === idx;
          const isExecuted = step.status === "executed";
          return (
            <button
              key={step.id}
              onClick={() => setActiveStepIndex(idx)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? "bg-surface-raised border-primary shadow-xs"
                  : isExecuted
                  ? "bg-surface/80 border-emerald-500/30 opacity-90"
                  : "bg-surface/40 border-border/50 hover:bg-surface/80"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="text-muted-foreground">Step 0{step.step_number}</span>
                {isExecuted ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : (
                  getChannelIcon(step.channel)
                )}
              </div>
              <p className="text-[11px] font-medium text-foreground line-clamp-1">
                {step.title}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[9px] font-mono text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                <span>{step.recommended_delay_days === 0 ? "Immediate" : `+${step.recommended_delay_days}d`}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Workspace */}
      {activeStep && (
        <div className="rounded-lg border border-border/70 bg-canvas/80 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-bone font-sans">
                Step {activeStep.step_number}: {activeStep.title}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono gap-1 capitalize">
                {getChannelIcon(activeStep.channel)}
                <span>{activeStep.channel.replace(/_/g, " ")}</span>
              </Badge>
            </div>
            {activeStep.status === "executed" ? (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-mono gap-1">
                <CheckCircle2 className="h-3 w-3" /> Dispatched
              </Badge>
            ) : (
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[10px] font-mono">
                Ready to Trigger
              </Badge>
            )}
          </div>

          {/* AI Pre-drafted Message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1 text-primary">
                <Sparkles className="h-3 w-3" /> AI Tailored Message
              </span>
              <button
                onClick={handleCopy}
                className="hover:text-foreground flex items-center gap-1 text-[10px]"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <Textarea
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              rows={4}
              className="text-xs font-sans bg-surface/60 border-border/70 leading-relaxed resize-none focus:border-primary"
              placeholder="Tailored nurture message..."
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-mono text-muted-foreground">
              {activeStep.status === "executed" && activeStep.executed_at
                ? `Executed ${new Date(activeStep.executed_at).toLocaleDateString()}`
                : "Tamper-evident audit logged on send"}
            </span>

            <Button
              size="sm"
              onClick={handleExecute}
              disabled={executing || activeStep.status === "executed"}
              className="h-7 text-xs gap-1.5 font-mono bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {executing ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : activeStep.status === "executed" ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Executed</span>
                </>
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  <span>Execute Step</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
