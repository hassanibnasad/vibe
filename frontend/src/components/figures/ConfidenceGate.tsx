/**
 * ConfidenceGate
 *
 * Fig. 02 — Analytical Confidence Balance & Mechanical Diverter Gate
 *
 * A bespoke isometric SVG instrument for VibeAgent's Review Queue.
 * Visualizes the 0.85 Confidence Threshold triage boundary:
 *   - Twin-beam knife-edge balance comparing item score against 0.85 tare weight.
 *   - Precision pointer swinging toward AUTO-DISPATCH (green) or OPERATOR REVIEW (amber).
 *   - Articulated diverter gate track routing items between the direct dispatch chute and review cradle.
 *   - Synchronized live technical readout displaying angle, delta, and gate state.
 *
 * Tuned to Vibe's Smoky Charcoal (#0D0A08 / #1A1512) + Warm Parchment (#F0E8DC) + Terracotta (#E07830).
 */

import React, { useState } from "react";

// ─────────────────────────────────────────────
//  Isometric Projection Engine (2:1 standard)
// ─────────────────────────────────────────────

function iso(r: number, d: number, u: number, cx = 0, cy = 0): [number, number] {
  return [cx + (r - d), cy + (r + d) * 0.5 - u];
}

function pt(r: number, d: number, u: number, cx = 0, cy = 0): string {
  const [x, y] = iso(r, d, u, cx, cy);
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}

function poly(...points: [number, number][]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

// ─────────────────────────────────────────────
//  Color Palette (Vibe Theme Tokens)
// ─────────────────────────────────────────────

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
  terraDark: "#4D1F06",

  brassTop: "#C49A45",
  brassFront: "#9A7528",
  brassSide: "#684E18",

  green: "#3DAA7A",
  greenLo: "#1E583E",
  greenGlow: "#5AE0A4",

  amber: "#E59E28",
  amberLo: "#784E10",

  textPrimary: "#F5EDE0",
  textSecondary: "#A89682",
  textMuted: "#6B5D4E",
  textMono: "#8C7B6B",
} as const;

export interface ConfidenceGateProps {
  confidence?: number; // Score between 0.00 and 1.00 (defaults to 0.82)
  threshold?: number;  // Default 0.85
  itemLabel?: string;  // e.g. "Draft Reply #204"
  platform?: string;   // e.g. "LinkedIn"
  className?: string;
  interactive?: boolean;
}

export function ConfidenceGate({
  confidence: propConfidence,
  threshold = 0.85,
  itemLabel = "Draft Item",
  platform = "LinkedIn",
  className = "",
  interactive = true,
}: ConfidenceGateProps) {
  // Allow internal interactive override if user slides or clicks
  const [interactiveConfidence, setInteractiveConfidence] = useState<number | null>(null);

  const activeConfidence =
    interactiveConfidence !== null
      ? interactiveConfidence
      : typeof propConfidence === "number"
      ? Math.max(0, Math.min(1, propConfidence))
      : 0.82;

  const delta = activeConfidence - threshold;
  const isApproved = delta >= 0;

  // Beam deflection angle in degrees (-14° to +14°)
  // If activeConfidence < threshold -> left pan is lighter -> tilts upward on left (negative tilt)
  // If activeConfidence >= threshold -> left pan heavier -> tilts downward on left (positive tilt)
  const maxDeflection = 14;
  const tiltDeg = Math.max(-maxDeflection, Math.min(maxDeflection, (activeConfidence - threshold) * 55));
  const tiltRad = (tiltDeg * Math.PI) / 180;

  // Isometric origin
  const OX = 360;
  const OY = 150;

  // Beam fulcrum geometry
  const beamLength = 110; // half length
  const leftPanR = -beamLength * Math.cos(tiltRad);
  const leftPanU = 70 + beamLength * Math.sin(tiltRad);
  const rightPanR = beamLength * Math.cos(tiltRad);
  const rightPanU = 70 - beamLength * Math.sin(tiltRad);

  return (
    <figure
      className={`relative rounded-xl border border-[#382E25] bg-[#0E0B09] p-5 shadow-2xl transition-all duration-300 ${className}`}
      style={{
        background: "radial-gradient(120% 120% at 50% 0%, #1A1410 0%, #0E0B09 70%, #080605 100%)",
      }}
    >
      {/* ── Engineering Plate Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#261E17] pb-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] tracking-wider text-[#E07830] uppercase bg-[#E07830]/10 px-2 py-0.5 rounded border border-[#E07830]/30 font-semibold">
            Fig. 02
          </span>
          <span className="font-medium text-[#F5EDE0] tracking-tight">
            Confidence Balance & Diverter Gate
          </span>
          <span className="text-[#6B5D4E]">·</span>
          <span className="font-mono text-[11px] text-[#A89682]">
            0.85 Calibration Seam
          </span>
        </div>

        {/* Live Readout Pill */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-[#6B5D4E]">
            GATE:{" "}
            <strong
              className={`font-semibold ${
                isApproved ? "text-[#5AE0A4]" : "text-[#E59E28]"
              }`}
            >
              {isApproved ? "AUTO-DISPATCH" : "OPERATOR TRIAGE"}
            </strong>
          </span>
          <span className="text-[#382E25]">|</span>
          <span className="text-[#A89682]">
            DELTA:{" "}
            <span
              className={delta >= 0 ? "text-[#5AE0A4]" : "text-[#E07830]"}
            >
              {delta >= 0 ? `+${delta.toFixed(3)}` : delta.toFixed(3)}
            </span>
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
          aria-label="Analytical Confidence Balance and Diverter Gate Diagram"
        >
          <defs>
            {/* Terracotta glow */}
            <filter id="cg-glow-terra" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Green glow */}
            <filter id="cg-glow-green" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Amber glow */}
            <filter id="cg-glow-amber" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Brass gradient for tare weights */}
            <linearGradient id="cg-brass-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#DFC07A" />
              <stop offset="50%" stopColor="#C49A45" />
              <stop offset="100%" stopColor="#7E5F1E" />
            </linearGradient>

            {/* Laser pointer line */}
            <linearGradient id="cg-laser-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E07830" stopOpacity="1" />
              <stop offset="100%" stopColor="#E07830" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* ── 1. Isometric Base Deck (Dual-tier Cast Iron Bedplate) ── */}
          {/* Lower Bedplate Base */}
          <polygon
            points={poly(
              iso(-210, -90, -14, OX, OY),
              iso(210, -90, -14, OX, OY),
              iso(210, 90, -14, OX, OY),
              iso(-210, 90, -14, OX, OY)
            )}
            fill="#0A0806"
            stroke={C.edgeLo}
            strokeWidth={0.8}
          />
          {/* Lower Front Face */}
          <polygon
            points={poly(
              iso(-210, 90, -14, OX, OY),
              iso(210, 90, -14, OX, OY),
              iso(210, 90, 0, OX, OY),
              iso(-210, 90, 0, OX, OY)
            )}
            fill="#0F0C09"
            stroke={C.edgeLo}
            strokeWidth={0.7}
          />
          {/* Lower Side Face */}
          <polygon
            points={poly(
              iso(210, -90, -14, OX, OY),
              iso(210, 90, -14, OX, OY),
              iso(210, 90, 0, OX, OY),
              iso(210, -90, 0, OX, OY)
            )}
            fill="#0C0A07"
            stroke={C.edgeLo}
            strokeWidth={0.7}
          />

          {/* Upper Bedplate Top Surface */}
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

          {/* Technical grid lines on bedplate */}
          {[-120, -60, 0, 60, 120].map((r) => (
            <line
              key={`grid-r-${r}`}
              x1={iso(r, -70, 0, OX, OY)[0]}
              y1={iso(r, -70, 0, OX, OY)[1]}
              x2={iso(r, 70, 0, OX, OY)[0]}
              y2={iso(r, 70, 0, OX, OY)[1]}
              stroke={C.edgeFaint}
              strokeWidth={0.5}
              strokeDasharray="2 3"
            />
          ))}
          {[-40, 0, 40].map((d) => (
            <line
              key={`grid-d-${d}`}
              x1={iso(-180, d, 0, OX, OY)[0]}
              y1={iso(-180, d, 0, OX, OY)[1]}
              x2={iso(180, d, 0, OX, OY)[0]}
              y2={iso(180, d, 0, OX, OY)[1]}
              stroke={C.edgeFaint}
              strokeWidth={0.5}
              strokeDasharray="2 3"
            />
          ))}

          {/* ── 2. Rear Mechanical Diverter Gate Track Assembly ── */}
          {/* Chute rail mounts */}
          <g opacity={0.9}>
            {/* Upper Rail: Direct Dispatch Runway (Green) */}
            <path
              d={`M ${iso(-160, -60, 25, OX, OY).join(" ")} L ${iso(-40, -60, 25, OX, OY).join(
                " "
              )} L ${iso(160, -75, 45, OX, OY).join(" ")}`}
              fill="none"
              stroke={isApproved ? C.green : C.edgeLo}
              strokeWidth={2}
              strokeDasharray={isApproved ? "none" : "3 3"}
              style={{ filter: isApproved ? "url(#cg-glow-green)" : undefined }}
            />
            {/* Lower Rail: Operator Review Cradle (Amber) */}
            <path
              d={`M ${iso(-160, -60, 20, OX, OY).join(" ")} L ${iso(-40, -60, 20, OX, OY).join(
                " "
              )} L ${iso(160, -45, 10, OX, OY).join(" ")}`}
              fill="none"
              stroke={!isApproved ? C.amber : C.edgeLo}
              strokeWidth={2}
              strokeDasharray={!isApproved ? "none" : "3 3"}
              style={{ filter: !isApproved ? "url(#cg-glow-amber)" : undefined }}
            />

            {/* Solenoid Diverter Gate Flapper */}
            {(() => {
              const pivot = iso(-40, -60, 22, OX, OY);
              const flapperAngle = isApproved ? -28 : 28;
              const fx = pivot[0] + 32 * Math.cos((flapperAngle * Math.PI) / 180);
              const fy = pivot[1] + 16 * Math.sin((flapperAngle * Math.PI) / 180);
              return (
                <g>
                  {/* Solenoid housing */}
                  <circle cx={pivot[0]} cy={pivot[1]} r={6} fill="#261E17" stroke={C.edgeMid} strokeWidth={1} />
                  <circle cx={pivot[0]} cy={pivot[1]} r={3} fill={C.terra} />
                  {/* Gate blade */}
                  <line
                    x1={pivot[0]}
                    y1={pivot[1]}
                    x2={fx}
                    y2={fy}
                    stroke={C.edgeHi}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                  <circle cx={fx} cy={fy} r={2.5} fill={isApproved ? C.green : C.amber} />
                </g>
              );
            })()}

            {/* Track labels */}
            <text
              x={iso(165, -75, 48, OX, OY)[0]}
              y={iso(165, -75, 48, OX, OY)[1]}
              fontSize={7}
              fill={isApproved ? C.green : C.textMuted}
              fontFamily="monospace"
              letterSpacing="0.05em"
            >
              RUNWAY [≥0.85 AUTO]
            </text>
            <text
              x={iso(165, -45, 12, OX, OY)[0]}
              y={iso(165, -45, 12, OX, OY)[1]}
              fontSize={7}
              fill={!isApproved ? C.amber : C.textMuted}
              fontFamily="monospace"
              letterSpacing="0.05em"
            >
              INTERCEPT [&lt;0.85 TRIAGE]
            </text>
          </g>

          {/* ── 3. Central Balance Pillar & Knife-Edge Fulcrum ── */}
          {/* Cast brass central pillar */}
          <polygon
            points={poly(
              iso(-14, -14, 0, OX, OY),
              iso(14, -14, 0, OX, OY),
              iso(14, 14, 0, OX, OY),
              iso(-14, 14, 0, OX, OY)
            )}
            fill="#14100D"
            stroke={C.edgeLo}
            strokeWidth={0.8}
          />
          {/* Pillar stem */}
          <polygon
            points={poly(
              iso(-8, 8, 0, OX, OY),
              iso(8, 8, 0, OX, OY),
              iso(8, 8, 70, OX, OY),
              iso(-8, 8, 70, OX, OY)
            )}
            fill={C.brassFront}
            stroke={C.edgeLo}
            strokeWidth={0.6}
          />
          <polygon
            points={poly(
              iso(8, -8, 0, OX, OY),
              iso(8, 8, 0, OX, OY),
              iso(8, 8, 70, OX, OY),
              iso(8, -8, 70, OX, OY)
            )}
            fill={C.brassSide}
            stroke={C.edgeLo}
            strokeWidth={0.6}
          />

          {/* Agate knife-edge pivot block at u=70 */}
          <polygon
            points={poly(
              iso(-12, -8, 70, OX, OY),
              iso(12, -8, 70, OX, OY),
              iso(12, 8, 70, OX, OY),
              iso(-12, 8, 70, OX, OY)
            )}
            fill={C.brassTop}
            stroke={C.edgeHi}
            strokeWidth={0.8}
          />

          {/* ── 4. Deflecting Twin-Beam Balance ── */}
          {/* Beam assembly */}
          {(() => {
            const pLeft = iso(leftPanR, 0, leftPanU, OX, OY);
            const pRight = iso(rightPanR, 0, rightPanU, OX, OY);
            const pCenter = iso(0, 0, 70, OX, OY);

            // Precision pointer needle extending from center downward/upward across the sector
            const needleLen = 50;
            const needleTip = [
              pCenter[0] + needleLen * Math.sin(tiltRad * 1.6),
              pCenter[1] + needleLen * Math.cos(tiltRad * 1.6),
            ];

            return (
              <g>
                {/* Main truss beam */}
                <line
                  x1={pLeft[0]}
                  y1={pLeft[1]}
                  x2={pRight[0]}
                  y2={pRight[1]}
                  stroke={C.edgeHi}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <line
                  x1={pLeft[0]}
                  y1={pLeft[1]}
                  x2={pRight[0]}
                  y2={pRight[1]}
                  stroke={C.terra}
                  strokeWidth={1}
                />

                {/* Center fulcrum bearing ring */}
                <circle cx={pCenter[0]} cy={pCenter[1]} r={6} fill={C.card} stroke={C.terra} strokeWidth={1.5} />
                <circle cx={pCenter[0]} cy={pCenter[1]} r={2.5} fill={C.edgeHi} />

                {/* Calibrated Vernier Pointer Needle */}
                <line
                  x1={pCenter[0]}
                  y1={pCenter[1]}
                  x2={needleTip[0]}
                  y2={needleTip[1]}
                  stroke={C.edgeHi}
                  strokeWidth={1.5}
                />
                <circle
                  cx={needleTip[0]}
                  cy={needleTip[1]}
                  r={2.8}
                  fill={isApproved ? C.green : C.amber}
                  style={{
                    filter: isApproved ? "url(#cg-glow-green)" : "url(#cg-glow-amber)",
                  }}
                />

                {/* Sector Dial Arc behind needle */}
                {(() => {
                  const arcY = pCenter[1] + 46;
                  return (
                    <g opacity={0.85}>
                      {/* Scale backdrop plate */}
                      <path
                        d={`M ${pCenter[0] - 40} ${arcY - 4} Q ${pCenter[0]} ${arcY + 8} ${
                          pCenter[0] + 40
                        } ${arcY - 4}`}
                        fill="none"
                        stroke="#382E25"
                        strokeWidth={5}
                      />
                      {/* Threshold index line at center */}
                      <line
                        x1={pCenter[0]}
                        y1={arcY - 6}
                        x2={pCenter[0]}
                        y2={arcY + 8}
                        stroke={C.terra}
                        strokeWidth={1.5}
                      />
                      <text
                        x={pCenter[0]}
                        y={arcY + 18}
                        fontSize={6}
                        fill={C.textMono}
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        0.85 THRESHOLD
                      </text>
                    </g>
                  );
                })()}

                {/* ── Left Suspension: Active Review Item Load ── */}
                {/* Suspension Rods */}
                <line
                  x1={pLeft[0]}
                  y1={pLeft[1]}
                  x2={pLeft[0]}
                  y2={pLeft[1] + 35}
                  stroke={C.edgeMid}
                  strokeWidth={0.9}
                />
                {/* Left Pan */}
                <ellipse
                  cx={pLeft[0]}
                  cy={pLeft[1] + 35}
                  rx={26}
                  ry={9}
                  fill="#1C1612"
                  stroke={C.edgeMid}
                  strokeWidth={1}
                />

                {/* Active Item Payload Cylinder */}
                {(() => {
                  const cyH = Math.max(8, activeConfidence * 28);
                  const py = pLeft[1] + 35 - 3;
                  return (
                    <g>
                      {/* Cylinder body */}
                      <path
                        d={`M ${pLeft[0] - 16} ${py} 
                            L ${pLeft[0] - 16} ${py - cyH} 
                            A 16 5 0 0 1 ${pLeft[0] + 16} ${py - cyH} 
                            L ${pLeft[0] + 16} ${py} 
                            A 16 5 0 0 1 ${pLeft[0] - 16} ${py}`}
                        fill={isApproved ? "#2A4535" : "#4A331A"}
                        stroke={isApproved ? C.green : C.amber}
                        strokeWidth={0.8}
                      />
                      {/* Cylinder top */}
                      <ellipse
                        cx={pLeft[0]}
                        cy={py - cyH}
                        rx={16}
                        ry={5}
                        fill={isApproved ? "#3D6E52" : "#6E4C24"}
                        stroke={C.edgeHi}
                        strokeWidth={0.7}
                      />
                      {/* Score Stamp Text */}
                      <text
                        x={pLeft[0]}
                        y={py - cyH / 2 + 2}
                        fontSize={8}
                        fill={C.textPrimary}
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {activeConfidence.toFixed(2)}
                      </text>
                      <text
                        x={pLeft[0]}
                        y={py + 18}
                        fontSize={7}
                        fill={C.textSecondary}
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        ITEM SCORE
                      </text>
                    </g>
                  );
                })()}

                {/* ── Right Suspension: 0.85 Calibrated Tare Weight ── */}
                {/* Suspension Rods */}
                <line
                  x1={pRight[0]}
                  y1={pRight[1]}
                  x2={pRight[0]}
                  y2={pRight[1] + 35}
                  stroke={C.edgeMid}
                  strokeWidth={0.9}
                />
                {/* Right Pan */}
                <ellipse
                  cx={pRight[0]}
                  cy={pRight[1] + 35}
                  rx={26}
                  ry={9}
                  fill="#1C1612"
                  stroke={C.edgeMid}
                  strokeWidth={1}
                />

                {/* Brass Stamped 0.85 Weight */}
                {(() => {
                  const py = pRight[1] + 35 - 3;
                  const tareH = 0.85 * 28;
                  return (
                    <g>
                      <path
                        d={`M ${pRight[0] - 16} ${py} 
                            L ${pRight[0] - 16} ${py - tareH} 
                            A 16 5 0 0 1 ${pRight[0] + 16} ${py - tareH} 
                            L ${pRight[0] + 16} ${py} 
                            A 16 5 0 0 1 ${pRight[0] - 16} ${py}`}
                        fill="url(#cg-brass-grad)"
                        stroke="#B88A2D"
                        strokeWidth={0.8}
                      />
                      <ellipse
                        cx={pRight[0]}
                        cy={py - tareH}
                        rx={16}
                        ry={5}
                        fill="#F3D78A"
                        stroke={C.edgeHi}
                        strokeWidth={0.7}
                      />
                      {/* Weight handle knob */}
                      <circle cx={pRight[0]} cy={py - tareH - 4} r={3} fill="#DFC07A" stroke="#7E5F1E" strokeWidth={0.6} />
                      <text
                        x={pRight[0]}
                        y={py - tareH / 2 + 2}
                        fontSize={8}
                        fill="#1C1405"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        0.85
                      </text>
                      <text
                        x={pRight[0]}
                        y={py + 18}
                        fontSize={7}
                        fill={C.textSecondary}
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        TARE STANDARD
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })()}

          {/* ── 5. Status Pilot Lights & Front Telemetry ── */}
          {[
            {
              label: "AUTO (≥0.85)",
              colour: isApproved ? C.green : "#1F3B2C",
              glow: isApproved,
              rx: -120,
            },
            {
              label: "GATE TRIP",
              colour: C.terra,
              glow: true,
              rx: 0,
            },
            {
              label: "REVIEW (<0.85)",
              colour: !isApproved ? C.amber : "#3E2B12",
              glow: !isApproved,
              rx: 120,
            },
          ].map(({ label, colour, glow, rx }) => {
            const [lx, ly] = iso(rx, 80, 0, OX, OY);
            return (
              <g key={label}>
                <circle
                  cx={lx}
                  cy={ly}
                  r={3.5}
                  fill={colour}
                  style={{
                    filter: glow ? "url(#cg-glow-terra)" : undefined,
                  }}
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

        {/* ── Interactive Calibration Slider & Controls ── */}
        {interactive && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#261E17] bg-[#120E0B]/80 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#A89682]">
                TEST SCORE:
              </span>
              <input
                type="range"
                min="0.50"
                max="1.00"
                step="0.01"
                value={activeConfidence}
                onChange={(e) => setInteractiveConfidence(parseFloat(e.target.value))}
                className="h-1.5 w-32 cursor-pointer accent-[#E07830] bg-[#261E17] rounded"
              />
              <span className="font-mono font-semibold text-[#F5EDE0] w-9">
                {activeConfidence.toFixed(2)}
              </span>
              {interactiveConfidence !== null && (
                <button
                  onClick={() => setInteractiveConfidence(null)}
                  className="text-[10px] font-mono text-[#E07830] hover:underline ml-1"
                  title="Reset to selected item score"
                >
                  [reset]
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono text-[#8C7B6B]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#5AE0A4]" />
                Auto-Dispatch Track
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#E59E28]" />
                Human Review Cradle
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#E07830]" />
                0.85 Datum Fulcrum
              </span>
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}
