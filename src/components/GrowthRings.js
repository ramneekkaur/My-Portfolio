"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll } from "framer-motion";
import TreeRings from "@/components/TreeRings";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/useMediaQuery";

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
  const year = entry.dates.match(/\d{4}/)?.[0];

  return (
    <li ref={ref} data-index={index} className="relative pl-12">
      {/* Node on the stem: seed (education), leaf (work) or bloom (community) */}
      <span
        aria-hidden="true"
        data-kind={entry.kind}
        data-reached={reached}
        className="growth-node absolute left-4 top-3 -translate-x-1/2 -translate-y-1/2"
      />
      {/* Branch from the stem out to the card */}
      <span aria-hidden="true" data-reached={reached} className="growth-branch absolute left-4 top-3 h-px w-6 origin-left" />

      <p aria-hidden="true" data-reached={reached} className="growth-year-mobile mb-3">
        {year}
      </p>

      <motion.article
        initial={{ opacity: 0, x: 24 }}
        animate={reached ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        data-tone={entry.kind === "work" ? undefined : "nature"}
        data-active={entry.current ? "true" : undefined}
        className="panel p-6 pt-8"
      >
        <p className="panel-title">[ {KIND_LABEL[entry.kind]} ]</p>

        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.65rem] uppercase tracking-[0.25em]">
          <span className="text-gray-400">{entry.dates}</span>
          {entry.current && (
            <span className="text-electric">
              <span aria-hidden="true" className="blink">●</span> Now
            </span>
          )}
        </div>

        <h3 className="font-display text-base font-bold uppercase leading-snug tracking-wide md:text-lg">{entry.title}</h3>
        <p className="mt-1 text-sm text-gray-400">
          {entry.org} · {entry.location}
        </p>

        {entry.points && (
          <ul className="mt-5 space-y-2 text-sm text-gray-400 leading-relaxed">
            {entry.points.map((point) => (
              <li key={point} className="relative pl-5">
                <span aria-hidden="true" className="absolute left-0 text-phosphor-dim">›</span>
                {point}
              </li>
            ))}
          </ul>
        )}

        {entry.tags && (
          <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-wider text-electric/80">
            {entry.tags.map((tag) => (
              <li key={tag}>[{tag}]</li>
            ))}
          </ul>
        )}
      </motion.article>
    </li>
  );
}

// The entry crossing the middle of the screen.
function useActiveEntry(listRef) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    const items = listRef.current?.querySelectorAll(":scope > li[data-index]") ?? [];
    const observer = new IntersectionObserver(
      (records) => {
        records.forEach((record) => {
          if (record.isIntersecting) setActive(Number(record.target.dataset.index));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [listRef]);

  return active;
}

// Experience, education and volunteering: a trunk cross-section whose rings
// grow year by year (pinned beside the timeline on desktop), and a stem with
// one branch for every season of growth — oldest first, ending in a bud.
export default function GrowthRings({ entries }) {
  const ref = useRef(null);
  const listRef = useRef(null);
  const reduceMotion = usePrefersReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const activeIndex = useActiveEntry(listRef);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.75", "end 0.6"] });

  return (
    <div
      ref={ref}
      className="relative mt-20 md:grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:items-start md:gap-14"
    >
      <div className="mb-14 md:sticky md:top-24 md:mb-0">
        <TreeRings
          entries={entries}
          activeIndex={isDesktop ? activeIndex : null}
          followActive={isDesktop}
        />
      </div>

      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 1000"
          preserveAspectRatio="none"
          className="pointer-events-none absolute bottom-0 left-4 top-0 h-full w-6 -translate-x-1/2 overflow-visible"
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
            className="growth-stem"
            style={{ pathLength: reduceMotion ? 1 : scrollYProgress }}
          />
        </svg>

        <ol ref={listRef} className="space-y-14">
          {entries.map((entry, i) => (
            <GrowthEntry key={`${entry.dates}-${entry.title}`} entry={entry} index={i} />
          ))}
        </ol>

        {/* The growing tip: the story continues */}
        <div className="relative mt-16 pl-12">
          <span aria-hidden="true" className="growth-bud absolute left-4 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-phosphor/80">
            &gt; Still growing<span aria-hidden="true" className="cursor-block" />
          </p>
        </div>
      </div>
    </div>
  );
}
