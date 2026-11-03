"use client";

import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface SocialReelProps extends Record<string, unknown> {
  content?: string;
  authorName?: string;
  authorHeadline?: string;
  brandName?: string;
}

export const SocialReelComposition: React.FC<SocialReelProps> = ({
  content = "Autonomous social orchestration powered by verifiable multi-agent knowledge bases.",
  authorName = "VibeAgent Operator",
  authorHeadline = "Founder & AI Systems Architect",
  brandName = "VibeAgent",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Entrance spring animations
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const cardTranslateY = interpolate(frame, [10, 35], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cardOpacity = interpolate(frame, [10, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Words breakdown for kinetic typography reveal
  const safeContent = content || "Autonomous social orchestration powered by verifiable multi-agent knowledge bases.";
  const words = safeContent.trim().split(/\s+/).slice(0, 45); // First 45 words for crisp presentation
  const isVertical = height > width;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#09090B",
        backgroundImage:
          "radial-gradient(circle at 50% 15%, rgba(0, 229, 153, 0.12) 0%, transparent 60%), linear-gradient(to bottom, #0D0D11, #09090B)",
        color: "#FAFAFA",
        fontFamily: "'Inter', sans-serif",
        padding: isVertical ? "80px 60px" : "60px 80px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      {/* ── Top Header Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: headerOpacity,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          paddingBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Logo Monogram */}
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#FAFAFA",
              color: "#09090B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "18px",
              fontFamily: "monospace",
              transform: `scale(${logoScale})`,
              boxShadow: "0 0 24px rgba(0, 229, 153, 0.3)",
            }}
          >
            VA
          </div>
          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#FFFFFF",
              }}
            >
              {brandName}
            </div>
            <div
              style={{
                fontSize: "13px",
                fontFamily: "monospace",
                color: "#A1A1AA",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Edition 2026 · Dispatch
            </div>
          </div>
        </div>

        {/* Live Status Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(0, 229, 153, 0.1)",
            border: "1px solid rgba(0, 229, 153, 0.3)",
            padding: "6px 14px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontFamily: "monospace",
            color: "#00E599",
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#00E599",
              boxShadow: "0 0 10px #00E599",
            }}
          />
          VERIFIED INSIGHT
        </div>
      </div>

      {/* ── Main Kinetic Content Card ── */}
      <div
        style={{
          transform: `translateY(${cardTranslateY}px)`,
          opacity: cardOpacity,
          backgroundColor: "rgba(17, 17, 19, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
          padding: isVertical ? "48px 40px" : "40px 48px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(20px)",
          flex: 1,
          margin: "40px 0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: isVertical ? "32px" : "28px",
            lineHeight: 1.4,
            fontWeight: 500,
            letterSpacing: "-0.015em",
            color: "#FAFAFA",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 10px",
          }}
        >
          {words.map((word, index) => {
            // Stagger word reveal
            const wordDelay = 18 + index * 2.2;
            const wordOpacity = interpolate(
              frame,
              [wordDelay, wordDelay + 6],
              [0.1, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const wordY = interpolate(
              frame,
              [wordDelay, wordDelay + 8],
              [8, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const isHighlight =
              index % 7 === 0 && index > 0 && index < words.length - 2;

            return (
              <span
                key={`${word}-${index}`}
                style={{
                  opacity: wordOpacity,
                  transform: `translateY(${wordY}px)`,
                  display: "inline-block",
                  color: isHighlight ? "#00E599" : "#FAFAFA",
                  fontWeight: isHighlight ? 700 : 500,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Dynamic Waveform Telemetry Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "36px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {Array.from({ length: 24 }).map((_, barIdx) => {
            const barHeight = Math.sin((frame * 0.15) + barIdx * 0.4) * 12 + 16;
            return (
              <div
                key={barIdx}
                style={{
                  width: "4px",
                  height: `${Math.max(4, barHeight)}px`,
                  backgroundColor: barIdx < 12 ? "#00E599" : "rgba(255, 255, 255, 0.2)",
                  borderRadius: "2px",
                  transition: "height 0.1s ease",
                }}
              />
            );
          })}
          <span
            style={{
              marginLeft: "12px",
              fontFamily: "monospace",
              fontSize: "11px",
              color: "#A1A1AA",
              letterSpacing: "0.05em",
            }}
          >
            SYNTHESIS ENGINE · 30 FPS
          </span>
        </div>
      </div>

      {/* ── Author Footer ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: headerOpacity,
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          paddingTop: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "14px",
              color: "#FAFAFA",
            }}
          >
            {(authorName || "VA").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#FFFFFF" }}>
              {authorName}
            </div>
            <div style={{ fontSize: "12px", color: "#A1A1AA" }}>
              {authorHeadline}
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#71717A",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          LinkedIn & Social Motion Reel
        </div>
      </div>
    </AbsoluteFill>
  );
};
