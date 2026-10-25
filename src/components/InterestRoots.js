"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

// A research interest as a root tip in superposition: two faint ghost
// positions flicker until you observe it (hover or focus), when it collapses
// into a single glowing tip — a quiet nod to quantum measurement.
function InterestRoot({ interest, index, progress, reduceMotion }) {
  const [observed, setObserved] = useState(false);
  const start = index * 0.15;
  const grown = useTransform(progress, [start, start + 0.55], [0, 1]);
  const text = useTransform(grown, [0.6, 1], [0, 1]);
  const collapsed = reduceMotion || observed;

  return (
    <li
      tabIndex={0}
      data-cursor="interactive"
      onPointerEnter={() => setObserved(true)}
      onPointerLeave={() => setObserved(false)}
      onFocus={() => setObserved(true)}
      onBlur={() => setObserved(false)}
      className="interest flex flex-col items-center text-center outline-none"
    >
      <motion.span aria-hidden="true" className="interest-root" style={{ scaleY: reduceMotion ? 1 : grown }} />
      <span aria-hidden="true" data-collapsed={collapsed} className="interest-tip">
        <span className="interest-ghost interest-ghost-a" />
        <span className="interest-ghost interest-ghost-b" />
        <span className="interest-core" />
      </span>
      <motion.div style={{ opacity: reduceMotion ? 1 : text }} className="mt-5">
        <h3 className="font-display text-base font-bold uppercase tracking-wide">{interest.title}</h3>
        <p className="mt-2 text-sm text-gray-400 leading-relaxed">{interest.description}</p>
        <p className="mt-3 text-[0.6rem] uppercase tracking-[0.3em] text-bloom/70">{interest.from}</p>
        <p aria-hidden="true" className="interest-state mt-3 text-[0.55rem] uppercase tracking-[0.3em]">
          {collapsed ? "● observed" : "◌ superposition"}
        </p>
      </motion.div>
    </li>
  );
}

// Two pairs of small root tips that pulse in perfect sync, joined by a faint
// dashed arc: entanglement, growing underground between the interests.
function EntangledPairs() {
  return (
    <svg aria-hidden="true" viewBox="0 0 1000 120" className="entangled pointer-events-none mt-14 hidden w-full md:block">
      {[
        [170, 60, 470, 92, "a"],
        [560, 84, 860, 50, "b"],
      ].map(([x1, y1, x2, y2, key]) => (
        <g key={key} className={`entangled-pair entangled-pair-${key}`}>
          <path d={`M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 46} ${x2} ${y2}`} className="entangled-arc" />
          <circle cx={x1} cy={y1} r="3" className="entangled-tip" />
          <circle cx={x2} cy={y2} r="3" className="entangled-tip" />
          <text x={(x1 + x2) / 2} y={Math.min(y1, y2) - 30} textAnchor="middle" className="entangled-label">
            entangled
          </text>
        </g>
      ))}
    </svg>
  );
}

// Research interests as root tips: a thin root grows down to each one as you
// scroll; each tip stays in superposition until observed.
export default function InterestRoots({ interests }) {
  const ref = useRef(null);
  const reduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.95", "start 0.4"] });

  return (
    <div ref={ref}>
      <ul className="grid gap-12 md:grid-cols-3 md:gap-8">
        {interests.map((interest, i) => (
          <InterestRoot
            key={interest.title}
            interest={interest}
            index={i}
            progress={scrollYProgress}
            reduceMotion={reduceMotion}
          />
        ))}
      </ul>
      <EntangledPairs />
    </div>
  );
}
