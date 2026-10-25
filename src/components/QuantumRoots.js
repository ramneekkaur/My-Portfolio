"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { mapRange } from "@/lib/math";
import { mulberry32 } from "@/lib/random";
import { smoothPath } from "@/lib/paths";
import { palette } from "@/lib/palette";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

const VIEW_WIDTH = 1200;
const VIEW_HEIGHT = 1000;
const SEGMENT = 34; // length of each growth step
const MAIN_ROOTS = 5;

// Scroll range (section progress) over which the roots grow.
const GROW_FROM = 0.15;
const GROW_TO = 0.95;

// Grows a root system: wandering main roots that bend back downwards
// (like real roots following gravity) and occasionally branch.
// Each root knows when, in the overall growth (0–1), it starts and finishes.
function growRoots() {
  const random = mulberry32(4711);
  const roots = [];

  function grow(x, y, angle, length, width, start, duration, depth) {
    const points = [[x, y]];
    const steps = Math.round(length / SEGMENT);

    for (let s = 1; s <= steps; s++) {
      angle += (random() - 0.5) * 0.5;
      angle += (Math.PI / 2 - angle) * 0.08;
      x += Math.cos(angle) * SEGMENT;
      y += Math.sin(angle) * SEGMENT;
      points.push([x, y]);

      if (depth < 2 && s > 2 && s < steps - 2 && random() < 0.1) {
        const side = random() < 0.5 ? -1 : 1;
        grow(
          x,
          y,
          angle + side * (0.5 + random() * 0.5),
          length * (0.3 + random() * 0.25),
          width * 0.6,
          start + duration * (s / steps),
          duration * 0.45,
          depth + 1
        );
      }
    }

    roots.push({
      d: smoothPath(points),
      width,
      start,
      end: Math.min(start + duration, 1),
      hasTip: depth === 0,
    });
  }

  for (let i = 0; i < MAIN_ROOTS; i++) {
    const spread = i / (MAIN_ROOTS - 1) - 0.5; // -0.5 … 0.5
    grow(
      VIEW_WIDTH / 2 + spread * 160,
      0,
      Math.PI / 2 + spread * 2.2 + (random() - 0.5) * 0.2,
      700 + random() * 350,
      1.6,
      random() * 0.1,
      0.75 + random() * 0.1,
      0
    );
  }

  return roots;
}

const ROOTS = growRoots();

function RootPath({ root, growth }) {
  const pathRef = useRef(null);
  const tipRef = useRef(null);
  const totalLength = useRef(0);

  const drawn = useTransform(growth, [root.start, root.end], [0, 1]);
  const opacity = useTransform(drawn, (value) => (value > 0.001 ? 1 : 0));

  // A glowing tip travels with the growing end of each main root.
  useMotionValueEvent(drawn, "change", (value) => {
    if (!root.hasTip || !pathRef.current || !tipRef.current) return;
    if (!totalLength.current) totalLength.current = pathRef.current.getTotalLength();

    const point = pathRef.current.getPointAtLength(value * totalLength.current);
    tipRef.current.setAttribute("transform", `translate(${point.x} ${point.y})`);
    tipRef.current.style.opacity = value > 0.001 && value < 0.999 ? "1" : "0";
  });

  return (
    <g>
      {/* Soft glow */}
      <motion.path
        d={root.d}
        fill="none"
        stroke="url(#root-gradient)"
        strokeWidth={root.width * 5}
        strokeLinecap="round"
        style={{ pathLength: drawn, opacity }}
        strokeOpacity={0.07}
      />
      {/* Core line */}
      <motion.path
        ref={pathRef}
        d={root.d}
        fill="none"
        stroke="url(#root-gradient)"
        strokeWidth={root.width}
        strokeLinecap="round"
        style={{ pathLength: drawn, opacity }}
        strokeOpacity={0.4}
      />
      {root.hasTip && (
        <g ref={tipRef} style={{ opacity: 0 }}>
          <circle r={10} fill={palette.bloom} opacity={0.15} />
          <circle r={2.5} fill="#d1fae5" />
        </g>
      )}
    </g>
  );
}

// Thin glowing roots growing down from the surface through the underground
// zone as you scroll: "The most powerful systems grow where we cannot see."
export default function QuantumRoots() {
  const ref = useRef(null);
  const reduceMotion = usePrefersReducedMotion();
  const growth = useMotionValue(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.7"],
  });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    growth.set(reduceMotion ? 1 : mapRange(value, GROW_FROM, GROW_TO));
  });

  useEffect(() => {
    growth.set(reduceMotion ? 1 : mapRange(scrollYProgress.get(), GROW_FROM, GROW_TO));
  }, [growth, reduceMotion, scrollYProgress]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="xMidYMin slice"
        className="quantum-roots h-full w-full"
      >
        <defs>
          <linearGradient
            id="root-gradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="0"
            y2={VIEW_HEIGHT}
          >
            <stop offset="0" stopColor={palette.bloom} />
            <stop offset="0.55" stopColor={palette.electric} />
            <stop offset="1" stopColor={palette.nebula} />
          </linearGradient>
        </defs>

        {ROOTS.map((root, i) => (
          <RootPath key={i} root={root} growth={growth} />
        ))}
      </svg>
    </div>
  );
}
