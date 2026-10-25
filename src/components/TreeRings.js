"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { mulberry32 } from "@/lib/random";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

const SIZE = 400;
const PITH = 16; // radius of the innermost ring
const BARK = 168; // radius of the outermost ring
const CORE_SAMPLE_ANGLE = 0; // the radial line the years are read along

// [startYear, endYear] of an entry; "Present" runs to the newest year.
function entrySpan(entry, newestYear) {
  const years = (entry.dates.match(/\d{4}/g) || []).map(Number);
  return [years[0], years[1] ?? newestYear];
}

// Ring radius along a given angle — slightly irregular and off-centre, the
// way real growth rings are.
function ringRadius(k, count, angle, wobble) {
  const r = PITH + ((k + 1) / count) * (BARK - PITH);
  return r * (1 + 0.022 * Math.sin(3 * angle + wobble[0]) + 0.014 * Math.sin(5 * angle + wobble[1]));
}

function ringCentre(k) {
  return [SIZE / 2 + k * 1.1, SIZE / 2 - k * 0.5];
}

function createRings(count) {
  const random = mulberry32(2017);
  return Array.from({ length: count }, (_, k) => {
    const wobble = [random() * Math.PI * 2, random() * Math.PI * 2];
    const [cx, cy] = ringCentre(k);
    const points = Array.from({ length: 120 }, (_, i) => {
      const angle = (i / 120) * Math.PI * 2;
      const r = ringRadius(k, count, angle, wobble);
      return `${(cx + Math.cos(angle) * r).toFixed(1)} ${(cy + Math.sin(angle) * r).toFixed(1)}`;
    });
    const r = ringRadius(k, count, CORE_SAMPLE_ANGLE, wobble);
    return { d: `M${points.join(" L")} Z`, tick: [cx + Math.cos(CORE_SAMPLE_ANGLE) * r, cy] };
  });
}

function Ring({ ring, index, count, year, growth, tone }) {
  const length = useTransform(growth, [index / count, (index + 1) / count], [0, 1]);
  const labelOpacity = useTransform(length, [0.9, 1], [0, 1]);
  const [x, y] = ring.tick;
  const above = index % 2 === 0;

  return (
    <g data-tone={tone} className="tree-ring">
      <motion.path d={ring.d} className="tree-ring-line" style={{ pathLength: length }} />
      <motion.g style={{ opacity: labelOpacity }}>
        <line x1={x} y1={y - 4} x2={x} y2={y + 4} className="tree-ring-tick" />
        <text x={x} y={above ? y - 9 : y + 16} textAnchor="middle" className="tree-ring-year">
          {String(year).slice(2)}
        </text>
      </motion.g>
    </g>
  );
}

// A trunk cross-section for Experience & Education: one ring per year from
// the pith (the first year) out to the bark (now). With `followActive`
// (desktop) the trunk grows out to the entry being read and its rings glow;
// otherwise (phones) all rings simply grow in once in view.
export default function TreeRings({ entries, activeIndex = null, followActive = false }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduceMotion = usePrefersReducedMotion();
  const growth = useMotionValue(reduceMotion ? 1 : 0);

  const allYears = entries.flatMap((entry) => (entry.dates.match(/\d{4}/g) || []).map(Number));
  const firstYear = Math.min(...allYears);
  const newestYear = Math.max(...allYears);
  const count = newestYear - firstYear + 1;
  const rings = createRings(count);

  const active = activeIndex === null ? null : entries[activeIndex];
  const [activeStart, activeEnd] = active ? entrySpan(active, newestYear) : [null, null];

  // How much of the trunk has grown: out to the entry being read, or all of it
  const target = !followActive ? 1 : active ? (activeEnd - firstYear + 1) / count : 1 / count;

  useEffect(() => {
    if (reduceMotion) growth.set(1);
    else if (inView) animate(growth, target, { duration: 1.4, ease: "easeInOut" });
  }, [target, inView, reduceMotion, growth]);
  const activeTone = active?.kind === "work" ? "work" : "nature";

  return (
    <figure ref={ref} className="panel p-5 pt-9">
      <p className="panel-title">[ Core sample ]</p>

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-sm" aria-hidden="true">
        {/* The core-sample line the years are read along */}
        <line
          x1={SIZE / 2}
          y1={SIZE / 2}
          x2={SIZE / 2 + BARK + 18}
          y2={SIZE / 2}
          className="tree-ring-core"
        />
        {rings.map((ring, k) => {
          const year = firstYear + k;
          const lit = active && year >= activeStart && year <= activeEnd;
          return (
            <Ring
              key={year}
              ring={ring}
              index={k}
              count={count}
              year={year}
              growth={growth}
              tone={lit ? activeTone : undefined}
            />
          );
        })}
        <circle cx={SIZE / 2} cy={SIZE / 2} r={3} className="tree-ring-pith" />
      </svg>

      <figcaption className="mt-4 min-h-[2.5rem] text-xs uppercase tracking-[0.2em] text-gray-400">
        {active ? (
          <>
            <span className={activeTone === "work" ? "text-electric" : "text-bloom"}>
              &gt; {activeStart === activeEnd && !active.current ? activeStart : `${activeStart}–${active.current ? "now" : activeEnd}`}
            </span>{" "}
            · {active.title}
          </>
        ) : (
          <>
            &gt; {count} rings · {firstYear}–{newestYear}
          </>
        )}
      </figcaption>
    </figure>
  );
}
