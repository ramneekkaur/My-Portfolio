"use client";

import { useRef } from "react";
import { motion, useInView, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

const KIND_LABEL = {
  education: "Education",
  work: "Experience",
  community: "Community",
};

// A gently wandering stem, stretched to the timeline's full height.
const STEM_PATH = "M12 0 C18 125 6 250 12 375 S18 625 12 750 S6 875 12 1000";

function GrowthEntry({ entry, index }) {
  const ref = useRef(null);
  // The node lights up and the card unfolds once the stem has grown past it.
  const reached = useInView(ref, { once: true, margin: "0px 0px -35% 0px" });
  const onLeft = index % 2 === 0;
  const year = entry.dates.match(/\d{4}/)?.[0];

  return (
    <li ref={ref} className="relative pl-12 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
      {/* Node on the stem: seed (education), leaf (work) or bloom (community) */}
      <span
        aria-hidden="true"
        data-kind={entry.kind}
        data-reached={reached}
        className="growth-node absolute left-4 top-3 -translate-x-1/2 -translate-y-1/2 md:left-1/2 md:top-8"
      />
      {/* Branch from the stem out to the card */}
      <span
        aria-hidden="true"
        data-reached={reached}
        className={`growth-branch absolute left-4 top-3 h-px w-6 origin-left md:top-8 md:w-8 ${
          onLeft ? "md:left-auto md:right-1/2 md:origin-right" : "md:left-1/2"
        }`}
      />

      {/* The year this ring began: across the stem on desktop, above the card on phones */}
      <span
        aria-hidden="true"
        data-reached={reached}
        className={`growth-year absolute top-8 hidden -translate-y-1/2 md:block ${
          onLeft ? "left-1/2 ml-10" : "right-1/2 mr-10"
        }`}
      >
        {year}
      </span>
      <p aria-hidden="true" data-reached={reached} className="growth-year-mobile mb-3 md:hidden">
        {year}
      </p>

      <motion.article
        initial={{ opacity: 0, x: onLeft ? -30 : 30 }}
        animate={reached ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className={`rounded-2xl border p-6 backdrop-blur-sm ${
          entry.current ? "border-electric/30 bg-electric/[0.05]" : "border-white/10 bg-white/[0.03]"
        } ${onLeft ? "" : "md:col-start-2"}`}
      >
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.65rem] uppercase tracking-[0.3em]">
          <span className="text-gray-400">{entry.dates}</span>
          <span className={entry.kind === "work" ? "text-electric/80" : "text-bloom/80"}>
            {KIND_LABEL[entry.kind]}
          </span>
          {entry.current && (
            <span className="rounded-full border border-electric/40 px-2 py-0.5 text-electric">Now</span>
          )}
        </div>

        <h3 className="text-xl font-semibold leading-snug">{entry.title}</h3>
        <p className="mt-1 text-sm text-gray-400">
          {entry.org} · {entry.location}
        </p>

        {entry.points && (
          <ul className="mt-5 space-y-2 text-gray-400 leading-relaxed">
            {entry.points.map((point) => (
              <li key={point} className="relative pl-4">
                <span aria-hidden="true" className="absolute left-0 top-[0.7em] h-1 w-1 rounded-full bg-white/30" />
                {point}
              </li>
            ))}
          </ul>
        )}

        {entry.tags && (
          <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-electric/70">
            {entry.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
      </motion.article>
    </li>
  );
}

// Experience, education and volunteering as a stem that grows as you scroll,
// with one branch for every season of growth — oldest first, ending in a bud.
export default function GrowthRings({ entries }) {
  const ref = useRef(null);
  const reduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.75", "end 0.6"] });

  return (
    <div ref={ref} className="relative mt-20">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 1000"
        preserveAspectRatio="none"
        className="pointer-events-none absolute bottom-0 left-4 top-0 h-full w-6 -translate-x-1/2 overflow-visible md:left-1/2"
      >
        <defs>
          <linearGradient id="growth-stem" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-moss)" />
            <stop offset="0.5" stopColor="var(--color-bloom)" />
            <stop offset="1" stopColor="var(--color-electric)" />
          </linearGradient>
        </defs>
        {/* Faint guide of where the stem will grow */}
        <path d={STEM_PATH} fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
        <motion.path
          d={STEM_PATH}
          fill="none"
          stroke="url(#growth-stem)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ pathLength: reduceMotion ? 1 : scrollYProgress }}
        />
      </svg>

      <ol className="space-y-14">
        {entries.map((entry, i) => (
          <GrowthEntry key={`${entry.dates}-${entry.title}`} entry={entry} index={i} />
        ))}
      </ol>

      {/* The growing tip: the story continues */}
      <div className="relative mt-16 pl-12 md:pl-0 md:pt-8 md:text-center">
        <span
          aria-hidden="true"
          className="growth-bud absolute left-4 top-1/2 -translate-x-1/2 -translate-y-1/2 md:left-1/2 md:top-0"
        />
        <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gray-400">Still growing</p>
      </div>
    </div>
  );
}
