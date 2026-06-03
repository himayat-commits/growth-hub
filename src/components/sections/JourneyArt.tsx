"use client";

// Animated "business journey" hero mark.
// Replaces the static logomark on the right-hand side of the hero: a growth
// curve that draws itself, then a teal progress line travels milestone-to-
// milestone, lighting up each stage of a business's journey.
//
// Ported from the Growth Hub standalone design (components/hero.jsx).

import { useEffect, useRef, useState } from "react";

const JOURNEY_STAGES = [
  { n: 1, t: "Idea" },
  { n: 2, t: "Validate" },
  { n: 3, t: "Launch" },
  { n: 4, t: "Small business" },
  { n: 5, t: "Growth" },
  { n: 6, t: "Established" },
];
const JOURNEY_FRACTIONS = [0.03, 0.21, 0.4, 0.6, 0.8, 0.99];

interface JourneyNode {
  x: number;
  y: number;
  len: number;
}

export default function JourneyArt() {
  const pathRef = useRef<SVGPathElement>(null);
  const [nodes, setNodes] = useState<JourneyNode[]>([]); // [{x,y,len}]
  const [total, setTotal] = useState(0);
  const [drawn, setDrawn] = useState(false);
  const [active, setActive] = useState(0);

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Measure the curve once it's in the DOM and place milestones on it.
  useEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    const len = p.getTotalLength();
    const pts = JOURNEY_FRACTIONS.map((f) => {
      const pt = p.getPointAtLength(len * f);
      return { x: pt.x, y: pt.y, len: len * f };
    });
    setTotal(len);
    setNodes(pts);
  }, []);

  // Once measured (full-length dash committed), flip to drawn so the
  // stroke-dashoffset + opacity transitions run.
  useEffect(() => {
    if (total <= 0) return;
    const id = setTimeout(() => setDrawn(true), 80);
    return () => clearTimeout(id);
  }, [total]);

  // Cycle the active milestone. Skipped under reduced motion.
  useEffect(() => {
    if (reduce || nodes.length === 0) return;
    const id = setInterval(() => setActive((a) => (a + 1) % nodes.length), 2600);
    return () => clearInterval(id);
  }, [nodes.length, reduce]);

  // Under reduced motion, pin to the final stage rather than cycling.
  const activeIdx = reduce ? Math.max(0, nodes.length - 1) : active;
  const activeNode = nodes[activeIdx];
  const progressOffset = activeNode ? total - activeNode.len : total;

  // Exponential growth curve: flat at the idea stage, then a steep climb.
  const D = "M 290 560 C 450 558, 560 550, 640 492 C 730 428, 790 250, 808 66";

  return (
    <svg
      className="journey-art"
      viewBox="0 0 1010 620"
      fill="none"
      aria-hidden="true"
      style={{ width: "100%", height: "auto" }}
    >
      <defs>
        <pattern id="jhatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(13,63,72,0.22)" strokeWidth="2.5" />
        </pattern>
      </defs>

      {/* faint full rail */}
      <path
        ref={pathRef}
        d={D}
        stroke="rgba(13,63,72,0.18)"
        strokeWidth="1.6"
        strokeLinecap="round"
        style={
          total
            ? {
                strokeDasharray: total,
                strokeDashoffset: drawn ? 0 : total,
                transition: "stroke-dashoffset 1.6s cubic-bezier(.5,.1,.2,1)",
              }
            : undefined
        }
      />
      {/* teal progress up to the active node */}
      {total > 0 && (
        <path
          d={D}
          stroke="var(--teal)"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            strokeDasharray: total,
            strokeDashoffset: drawn ? progressOffset : total,
            transition: "stroke-dashoffset .95s cubic-bezier(.5,.1,.2,1)",
          }}
        />
      )}

      {nodes.map((nd, i) => {
        const isActive = i === activeIdx;
        const isPast = i <= activeIdx;
        const below = nd.y > 320;
        const r = isActive ? 21 : 15;
        const fill = isPast ? "var(--teal)" : "rgba(13,63,72,0.12)";
        const numFill = isPast ? "var(--eggshell)" : "rgba(13,63,72,0.55)";
        const lx = below ? nd.x : nd.x + r + 16;
        const ly = below ? nd.y + r + 30 : nd.y + 6;
        return (
          <g key={i} className="journey-node" style={{ animationDelay: `${0.5 + i * 0.16}s` }}>
            {isActive && <circle cx={nd.x} cy={nd.y} r={r + 15} fill="url(#jhatch)" />}
            <circle cx={nd.x} cy={nd.y} r={r} fill={fill} style={{ transition: "r .4s ease, fill .4s ease" }} />
            {isActive && (
              <circle
                cx={nd.x}
                cy={nd.y}
                r={r}
                fill="none"
                stroke="var(--lime)"
                strokeWidth="2.5"
                className="journey-pulse"
              />
            )}
            <text
              x={nd.x}
              y={nd.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={numFill}
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: isActive ? "20px" : "15px",
                transition: "font-size .4s ease, fill .4s ease",
              }}
            >
              {JOURNEY_STAGES[i].n}
            </text>
            <text
              x={lx}
              y={ly}
              textAnchor={below ? "middle" : "start"}
              fill={isActive ? "var(--teal)" : "var(--muted)"}
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: isActive ? "23px" : "19px",
                fontWeight: isActive ? 600 : 400,
                letterSpacing: "-0.01em",
                transition: "fill .4s ease",
              }}
            >
              {JOURNEY_STAGES[i].t}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
