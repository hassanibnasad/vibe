/**
 * LeadFractionationColumn
 *
 * Fig. 03 — Multi-Tier CRM Hydrostatic Fractionation Column
 *
 * A bespoke isometric SVG apparatus for VibeAgent's Lead Pipeline.
 * Transforms CRM funnel stages into an industrial fractionation column:
 *   - 5 tiered sight glass stages: COLD → WARM → HOT → MQL → SQL (Distillate).
 *   - Dynamic liquid strata levels bobbing with hydrostatic specific gravity floats.
 *   - Brass return manifolds, relief valves, and analog manometer pressure gauges.
 *   - Interactive stage selection triggering flow rate and strata focus.
 *
 * Tuned to Vibe's Smoky Charcoal (#0D0A08 / #1A1512) + Warm Parchment (#F0E8DC) + Terracotta (#E07830).
 */

import React, { useState } from "react";

function iso(r: number, d: number, u: number, cx = 0, cy = 0): [number, number] {
  return [cx + (r - d), cy + (r + d) * 0.5 - u];
}

function poly(...points: [number, number][]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

const C = {
  canvas: "#0D0A08",
  card: "#17120F",
  surfaceRaised: "#201A16",

  edgeHi: "#F0E8DC",
  edgeMid: "#7D6B5A",
  edgeLo: "#382E25",
  edgeFaint: "#261E17",

  faceTop: "#221C17",
  faceFront: "#18130F",
  faceSide: "#120E0B",

  terra: "#E07830",
  terraLo: "#8F3E12",
  terraGlow: "#FF9A54",

  brassTop: "#C49A45",
  brassFront: "#9A7528",
  brassSide: "#684E18",

  // Stratum Colors
  cold: "#4B729F",
  warm: "#3AA89B",
  hot: "#E59E28",
  mql: "#E07830",
  sql: "#3DAA7A",

  textPrimary: "#F5EDE0",
  textSecondary: "#A89682",
  textMuted: "#6B5D4E",
  textMono: "#8C7B6B",
} as const;

export interface LeadStageData {
  key: "cold" | "warm" | "hot" | "mql" | "sql";
  label: string;
  count: number;
  rate: string;
  colour: string;
}

export interface LeadFractionationColumnProps {
  activeStage?: string;
  onSelectStage?: (stage: string) => void;
  className?: string;
  interactive?: boolean;
}

const DEFAULT_STAGES: LeadStageData[] = [
  { key: "cold", label: "Cold Inbound", count: 142, rate: "12% flow", colour: C.cold },
  { key: "warm", label: "Warm Engagement", count: 68, rate: "24% flow", colour: C.warm },
  { key: "hot",  label: "Hot Intent", count: 29, rate: "41% flow", colour: C.hot },
  { key: "mql",  label: "MQL Qualified", count: 18, rate: "65% flow", colour: C.mql },
  { key: "sql",  label: "SQL Distillate", count: 9,  rate: "88% yield", colour: C.sql },
];

export function LeadFractionationColumn({
  activeStage: propActiveStage,
  onSelectStage,
  className = "",
  interactive = true,
}: LeadFractionationColumnProps) {
  const [internalActiveStage, setInternalActiveStage] = useState<string>("hot");

  const currentStageKey = propActiveStage || internalActiveStage;
  const currentStage = DEFAULT_STAGES.find((s) => s.key === currentStageKey) || DEFAULT_STAGES[2];

  const handleSelect = (key: string) => {
    setInternalActiveStage(key);
    onSelectStage?.(key);
  };

  const OX = 360;
  const OY = 210;

  return (
    <figure
      className={`relative rounded-xl border border-[#382E25] bg-[#0E0B09] p-5 shadow-2xl transition-all duration-300 ${className}`}
      style={{
        background: "radial-gradient(120% 120% at 50% 0%, #1A1410 0%, #0E0B09 70%, #080605 100%)",
      }}
    >
      {/* ── Engineering Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#261E17] pb-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] tracking-wider text-[#E07830] uppercase bg-[#E07830]/10 px-2 py-0.5 rounded border border-[#E07830]/30 font-semibold">
            Fig. 03
          </span>
          <span className="font-medium text-[#F5EDE0] tracking-tight">
            Multi-Tier Hydrostatic CRM Fractionation Column
          </span>
          <span className="text-[#6B5D4E]">·</span>
          <span className="font-mono text-[11px] text-[#A89682]">
            Strata Distillation Unit
          </span>
        </div>

        {/* Live Readout */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-[#6B5D4E]">
            STRATA:{" "}
            <strong className="font-semibold" style={{ color: currentStage.colour }}>
              {currentStage.label.toUpperCase()}
            </strong>
          </span>
          <span className="text-[#382E25]">|</span>
          <span className="text-[#A89682]">
            DENSITY: <span className="text-[#F5EDE0] font-semibold">{currentStage.count} leads</span>
          </span>
          <span className="text-[#382E25]">|</span>
          <span className="text-[#A89682]">{currentStage.rate}</span>
        </div>
      </div>

      {/* ── SVG Isometric Canvas ── */}
      <div className="relative w-full overflow-hidden pt-2">
        <svg
          viewBox="0 0 720 370"
          className="w-full h-auto select-none"
          style={{ maxHeight: 400 }}
          role="img"
          aria-label="Lead Fractionation Column Diagram"
        >
          <defs>
            <filter id="lfc-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Brass gradient for column fittings */}
            <linearGradient id="lfc-brass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#DFC07A" />
              <stop offset="60%" stopColor="#9A7528" />
              <stop offset="100%" stopColor="#5E4314" />
            </linearGradient>
          </defs>

          {/* ── 1. Heavy Cast Iron Deck Base ── */}
          <polygon
            points={poly(
              iso(-210, -90, -12, OX, OY),
              iso(210, -90, -12, OX, OY),
              iso(210, 90, -12, OX, OY),
              iso(-210, 90, -12, OX, OY)
            )}
            fill="#090705"
            stroke={C.edgeLo}
            strokeWidth={0.8}
          />
          <polygon
            points={poly(
              iso(-210, 90, -12, OX, OY),
              iso(210, 90, -12, OX, OY),
              iso(210, 90, 0, OX, OY),
              iso(-210, 90, 0, OX, OY)
            )}
            fill="#0F0C09"
            stroke={C.edgeLo}
            strokeWidth={0.7}
          />
          <polygon
            points={poly(
              iso(-200, -80, 0, OX, OY),
              iso(200, -80, 0, OX, OY),
              iso(200, 80, 0, OX, OY),
              iso(-200, 80, 0, OX, OY)
            )}
            fill={C.faceTop}
            stroke={C.edgeMid}
            strokeWidth={0.8}
          />

          {/* ── 2. The 5 Column Sight Stages (Stacked Vertically) ── */}
          {DEFAULT_STAGES.map((stg, i) => {
            const isSelected = stg.key === currentStageKey;
            const stageHeight = 28;
            const uBase = i * 36 + 10;
            const uTop = uBase + stageHeight;

            // Column radius narrows slightly towards top (distillate column)
            const rad = 42 - i * 3;

            return (
              <g
                key={stg.key}
                onClick={() => handleSelect(stg.key)}
                className="cursor-pointer transition-opacity hover:opacity-100"
                opacity={isSelected ? 1 : 0.75}
              >
                {/* Stage Flange Ring Base */}
                <ellipse
                  cx={iso(0, 0, uBase, OX, OY)[0]}
                  cy={iso(0, 0, uBase, OX, OY)[1]}
                  rx={rad + 6}
                  ry={(rad + 6) * 0.42}
                  fill="url(#lfc-brass)"
                  stroke={isSelected ? C.edgeHi : C.brassSide}
                  strokeWidth={isSelected ? 1.2 : 0.8}
                />

                {/* Sight Glass Body */}
                <path
                  d={`M ${iso(-rad, 0, uBase, OX, OY).join(" ")}
                      L ${iso(-rad, 0, uTop, OX, OY).join(" ")}
                      A ${rad} ${rad * 0.42} 0 0 1 ${iso(rad, 0, uTop, OX, OY).join(" ")}
                      L ${iso(rad, 0, uBase, OX, OY).join(" ")}
                      A ${rad} ${rad * 0.42} 0 0 1 ${iso(-rad, 0, uBase, OX, OY).join(" ")}`}
                  fill={stg.colour}
                  opacity={isSelected ? 0.38 : 0.22}
                  stroke={stg.colour}
                  strokeWidth={isSelected ? 1.5 : 0.8}
                  style={{ filter: isSelected ? "url(#lfc-glow)" : undefined }}
                />

                {/* Liquid Level Surface */}
                <ellipse
                  cx={iso(0, 0, uTop - 5, OX, OY)[0]}
                  cy={iso(0, 0, uTop - 5, OX, OY)[1]}
                  rx={rad - 2}
                  ry={(rad - 2) * 0.42}
                  fill={stg.colour}
                  opacity={isSelected ? 0.8 : 0.5}
                  stroke={C.edgeHi}
                  strokeWidth={0.6}
                />

                {/* Bobbing Specific Gravity Hydrometer Float */}
                {(() => {
                  const floatPos = iso(0, 0, uTop - 8, OX, OY);
                  return (
                    <g>
                      <circle cx={floatPos[0]} cy={floatPos[1]} r={isSelected ? 5 : 3.5} fill="#FAF5ED" stroke="#261E17" strokeWidth={1} />
                      <line
                        x1={floatPos[0]}
                        y1={floatPos[1]}
                        x2={floatPos[0]}
                        y2={floatPos[1] - (isSelected ? 14 : 10)}
                        stroke={C.edgeHi}
                        strokeWidth={1}
                      />
                    </g>
                  );
                })()}

                {/* Stage Flange Ring Top */}
                <ellipse
                  cx={iso(0, 0, uTop, OX, OY)[0]}
                  cy={iso(0, 0, uTop, OX, OY)[1]}
                  rx={rad + 6}
                  ry={(rad + 6) * 0.42}
                  fill="none"
                  stroke={isSelected ? C.edgeHi : C.brassSide}
                  strokeWidth={0.8}
                />

                {/* Stage Tag Callout Pointer (Left side) */}
                <line
                  x1={iso(-rad - 8, 0, uBase + stageHeight / 2, OX, OY)[0]}
                  y1={iso(-rad - 8, 0, uBase + stageHeight / 2, OX, OY)[1]}
                  x2={iso(-120, 0, uBase + stageHeight / 2, OX, OY)[0]}
                  y2={iso(-120, 0, uBase + stageHeight / 2, OX, OY)[1]}
                  stroke={isSelected ? stg.colour : C.edgeLo}
                  strokeWidth={isSelected ? 1.2 : 0.6}
                  strokeDasharray={isSelected ? "none" : "2 2"}
                />
                <circle
                  cx={iso(-rad - 8, 0, uBase + stageHeight / 2, OX, OY)[0]}
                  cy={iso(-rad - 8, 0, uBase + stageHeight / 2, OX, OY)[1]}
                  r={2}
                  fill={stg.colour}
                />
                <text
                  x={iso(-125, 0, uBase + stageHeight / 2, OX, OY)[0]}
                  y={iso(-125, 0, uBase + stageHeight / 2, OX, OY)[1] + 3}
                  fontSize={8}
                  fill={isSelected ? C.textPrimary : C.textSecondary}
                  fontFamily="monospace"
                  textAnchor="end"
                  fontWeight={isSelected ? "bold" : "normal"}
                >
                  {stg.label.toUpperCase()} · {stg.count}
                </text>
              </g>
            );
          })}

          {/* ── 3. Condenser Dome at Apex (SQL Collector) ── */}
          {(() => {
            const apexU = 5 * 36 + 10;
            const domeCenter = iso(0, 0, apexU, OX, OY);
            return (
              <g>
                {/* Copper/Brass Condenser Dome */}
                <path
                  d={`M ${domeCenter[0] - 26} ${domeCenter[1]}
                      A 26 22 0 0 1 ${domeCenter[0] + 26} ${domeCenter[1]}
                      L ${domeCenter[0]} ${domeCenter[1] - 30} Z`}
                  fill="url(#lfc-brass)"
                  stroke={C.edgeHi}
                  strokeWidth={0.9}
                />
                {/* Distillate vent pipe */}
                <line
                  x1={domeCenter[0]}
                  y1={domeCenter[1] - 30}
                  x2={domeCenter[0]}
                  y2={domeCenter[1] - 44}
                  stroke={C.brassTop}
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                <circle cx={domeCenter[0]} cy={domeCenter[1] - 46} r={3} fill={C.sql} style={{ filter: "url(#lfc-glow)" }} />
                <text
                  x={domeCenter[0]}
                  y={domeCenter[1] - 52}
                  fontSize={7}
                  fill={C.sql}
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  DISTILLATE HARVEST (SQL)
                </text>
              </g>
            );
          })()}

          {/* ── 4. Side Brass Return Manifold & Manometer ── */}
          {(() => {
            const manifoldX = 75;
            const pBottom = iso(manifoldX, 0, 15, OX, OY);
            const pTop = iso(manifoldX, 0, 165, OX, OY);
            const pDial = iso(manifoldX + 25, 0, 100, OX, OY);

            return (
              <g>
                {/* Vertical bypass pipe */}
                <line
                  x1={pBottom[0]}
                  y1={pBottom[1]}
                  x2={pTop[0]}
                  y2={pTop[1]}
                  stroke={C.brassFront}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
                {/* Horizontal takeoff arms */}
                {[30, 80, 130].map((armU) => {
                  const p1 = iso(40, 0, armU, OX, OY);
                  const p2 = iso(manifoldX, 0, armU, OX, OY);
                  return (
                    <line
                      key={`arm-${armU}`}
                      x1={p1[0]}
                      y1={p1[1]}
                      x2={p2[0]}
                      y2={p2[1]}
                      stroke={C.brassTop}
                      strokeWidth={3}
                    />
                  );
                })}

                {/* Analog Bourdon Tube Dial Gauge */}
                <line x1={iso(manifoldX, 0, 100, OX, OY)[0]} y1={iso(manifoldX, 0, 100, OX, OY)[1]} x2={pDial[0]} y2={pDial[1]} stroke={C.brassSide} strokeWidth={2} />
                <circle cx={pDial[0]} cy={pDial[1]} r={14} fill="#1A1410" stroke={C.brassTop} strokeWidth={1.5} />
                <circle cx={pDial[0]} cy={pDial[1]} r={11} fill="#FAF5ED" />
                {/* Gauge needle pointing high */}
                <line
                  x1={pDial[0]}
                  y1={pDial[1]}
                  x2={pDial[0] + 7}
                  y2={pDial[1] - 7}
                  stroke="#A82810"
                  strokeWidth={1.5}
                />
                <circle cx={pDial[0]} cy={pDial[1]} r={2} fill="#261E17" />
                <text
                  x={pDial[0]}
                  y={pDial[1] + 20}
                  fontSize={6}
                  fill={C.textMono}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  MANOMETER PSI
                </text>
              </g>
            );
          })()}

          {/* ── 5. Base Status Lights ── */}
          {DEFAULT_STAGES.map((s, idx) => {
            const rx = -140 + idx * 70;
            const [lx, ly] = iso(rx, 80, 0, OX, OY);
            const isSel = s.key === currentStageKey;
            return (
              <g key={`led-${s.key}`} onClick={() => handleSelect(s.key)} className="cursor-pointer">
                <circle
                  cx={lx}
                  cy={ly}
                  r={3.5}
                  fill={s.colour}
                  opacity={isSel ? 1 : 0.4}
                  style={{ filter: isSel ? "url(#lfc-glow)" : undefined }}
                />
                <circle cx={lx} cy={ly} r={5} fill="none" stroke={s.colour} strokeWidth={0.5} opacity={0.6} />
                <text
                  x={lx}
                  y={ly + 11}
                  fontSize={6.5}
                  fill={isSel ? C.textPrimary : C.textMuted}
                  fontFamily="monospace"
                  textAnchor="middle"
                  letterSpacing="0.05em"
                >
                  {s.key.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ── Interactive Stage Selector Pills ── */}
        {interactive && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#261E17] bg-[#120E0B]/80 px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[10px] text-[#A89682] mr-1">STRATA FILTER:</span>
              {DEFAULT_STAGES.map((stg) => {
                const isSelected = stg.key === currentStageKey;
                return (
                  <button
                    key={stg.key}
                    onClick={() => handleSelect(stg.key)}
                    className={`rounded px-2.5 py-1 font-mono text-[11px] transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#261E17] border border-[#E07830] text-[#F5EDE0] shadow-sm font-semibold"
                        : "bg-transparent text-[#8C7B6B] hover:text-[#F5EDE0] border border-transparent"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stg.colour }} />
                    {stg.label} ({stg.count})
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] font-mono text-[#8C7B6B]">
              Yield: <span className="text-[#3DAA7A] font-semibold">{currentStage.rate}</span>
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}
