/**
 * VectorGroundingStation
 *
 * A static isometric SVG figure for the Knowledge Base page.
 * Depicts the full KnowledgeDoc pipeline:
 *   Document cassette rack → Chunking blade press → Refraction prism → Embedding dot grid
 *
 * Pure SVG — no motion, no external packages beyond React.
 * Colour palette maps directly to Vibe's CSS tokens via inline HSL values
 * that mirror globals.css. A wrapper `data-theme` attribute on <body>
 * switches light/dark; the figure reads CSS custom properties at render time.
 */

import React from "react";

// ─────────────────────────────────────────────
//  Isometric projection helpers
//  Standard 2:1 iso (30° elevation, azimuth split as x/y axes)
// ─────────────────────────────────────────────

/** Convert isometric [right, depth, up] → SVG [x, y] */
function iso(r: number, d: number, u: number, cx = 0, cy = 0): [number, number] {
  // Standard isometric basis vectors (tile angle 26.565°)
  // right-axis  →  (+1, +0.5)
  // depth-axis  →  (-1, +0.5)
  // up-axis     →  ( 0, -1)
  return [cx + r - d, cy + (r + d) * 0.5 - u];
}

function pt(r: number, d: number, u: number, cx = 0, cy = 0) {
  const [x, y] = iso(r, d, u, cx, cy);
  return `${x},${y}`;
}

/** Build a closed polygon path string from a list of iso coords */
function poly(...points: [number, number][]): string {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

// ─────────────────────────────────────────────
//  Colour palette (matches globals.css tokens)
// ─────────────────────────────────────────────

// Dark mode values (primary appearance — Smoky Charcoal + Terracotta)
const C = {
  // Surfaces
  canvas:         "#0D0A08",
  card:           "#1A1512",
  surfaceRaised:  "#221D19",
  surfaceElevated:"#2C2622",

  // Lines & strokes
  edgeHi:   "#F0E8DC",  // warm parchment white — bright edges
  edgeMid:  "#7A6A5A",  // medium warm gray
  edgeLo:   "#3D3328",  // dark warm shadow
  edgeFaint:"#2A2218",  // barely visible crease

  // Top / face / shading fills
  faceTop:  "#1F1A16",   // top planes — slightly lighter than card
  faceFront:"#171210",   // front planes
  faceSide: "#131008",   // side planes in shadow

  // Terracotta accent
  terra:    "#E07830",   // primary terracotta
  terraLo:  "#8C3E10",   // deep terracotta shadow
  terraMid: "#B55C22",   // mid terracotta

  // Semantic colours
  green:    "#3DAA7A",
  blue:     "#5A7FCC",
  amber:    "#C88A28",

  // Text
  textPrimary:   "#F5EDE0",
  textSecondary: "#9A8A7A",
  textMono:      "#7A6A5A",
} as const;

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────

/** One isometric box: top + front + side */
function IsoBox({
  cx, cy,
  r, d, u,   // half-sizes in each axis (right, depth, up)
  fillTop = C.faceTop,
  fillFront = C.faceFront,
  fillSide = C.faceSide,
  stroke = C.edgeLo,
  strokeTop = C.edgeMid,
  strokeHi = C.edgeHi,
  strokeWidth = 0.6,
}: {
  cx?: number; cy?: number;
  r: number; d: number; u: number;
  fillTop?: string; fillFront?: string; fillSide?: string;
  stroke?: string; strokeTop?: string; strokeHi?: string;
  strokeWidth?: number;
}) {
  const x = cx ?? 0;
  const y = cy ?? 0;

  // 8 corners of the box at origin
  const corners = {
    // top face
    tBL: iso(-r, -d, u, x, y),
    tBR: iso( r, -d, u, x, y),
    tFR: iso( r,  d, u, x, y),
    tFL: iso(-r,  d, u, x, y),
    // bottom face
    bBL: iso(-r, -d, 0, x, y),
    bBR: iso( r, -d, 0, x, y),
    bFR: iso( r,  d, 0, x, y),
    bFL: iso(-r,  d, 0, x, y),
  };

  const topPoly   = poly(corners.tBL, corners.tBR, corners.tFR, corners.tFL);
  const frontPoly = poly(corners.tFL, corners.tFR, corners.bFR, corners.bFL);
  const sidePoly  = poly(corners.tBR, corners.tFR, corners.bFR, corners.bBR);

  return (
    <g>
      {/* Side (right — in shadow) */}
      <polygon points={sidePoly} fill={fillSide} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
      {/* Front face */}
      <polygon points={frontPoly} fill={fillFront} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
      {/* Top face */}
      <polygon points={topPoly} fill={fillTop} stroke={strokeTop} strokeWidth={strokeWidth} strokeLinejoin="round" />
      {/* Bright top-left edge */}
      <line
        x1={corners.tBL[0]} y1={corners.tBL[1]}
        x2={corners.tFL[0]} y2={corners.tFL[1]}
        stroke={strokeHi} strokeWidth={strokeWidth * 0.8} strokeLinecap="round"
      />
      <line
        x1={corners.tBL[0]} y1={corners.tBL[1]}
        x2={corners.tBR[0]} y2={corners.tBR[1]}
        stroke={strokeHi} strokeWidth={strokeWidth * 0.5} strokeLinecap="round"
      />
    </g>
  );
}

// ─────────────────────────────────────────────
//  Figure geometry constants
// ─────────────────────────────────────────────
const W = 560;
const H = 380;
const OX = 280;  // origin cx
const OY = 200;  // origin cy

// ─────────────────────────────────────────────
//  Main figure
// ─────────────────────────────────────────────

export function VectorGroundingStation({ className }: { className?: string }) {
  return (
    <figure className={className} aria-label="Vector Grounding Station — the Knowledge Base pipeline">
      {/* Engineering plate frame */}
      <div
        style={{
          position: "relative",
          background: C.card,
          border: `1px solid ${C.edgeLo}`,
          borderRadius: 2,
          padding: "44px 20px 36px",
          fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
          overflow: "hidden",
        }}
      >
        {/* Corner labels */}
        <span style={{ position: "absolute", top: 14, left: 18, fontSize: 10, color: C.textSecondary, letterSpacing: "0.04em" }}>Fig. 02</span>
        <span style={{ position: "absolute", top: 14, right: 18, fontSize: 10, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em" }}>Vector Grounding Station</span>
        <span style={{ position: "absolute", bottom: 14, left: 18, fontSize: 10, color: C.textMono, textTransform: "uppercase", letterSpacing: "0.08em" }}>BGE-SMALL · 1536-DIM · pgvector cosine</span>
        <span style={{ position: "absolute", bottom: 14, right: 18, fontSize: 10, color: C.textSecondary, fontVariantNumeric: "tabular-nums" }}>VibeAgent KnowledgeDoc Pipeline</span>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="auto"
          role="img"
          aria-hidden="true"
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            {/* Terracotta glow filter */}
            <filter id="vgs-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Subtle shadow */}
            <filter id="vgs-shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* ── 0. Workbench base ── */}
          <IsoBox cx={OX} cy={OY + 60} r={160} d={90} u={6}
            fillTop={C.surfaceRaised} fillFront={C.faceFront} fillSide={C.faceSide}
            strokeTop={C.edgeMid} stroke={C.edgeFaint} strokeWidth={0.7}
          />
          {/* Bench legs — 4 posts */}
          {[[-120, -50], [120, -50], [-120, 50], [120, 50]].map(([lr, ldd], i) => {
            const [bx, by] = iso(lr, ldd, 0, OX, OY + 60);
            return (
              <g key={i}>
                <line x1={bx} y1={by} x2={bx} y2={by + 28}
                  stroke={C.edgeMid} strokeWidth={2.5} strokeLinecap="round" />
              </g>
            );
          })}
          {/* Bench surface — subtle ruled lines */}
          {[-80, -30, 20, 70, 120].map((rx, i) => {
            const a = iso(rx, -85, 6, OX, OY + 60);
            const b = iso(rx, 85, 6, OX, OY + 60);
            return (
              <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
                stroke={C.edgeFaint} strokeWidth={0.4} />
            );
          })}

          {/* ── 1. Document Cassette Rack (left section) ── */}
          {/* Rack frame */}
          <IsoBox cx={OX - 92} cy={OY + 14} r={38} d={34} u={64}
            fillTop={C.surfaceElevated} fillFront={C.surfaceRaised} fillSide={C.faceSide}
            strokeTop={C.edgeMid} stroke={C.edgeLo} strokeWidth={0.6}
          />
          {/* 4 cassette cartridges */}
          {[52, 36, 20, 6].map((uOffset, i) => {
            const terra = i === 0; // topmost is being processed
            return (
              <g key={i}>
                <IsoBox
                  cx={OX - 92} cy={OY + 14}
                  r={28} d={22} u={8}
                  fillTop={terra ? C.terraMid : C.surfaceElevated}
                  fillFront={terra ? C.terraLo : "#1C1710"}
                  fillSide={terra ? "#6B2808" : C.faceSide}
                  strokeTop={terra ? C.terra : C.edgeMid}
                  strokeHi={terra ? C.terra : C.edgeHi}
                  stroke={terra ? C.terraMid : C.edgeFaint}
                  strokeWidth={0.7}
                />
                {/* Cassette label stripe */}
                {(() => {
                  const [lx, ly] = iso(-28, 22, uOffset + 4, OX - 92, OY + 14);
                  const [rx, ry] = iso(28, 22, uOffset + 4, OX - 92, OY + 14);
                  return (
                    <line
                      x1={lx} y1={ly} x2={rx} y2={ry}
                      stroke={terra ? C.terra : C.edgeMid}
                      strokeWidth={terra ? 1.2 : 0.5}
                      strokeLinecap="round"
                    />
                  );
                })()}
              </g>
            );
          })}
          {/* Rack label */}
          {(() => {
            const [tx, ty] = iso(-38, -36, 68, OX - 92, OY + 14);
            return (
              <text x={tx} y={ty - 2} fontSize={7} fill={C.textMono} fontFamily="monospace"
                textAnchor="middle" letterSpacing="0.08em">
                CASSETTE RACK
              </text>
            );
          })()}

          {/* ── 2. Feed track / conveyor from rack to press ── */}
          {/* Two guide rails */}
          {[-8, 8].map((offset, i) => {
            const from = iso(-52, 12 + offset, 14, OX - 92, OY + 14);
            const to   = iso(-14, 12 + offset, 14, OX, OY + 14);
            return (
              <line key={i}
                x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}
                stroke={C.edgeMid} strokeWidth={1.2} strokeLinecap="round"
              />
            );
          })}
          {/* Travelling cassette on rail (halfway) */}
          <IsoBox cx={OX - 46} cy={OY + 20} r={18} d={14} u={6}
            fillTop={C.terraMid} fillFront={C.terraLo} fillSide="#6B2808"
            strokeTop={C.terra} stroke={C.terraMid} strokeHi={C.terra} strokeWidth={0.7}
          />

          {/* ── 3. Chunking Press (centre-left) ── */}
          {/* Press body */}
          <IsoBox cx={OX} cy={OY + 14} r={32} d={28} u={44}
            fillTop={C.surfaceElevated} fillFront={C.surfaceRaised} fillSide={C.faceSide}
            strokeTop={C.edgeMid} stroke={C.edgeLo} strokeWidth={0.7}
          />
          {/* Blade platen descending */}
          <IsoBox cx={OX} cy={OY + 14} r={26} d={20} u={4}
            fillTop={C.edgeMid} fillFront={C.edgeLo} fillSide={C.edgeFaint}
            strokeTop={C.edgeHi} stroke={C.edgeMid} strokeHi={C.edgeHi} strokeWidth={0.6}
          />
          {/* Blade teeth: 5 cuts */}
          {[-20, -10, 0, 10, 20].map((rx, i) => {
            const top = iso(rx, -20, 26, OX, OY + 14);
            const bot = iso(rx, 20, 26, OX, OY + 14);
            return (
              <line key={i}
                x1={top[0]} y1={top[1]} x2={bot[0]} y2={bot[1]}
                stroke={C.edgeHi} strokeWidth={0.5} strokeLinecap="round"
                strokeDasharray="2 3"
              />
            );
          })}
          {/* Press arm / lever */}
          {(() => {
            const base  = iso(0, 0, 44, OX, OY + 14);
            const knob  = iso(0, -42, 76, OX, OY + 14);
            const pivot = iso(0, -38, 60, OX, OY + 14);
            return (
              <g>
                <line x1={base[0]} y1={base[1]} x2={pivot[0]} y2={pivot[1]}
                  stroke={C.edgeMid} strokeWidth={2.5} strokeLinecap="round" />
                <line x1={pivot[0]} y1={pivot[1]} x2={knob[0]} y2={knob[1]}
                  stroke={C.edgeMid} strokeWidth={2} strokeLinecap="round" />
                {/* Knob ball */}
                <circle cx={knob[0]} cy={knob[1]} r={4}
                  fill={C.surfaceElevated} stroke={C.edgeMid} strokeWidth={0.8} />
              </g>
            );
          })()}
          {/* Chunk output — small tiles sliding out */}
          {[0, 1, 2].map(i => {
            const slip = i * 10;
            const [bx, by] = iso(36 + slip, 8, 12 + slip * 0.3, OX, OY + 14);
            return (
              <rect key={i}
                x={bx - 7} y={by - 4}
                width={14} height={8}
                rx={1}
                fill={C.surfaceRaised}
                stroke={C.edgeMid}
                strokeWidth={0.5}
                transform={`rotate(${-30 + i * 2}, ${bx}, ${by})`}
              />
            );
          })}
          {/* Press label */}
          {(() => {
            const [tx, ty] = iso(0, -30, 46, OX, OY + 14);
            return (
              <text x={tx} y={ty - 2} fontSize={7} fill={C.textMono} fontFamily="monospace"
                textAnchor="middle" letterSpacing="0.08em">
                CHUNK PRESS
              </text>
            );
          })()}

          {/* ── 4. Connector pipe from press to prism ── */}
          {[-4, 4].map((offset, i) => {
            const from = iso(32, offset, 14, OX, OY + 14);
            const to   = iso(14, offset, 14, OX + 76, OY + 14);
            return (
              <line key={i}
                x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}
                stroke={C.edgeMid} strokeWidth={1} strokeLinecap="round"
              />
            );
          })}

          {/* ── 5. Refraction Prism (centre-right) ── */}
          {(() => {
            const PX = OX + 76;
            const PY = OY + 14;

            // Triangular prism: 3 rectangular faces + 2 triangular end caps
            // Prism runs along the depth axis
            // Base triangle: apex at (0,0,36), left at (-20,0,0), right at (20,0,0)
            const apexF  = iso(0,   28, 36, PX, PY);
            const leftF  = iso(-20, 28, 0,  PX, PY);
            const rightF = iso(20,  28, 0,  PX, PY);
            const apexB  = iso(0,  -28, 36, PX, PY);
            const leftB  = iso(-20,-28, 0,  PX, PY);
            const rightB = iso(20, -28, 0,  PX, PY);

            const frontFace = poly(apexF, leftF, rightF);
            const backFace  = poly(apexB, leftB, rightB);
            const topFace   = poly(apexF, apexB, rightB, rightF);  // right slope
            const leftFace  = poly(apexF, apexB, leftB, leftF);   // left slope
            const botFace   = poly(leftF, rightF, rightB, leftB);  // base

            // Terracotta beam — thin line from chunk input → prism apex → fan out
            const beamIn   = iso(-26, 0, 14, PX, PY);
            const beamApex = iso(0,   0, 36, PX, PY);

            return (
              <g>
                {/* Bottom face */}
                <polygon points={botFace} fill={C.surfaceRaised} stroke={C.edgeFaint} strokeWidth={0.5} />
                {/* Left slope face */}
                <polygon points={leftFace} fill="#1A1208" stroke={C.edgeLo} strokeWidth={0.6} />
                {/* Right slope face */}
                <polygon points={topFace} fill={C.surfaceElevated} stroke={C.edgeMid} strokeWidth={0.6} />
                {/* Front triangular cap */}
                <polygon points={frontFace} fill="#171210" stroke={C.edgeMid} strokeWidth={0.6} />
                {/* Back cap — mostly hidden but edge shows */}
                <polygon points={backFace} fill={C.faceSide} stroke={C.edgeFaint} strokeWidth={0.4} />

                {/* Terracotta refraction beam in */}
                <line x1={beamIn[0]} y1={beamIn[1]} x2={beamApex[0]} y2={beamApex[1]}
                  stroke={C.terra} strokeWidth={1.5} strokeLinecap="round"
                  style={{ filter: "url(#vgs-glow)" }}
                />

                {/* Dispersed beams fanning out from apex to embedding grid */}
                {[-20, -10, 0, 10, 20].map((rx, i) => {
                  const target = iso(rx + 62, i * 6 - 10, 14 + i * 4, PX, PY);
                  const colours = [C.blue, C.green, C.terra, C.amber, C.edgeHi];
                  return (
                    <line key={i}
                      x1={beamApex[0]} y1={beamApex[1]}
                      x2={target[0]} y2={target[1]}
                      stroke={colours[i]} strokeWidth={0.8} strokeLinecap="round"
                      opacity={0.7}
                    />
                  );
                })}

                {/* Prism label */}
                {(() => {
                  const [tx, ty] = iso(0, -32, 40, PX, PY);
                  return (
                    <text x={tx} y={ty - 2} fontSize={7} fill={C.textMono} fontFamily="monospace"
                      textAnchor="middle" letterSpacing="0.08em">
                      PRISM
                    </text>
                  );
                })()}
              </g>
            );
          })()}

          {/* ── 6. Embedding Dot Grid (right section) ── */}
          {(() => {
            const GX = OX + 168;
            const GY = OY + 14;

            // Grid housing box
            return (
              <g>
                <IsoBox cx={GX} cy={GY} r={38} d={34} u={64}
                  fillTop={C.surfaceElevated} fillFront={C.surfaceRaised} fillSide={C.faceSide}
                  strokeTop={C.edgeMid} stroke={C.edgeLo} strokeWidth={0.6}
                />
                {/* Dot matrix on front face — 6×8 grid */}
                {Array.from({ length: 8 }).map((_, row) =>
                  Array.from({ length: 6 }).map((_, col) => {
                    const dotR = -26 + col * 10;
                    const dotU = 10 + row * 7;
                    const [dx, dy] = iso(dotR, 34, dotU, GX, GY);
                    // Activated dots in a gradient pattern
                    const activated = row * 6 + col < 28;
                    const colours = [C.terra, C.green, C.blue, C.amber, C.edgeMid, C.edgeHi];
                    const dotColor = activated ? colours[(row + col) % colours.length] : C.edgeFaint;
                    return (
                      <circle key={`${row}-${col}`}
                        cx={dx} cy={dy} r={1.6}
                        fill={dotColor}
                        opacity={activated ? 0.85 : 0.2}
                      />
                    );
                  })
                )}
                {/* Grid label */}
                {(() => {
                  const [tx, ty] = iso(38, -36, 68, GX, GY);
                  return (
                    <text x={tx} y={ty - 2} fontSize={7} fill={C.textMono} fontFamily="monospace"
                      textAnchor="middle" letterSpacing="0.08em">
                      EMBEDDING GRID
                    </text>
                  );
                })()}
                {/* 1536 label on top face */}
                {(() => {
                  const [tx, ty] = iso(0, 0, 68, GX, GY);
                  return (
                    <text x={tx} y={ty - 4} fontSize={6.5} fill={C.terra} fontFamily="monospace"
                      textAnchor="middle" letterSpacing="0.06em">
                      1536-D
                    </text>
                  );
                })()}
              </g>
            );
          })()}

          {/* ── 7. Cosine similarity needle (right, mounted on top of grid box) ── */}
          {(() => {
            const NX = OX + 168;
            const NY = OY - 28;

            const needleBase = iso(0, 0, 76, NX, NY);
            const needleTip  = iso(-22, -14, 76, NX, NY);

            return (
              <g>
                {/* Gauge arc — rough arc using polyline */}
                {Array.from({ length: 9 }).map((_, i) => {
                  const angle = (i / 8) * Math.PI - Math.PI * 0.85;
                  const rx = Math.cos(angle) * 18;
                  const ry = Math.sin(angle) * 9;
                  const [px, py] = iso(rx, ry, 76, NX, NY);
                  return (
                    <circle key={i} cx={px} cy={py} r={0.8}
                      fill={i < 5 ? C.green : i < 7 ? C.amber : C.edgeMid}
                      opacity={0.7} />
                  );
                })}
                {/* Needle */}
                <line x1={needleBase[0]} y1={needleBase[1]}
                  x2={needleTip[0]} y2={needleTip[1]}
                  stroke={C.terra} strokeWidth={1.2} strokeLinecap="round" />
                <circle cx={needleBase[0]} cy={needleBase[1]} r={2.4}
                  fill={C.surfaceElevated} stroke={C.edgeMid} strokeWidth={0.6} />
                {/* Label */}
                <text x={needleTip[0] - 4} y={needleTip[1] - 5}
                  fontSize={6.5} fill={C.terra} fontFamily="monospace"
                  textAnchor="middle">
                  0.91
                </text>
                <text x={needleBase[0]} y={needleBase[1] + 14}
                  fontSize={6} fill={C.textMono} fontFamily="monospace"
                  textAnchor="middle" letterSpacing="0.06em">
                  COSINE SIM
                </text>
              </g>
            );
          })()}

          {/* ── 8. Decorative cable harness ── */}
          {/* Cable from bench along left edge toward rack */}
          {[0, 4, 8].map((offset, i) => {
            const fromA = iso(-155, -88 + offset, 6, OX, OY + 60);
            const toA   = iso(-130, -88 + offset, 6, OX, OY + 60);
            return (
              <line key={i} x1={fromA[0]} y1={fromA[1]} x2={toA[0]} y2={toA[1]}
                stroke={C.edgeFaint} strokeWidth={0.5} strokeLinecap="round" />
            );
          })}

          {/* ── 9. Status indicator LEDs on bench front ── */}
          {[
            { label: "INDEX",  colour: C.green,    rx: -80 },
            { label: "EMBED",  colour: C.terra,     rx:   0 },
            { label: "QUERY",  colour: C.blue,      rx:  80 },
          ].map(({ label, colour, rx }) => {
            const [lx, ly] = iso(rx, 90, 4, OX, OY + 60);
            return (
              <g key={label}>
                <circle cx={lx} cy={ly} r={3.5}
                  fill={colour} opacity={0.9}
                  style={{ filter: "url(#vgs-glow)" }}
                />
                <circle cx={lx} cy={ly} r={3.5}
                  fill="none" stroke={colour} strokeWidth={0.6} opacity={0.4} />
                <text x={lx} y={ly + 10}
                  fontSize={6} fill={C.textMono} fontFamily="monospace"
                  textAnchor="middle" letterSpacing="0.06em">
                  {label}
                </text>
              </g>
            );
          })}

          {/* ── 10. Title annotation — subtle dimension line ── */}
          {(() => {
            const leftEnd  = iso(-160, -90, 6, OX, OY + 60);
            const rightEnd = iso(160,  -90, 6, OX, OY + 60);
            const midX = (leftEnd[0] + rightEnd[0]) / 2;
            const midY = (leftEnd[1] + rightEnd[1]) / 2 - 10;
            return (
              <g>
                <line x1={leftEnd[0]} y1={leftEnd[1]} x2={rightEnd[0]} y2={rightEnd[1]}
                  stroke={C.edgeFaint} strokeWidth={0.4} strokeDasharray="3 4" />
                <line x1={leftEnd[0]}  y1={leftEnd[1]}  x2={leftEnd[0]}  y2={leftEnd[1] - 5}
                  stroke={C.edgeFaint} strokeWidth={0.5} />
                <line x1={rightEnd[0]} y1={rightEnd[1]} x2={rightEnd[0]} y2={rightEnd[1] - 5}
                  stroke={C.edgeFaint} strokeWidth={0.5} />
                <text x={midX} y={midY} fontSize={6.5} fill={C.textMono} fontFamily="monospace"
                  textAnchor="middle" letterSpacing="0.06em">
                  KNOWLEDGE BASE INGESTION PIPELINE
                </text>
              </g>
            );
          })()}
        </svg>

        {/* Legend below figure */}
        <div style={{
          display: "flex",
          gap: 20,
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px solid ${C.edgeFaint}`,
          flexWrap: "wrap",
        }}>
          {[
            { colour: C.terra,  label: "Active document cassette" },
            { colour: C.green,  label: "Indexed & ready" },
            { colour: C.blue,   label: "Query vector" },
            { colour: C.amber,  label: "Cosine search sweep" },
          ].map(({ colour, label }) => (
            <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <svg width={16} height={10} viewBox="0 0 16 10" aria-hidden="true">
                <path d="M2 5h12" stroke={colour} strokeWidth={1.2} strokeLinecap="round" fill="none" />
              </svg>
              <span style={{ fontSize: 11, color: C.textSecondary, fontFamily: "monospace" }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
