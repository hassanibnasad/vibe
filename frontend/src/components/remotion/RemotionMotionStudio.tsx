"use client";

import React, { useState } from "react";
import { Player } from "@remotion/player";
import { SocialReelComposition } from "./SocialReelComposition";
import {
  Smartphone,
  Square,
  Tv,
  Check,
  Copy,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface RemotionMotionStudioProps {
  content: string;
  authorName?: string;
  authorHeadline?: string;
  brandName?: string;
  imageUrl?: string | null;
}

type AspectRatio = "1:1" | "9:16" | "16:9";

const formatConfigs: Record<
  AspectRatio,
  { label: string; width: number; height: number; icon: React.ComponentType<{ className?: string }> }
> = {
  "1:1": { label: "Square Feed (1:1)", width: 1080, height: 1080, icon: Square },
  "9:16": { label: "Vertical Reel (9:16)", width: 1080, height: 1920, icon: Smartphone },
  "16:9": { label: "Widescreen (16:9)", width: 1920, height: 1080, icon: Tv },
};

export function RemotionMotionStudio({
  content,
  authorName = "VibeAgent Operator",
  authorHeadline = "Founder & AI Systems Architect",
  brandName = "VibeAgent",
  imageUrl = null,
}: RemotionMotionStudioProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<AspectRatio>("1:1");
  const [copied, setCopied] = useState(false);

  const currentConfig = formatConfigs[format];

  const handleCopySpec = () => {
    const spec = {
      engine: "Remotion 4.0",
      resolution: `${currentConfig.width}x${currentConfig.height}`,
      aspectRatio: format,
      fps: 30,
      durationInFrames: 180,
      contentLength: content.length,
      author: authorName,
    };
    navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
    setCopied(true);
    toast({
      title: "Motion reel metadata copied",
      description: "Copied Remotion render parameters to clipboard.",
      variant: "success",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-subtle overflow-hidden transition-all duration-300">
      {/* ── Studio Top Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/70 bg-surface/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-semibold text-foreground">Remotion Motion Studio</span>
          <span className="font-mono text-[10px] text-muted-foreground uppercase px-2 py-0.5 rounded bg-surface border border-border">
            React Video Engine
          </span>
        </div>

        {/* Format Switcher */}
        <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-surface border border-border">
          {(["1:1", "9:16", "16:9"] as AspectRatio[]).map((fmt) => {
            const Icon = formatConfigs[fmt].icon;
            return (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormat(fmt)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all duration-150 ${format === fmt
                    ? "bg-foreground text-background font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
                title={formatConfigs[fmt].label}
              >
                <Icon className="h-3 w-3" />
                <span>{fmt}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySpec}
            className="h-7 px-2.5 text-xs gap-1 border-border/80"
          >
            {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Copied" : "Copy Spec"}</span>
          </Button>
        </div>
      </div>

      {/* ── Remotion Interactive Player Canvas ── */}
      <div className="p-6 bg-black/40 flex items-center justify-center min-h-[460px] overflow-hidden">
        <div
          className="relative rounded-xl overflow-hidden shadow-2xl border border-white/10"
          style={{
            width: "100%",
            maxWidth: format === "9:16" ? "320px" : format === "1:1" ? "440px" : "560px",
            aspectRatio: format === "9:16" ? "9 / 16" : format === "1:1" ? "1 / 1" : "16 / 9",
          }}
        >
          <Player
            component={SocialReelComposition}
            inputProps={{
              content: content || "Draft a topic on the left to watch kinetic motion typography render in real-time.",
              authorName,
              authorHeadline,
              brandName,
              imageUrl,
            }}
            durationInFrames={180}
            compositionWidth={currentConfig.width}
            compositionHeight={currentConfig.height}
            fps={30}
            style={{
              width: "100%",
              height: "100%",
            }}
            controls
            autoPlay
            loop
          />
        </div>
      </div>

      {/* ── Studio Telemetry Readout Footer ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-border/70 bg-surface/50 text-[11px] font-mono text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            CANVAS: <strong className="text-foreground">{currentConfig.width} × {currentConfig.height}px</strong>
          </span>
          <span>•</span>
          <span>
            FRAMERATE: <strong className="text-foreground">30 FPS</strong>
          </span>
          <span>•</span>
          <span>
            DURATION: <strong className="text-foreground">6.0s (180f)</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Real-time React Frame Synthesis</span>
        </div>
      </div>
    </div>
  );
}
