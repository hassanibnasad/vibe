/**
 * GenerativePress
 *
 * Fig. 01 — Generative Printing Press & Grounding Core
 *
 * A bespoke isometric SVG machine for VibeAgent's Content Studio.
 * Depicts the autonomous AI drafting process:
 *   - Continuous paper feed scroll advancing across the vacuum platen.
 *   - Dual counter-rotating brass drive rollers with knurled grips.
 *   - RAG Grounding Optic projecting radiant vector rays into the print platen.
 *   - Stepper motor drive assembly with cooling fins and cable bus harness.
 *   - Live telemetry readout displaying streaming speed, token buffer, and voice mode.
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
  surfaceElevated: "#2A221C",

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

  green: "#3DAA7A",
  blue: "#5A88E0",
  amber: "#E59E28",

  textPrimary: "#F5EDE0",
  textSecondary: "#A89682",
  textMuted: "#6B5D4E",
  textMono: "#8C7B6B",
} as const;

export interface GenerativePressProps {
  isStreaming?: boolean;
  rate?: number; // tok/s, e.g. 42
  tokensCount?: number;
  className?: string;
  interactive?: boolean;
}

export function GenerativePress({
  isStreaming: propIsStreaming = true,
  rate: propRate = 48,
  tokensCount = 824,
  className = "",
  interactive = true,
}: GenerativePressProps) {
  const [internalStreaming, setInternalStreaming] = useState<boolean | null>(null);
  const [internalRate, setInternalRate] = useState<number | null>(null);

  const activeStreaming = internalStreaming !== null ? internalStreaming : propIsStreaming;
  const activeRate = internalRate !== null ? internalRate : propRate;

  const OX = 360;
  const OY = 145;

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
            Fig. 01
          </span>
          <span className="font-medium text-[#F5EDE0] tracking-tight">
            Generative Printing Press & Grounding Core
          </span>
          <span className="text-[#6B5D4E]">·</span>
          <span className="font-mono text-[11px] text-[#A89682]">
            Type Synthesis Engine
          </span>
        </div>

        {/* Live Status Readout */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-[#6B5D4E]">
            ENGINE:{" "}
            <strong
              className={`font-semibold ${
                activeStreaming ? "text-[#5AE0A4]" : "text-[#A89682]"
              }`}
            >
              {activeStreaming ? "PRINTING / STREAMING" : "STANDBY"}
            </strong>
          </span>
          <span className="text-[#382E25]">|</span>
          <span className="text-[#A89682]">
            RATE:{" "}
            <span className="text-[#E07830] font-semibold">{activeStreaming ? `${activeRate} tok/s` : "0 tok/s"}</span>
          </span>
        </div>
      </div>

      {/* ── SVG Isometric Canvas ── */}
      <div className="relative w-full overflow-hidden pt-2">
        <svg
          viewBox="0 0 720 340"
          className="w-full h-auto select-none"
          style={{ maxHeight: 380 }}
          role="img"
          aria-label="Generative Press and Grounding Core Technical Diagram"
        >
          <defs>
            <filter id="gp-glow-terra" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="gp-glow-blue" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="gp-paper-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FAF5ED" />
              <stop offset="60%" stopColor="#EADCCB" />
              <stop offset="100%" stopColor="#C9B6A0" />
            </linearGradient>

            <linearGradient id="gp-prism-beam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5A88E0" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#E07830" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#E07830" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* ── 1. Cast Base Deck (Chassis) ── */}
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
              iso(210, -90, -12, OX, OY),
              iso(210, 90, -12, OX, OY),
              iso(210, 90, 0, OX, OY),
              iso(210, -90, 0, OX, OY)
            )}
            fill="#0C0A07"
            stroke={C.edgeLo}
            strokeWidth={0.7}
          />

          {/* Main Top Plate */}
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

          {/* ── 2. Paper Platen Bed & Moving Scroll Sheet ── */}
          {/* Raised Vacuum Platen */}
          <polygon
            points={poly(
              iso(-130, -50, 10, OX, OY),
              iso(130, -50, 10, OX, OY),
              iso(130, 50, 10, OX, OY),
              iso(-130, 50, 10, OX, OY)
            )}
            fill="#14100D"
            stroke={C.edgeMid}
            strokeWidth={0.7}
          />

          {/* Moving Parchment Paper Web (Advancing from left through center out to right) */}
          <polygon
            points={poly(
              iso(-140, -35, 12, OX, OY),
              iso(145, -35, 12, OX, OY),
              iso(145, 35, 12, OX, OY),
              iso(-140, 35, 12, OX, OY)
            )}
            fill="url(#gp-paper-grad)"
            stroke={C.edgeHi}
            strokeWidth={0.6}
          />

          {/* Printed Content Lines on the Parchment */}
          {[-25, -15, -5, 5, 15, 25].map((d, idx) => (
            <line
              key={`paper-line-${idx}`}
              x1={iso(-110, d, 12.5, OX, OY)[0]}
              y1={iso(-110, d, 12.5, OX, OY)[1]}
              x2={iso(90, d, 12.5, OX, OY)[0]}
              y2={iso(90, d, 12.5, OX, OY)[1]}
              stroke="#2C231A"
              strokeWidth={1.2}
              strokeDasharray={idx % 2 === 0 ? "12 4 8 3" : "8 3 14 4"}
              opacity={0.85}
            />
          ))}

          {/* Active Highlight Marker on Current Token */}
          {activeStreaming && (
            <circle
              cx={iso(20, 5, 13, OX, OY)[0]}
              cy={iso(20, 5, 13, OX, OY)[1]}
              r={4}
              fill={C.terra}
              style={{ filter: "url(#gp-glow-terra)" }}
            />
          )}

          {/* ── 3. Dual Brass Feed Rollers (Input & Output) ── */}
          {/* Left Intake Roller Assembly */}
          {[-120, 110].map((rx, rIdx) => {
            const rollerH = 14;
            const rollerZ = 24;
            return (
              <g key={`roller-${rIdx}`}>
                {/* Bearing Blocks */}
                <polygon
                  points={poly(
                    iso(rx - 8, -45, 0, OX, OY),
                    iso(rx + 8, -45, 0, OX, OY),
                    iso(rx + 8, -35, 30, OX, OY),
                    iso(rx - 8, -35, 30, OX, OY)
                  )}
                  fill="#1C1612"
                  stroke={C.edgeLo}
                  strokeWidth={0.6}
                />
                <polygon
                  points={poly(
                    iso(rx - 8, 35, 0, OX, OY),
                    iso(rx + 8, 35, 0, OX, OY),
                    iso(rx + 8, 45, 30, OX, OY),
                    iso(rx - 8, 45, 30, OX, OY)
                  )}
                  fill="#1C1612"
                  stroke={C.edgeLo}
                  strokeWidth={0.6}
                />

                {/* Roller Cylinder Axis */}
                <line
                  x1={iso(rx, -40, rollerZ, OX, OY)[0]}
                  y1={iso(rx, -40, rollerZ, OX, OY)[1]}
                  x2={iso(rx, 40, rollerZ, OX, OY)[0]}
                  y2={iso(rx, 40, rollerZ, OX, OY)[1]}
                  stroke={C.brassTop}
                  strokeWidth={rollerH}
                  strokeLinecap="round"
                />
                {/* Knurled grips on roller */}
                {[-25, -10, 5, 20].map((kd) => (
                  <ellipse
                    key={`knurl-${rx}-${kd}`}
                    cx={iso(rx, kd, rollerZ, OX, OY)[0]}
                    cy={iso(rx, kd, rollerZ, OX, OY)[1]}
                    rx={3}
                    ry={7}
                    fill="none"
                    stroke={C.brassSide}
                    strokeWidth={0.8}
                  />
                ))}
              </g>
            );
          })}

          {/* ── 4. RAG Grounding Optics Overhead Gantry ── */}
          {/* Arch pillars */}
          <polygon
            points={poly(
              iso(-15, -60, 0, OX, OY),
              iso(15, -60, 0, OX, OY),
              iso(15, -60, 90, OX, OY),
              iso(-15, -60, 90, OX, OY)
            )}
            fill="#1E1814"
            stroke={C.edgeMid}
            strokeWidth={0.7}
          />
          <polygon
            points={poly(
              iso(-15, 60, 0, OX, OY),
              iso(15, 60, 0, OX, OY),
              iso(15, 60, 90, OX, OY),
              iso(-15, 60, 90, OX, OY)
            )}
            fill="#1E1814"
            stroke={C.edgeMid}
            strokeWidth={0.7}
          />

          {/* Crossbridge beam */}
          <polygon
            points={poly(
              iso(-12, -60, 85, OX, OY),
              iso(12, -60, 85, OX, OY),
              iso(12, 60, 85, OX, OY),
              iso(-12, 60, 85, OX, OY)
            )}
            fill={C.faceTop}
            stroke={C.edgeHi}
            strokeWidth={0.8}
          />

          {/* Grounding Optical Prism Housing at Center Top (u=85) */}
          {(() => {
            const prismBase = iso(0, 0, 85, OX, OY);
            const targetPlaten = iso(0, 0, 14, OX, OY);
            return (
              <g>
                {/* Prism Chamber Box */}
                <polygon
                  points={poly(
                    iso(-20, -20, 85, OX, OY),
                    iso(20, -20, 85, OX, OY),
                    iso(20, 20, 85, OX, OY),
                    iso(-20, 20, 85, OX, OY)
                  )}
                  fill="#2A2018"
                  stroke={C.terra}
                  strokeWidth={1}
                />
                {/* Triangular Crystal Lens */}
                <polygon
                  points={poly(
                    iso(-14, 0, 80, OX, OY),
                    iso(14, -12, 80, OX, OY),
                    iso(0, 16, 80, OX, OY)
                  )}
                  fill={C.blue}
                  opacity={0.85}
                  stroke="#8AB0FA"
                  strokeWidth={0.9}
                  style={{ filter: "url(#gp-glow-blue)" }}
                />

                {/* Radiant Vector Injection Laser Cones */}
                {activeStreaming && (
                  <g>
                    <polygon
                      points={`${prismBase[0]},${prismBase[1]} ${targetPlaten[0] - 28},${
                        targetPlaten[1] + 12
                      } ${targetPlaten[0] + 28},${targetPlaten[1] + 12}`}
                      fill="url(#gp-prism-beam)"
                      opacity={0.75}
                    />
                    {/* Laser trace lines */}
                    {[-20, -8, 8, 20].map((lx) => (
                      <line
                        key={`laser-${lx}`}
                        x1={prismBase[0]}
                        y1={prismBase[1]}
                        x2={targetPlaten[0] + lx}
                        y2={targetPlaten[1]}
                        stroke={C.terraGlow}
                        strokeWidth={0.8}
                        strokeDasharray="3 2"
                        opacity={0.9}
                      />
                    ))}
                  </g>
                )}
              </g>
            );
          })()}

          {/* ── 5. Stepper Motor Drive Assembly & Cable Bus ── */}
          {/* Stepper motor cylinder at right rear */}
          {(() => {
            const [mx, my] = iso(160, -50, 20, OX, OY);
            return (
              <g>
                <circle cx={mx} cy={my} r={14} fill="#14100D" stroke={C.edgeMid} strokeWidth={1} />
                <circle cx={mx} cy={my} r={7} fill="#261E17" stroke={C.terra} strokeWidth={0.8} />
                {/* Cooling fins */}
                {[-10, -5, 0, 5, 10].map((off) => (
                  <line
                    key={`fin-${off}`}
                    x1={mx - 14}
                    y1={my + off}
                    x2={mx + 14}
                    y2={my + off}
                    stroke={C.edgeLo}
                    strokeWidth={0.5}
                  />
                ))}
                {/* Drive cable bus */}
                <path
                  d={`M ${mx} ${my + 14} Q ${mx - 20} ${my + 35} ${mx - 50} ${my + 40}`}
                  fill="none"
                  stroke={C.terra}
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                />
              </g>
            );
          })()}

          {/* ── 6. Front Status Annunciator ── */}
          {[
            { label: "FEED", colour: activeStreaming ? C.green : "#1F3B2C", glow: activeStreaming, rx: -100 },
            { label: "RAG GROUNDING", colour: C.blue, glow: activeStreaming, rx: 0 },
            { label: "STREAM", colour: C.terra, glow: activeStreaming, rx: 100 },
          ].map(({ label, colour, glow, rx }) => {
            const [lx, ly] = iso(rx, 80, 0, OX, OY);
            return (
              <g key={label}>
                <circle
                  cx={lx}
                  cy={ly}
                  r={3.5}
                  fill={colour}
                  style={{ filter: glow ? "url(#gp-glow-terra)" : undefined }}
                />
                <circle cx={lx} cy={ly} r={5} fill="none" stroke={colour} strokeWidth={0.6} opacity={0.5} />
                <text
                  x={lx}
                  y={ly + 11}
                  fontSize={6.5}
                  fill={C.textMono}
                  fontFamily="monospace"
                  textAnchor="middle"
                  letterSpacing="0.05em"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ── Interactive Speed & Motor Controls ── */}
        {interactive && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#261E17] bg-[#120E0B]/80 px-3 py-2 text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setInternalStreaming(!activeStreaming)}
                className={`rounded px-2.5 py-1 font-mono text-[11px] font-medium transition-colors ${
                  activeStreaming
                    ? "bg-[#E07830] text-black hover:bg-[#FF9A54]"
                    : "bg-[#261E17] text-[#A89682] hover:bg-[#382E25]"
                }`}
              >
                {activeStreaming ? "PAUSE STREAM" : "START STREAM"}
              </button>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#A89682]">VELOCITY:</span>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={activeRate}
                  disabled={!activeStreaming}
                  onChange={(e) => setInternalRate(parseInt(e.target.value, 10))}
                  className="h-1.5 w-24 cursor-pointer accent-[#E07830] bg-[#261E17] rounded"
                />
                <span className="font-mono font-semibold text-[#F5EDE0] w-12 text-[11px]">
                  {activeRate} tok/s
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono text-[#8C7B6B]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#5A88E0]" />
                RAG Vector Beam
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#C49A45]" />
                Brass Feed Rollers
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FAF5ED]" />
                Parchment Web
              </span>
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}
