"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

function InterestRoot({ interest, index, progress, reduceMotion }) {
  const start = index * 0.15;
  const grown = useTransform(progress, [start, start + 0.55], [0, 1]);
  const tip = useTransform(grown, (value) => (value > 0.98 ? 1 : 0.15));
  const text = useTransform(grown, [0.6, 1], [0, 1]);

  return (
    <li className="flex flex-col items-center text-center">
      <motion.span aria-hidden="true" className="interest-root" style={{ scaleY: reduceMotion ? 1 : grown }} />
      <motion.span aria-hidden="true" className="interest-tip" style={{ opacity: reduceMotion ? 1 : tip }} />
      <motion.div style={{ opacity: reduceMotion ? 1 : text }} className="mt-5">
        <h3 className="text-xl font-semibold">{interest.title}</h3>
        <p className="mt-2 text-gray-400 leading-relaxed">{interest.description}</p>
        <p className="mt-3 text-[0.6rem] uppercase tracking-[0.3em] text-bloom/70">{interest.from}</p>
      </motion.div>
    </li>
  );
}

// Research interests as root tips: a thin root grows down to each one as you
// scroll, and the interest glows once the root reaches it.
export default function InterestRoots({ interests }) {
  const ref = useRef(null);
  const reduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.95", "start 0.4"] });

  return (
    <ul ref={ref} className="grid gap-12 md:grid-cols-3 md:gap-8">
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
  );
}
