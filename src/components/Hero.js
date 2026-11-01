"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { scrollState } from "@/lib/scrollState";
import { HERO } from "@/lib/heroTimeline";
import { markIntroStarted, useIntroStarted } from "@/lib/introState";
import { profile } from "@/data/profile";

// If the 3D scene never starts (e.g. no WebGL), show the text anyway.
const INTRO_FALLBACK_MS = 6000;

// The hero is a tall scroll area with a pinned stage. The glowing seed itself
// lives in the 3D scene (scene/SeedBloom.js) and follows this scroll progress.
export default function Hero() {
  const ref = useRef(null);
  const introStarted = useIntroStarted();

  useEffect(() => {
    const timer = setTimeout(markIntroStarted, INTRO_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    scrollState.hero = value;
  });

  const titleOpacity = useTransform(scrollYProgress, [0, HERO.titleOut], [1, 0]);
  const titleY = useTransform(scrollYProgress, [0, HERO.titleOut], [0, -40]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.03], [1, 0]);
  const taglineOpacity = useTransform(
    scrollYProgress,
    [HERO.flowerEnd - 0.06, HERO.flowerEnd, HERO.exitStart, HERO.exitStart + 0.12],
    [0, 1, 1, 0]
  );

  return (
    <section ref={ref} id="seed" className="relative h-[300vh]">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-6">
        {/* Opening: title fades in as the seed finishes gathering */}
        <motion.div
          style={{ opacity: titleOpacity, y: titleY }}
          className="mt-[24vh] flex flex-col items-center"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={introStarted ? { opacity: 1 } : undefined}
            transition={{ duration: 2, delay: 1.8 }}
            className="mb-6 font-display text-lg font-bold uppercase tracking-[0.35em] text-phosphor glow-text md:text-2xl"
          >
            <span aria-hidden="true" className="opacity-60">&gt; </span>
            {profile.name}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={introStarted ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 2.2, delay: 2.2 }}
            className="font-display text-3xl font-bold uppercase leading-tight tracking-wide md:text-5xl glow-text max-w-5xl"
          >
            Cultivating Intelligence Across the Cosmos
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={introStarted ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 2, delay: 2.9 }}
            className="text-sm md:text-base text-gray-400 max-w-xl mt-6"
          >
            {profile.role} · {profile.studies}
          </motion.p>
        </motion.div>

        {/* Bloom: appears once the flower has formed */}
        <motion.p
          style={{ opacity: taglineOpacity }}
          className="absolute bottom-[12vh] inset-x-6 font-display text-xl uppercase tracking-[0.2em] md:text-3xl glow-text"
        >
          <span aria-hidden="true" className="text-phosphor-dim">&gt; </span>
          Where Intelligence Blooms
          <span aria-hidden="true" className="cursor-block" />
        </motion.p>

        {/* Scroll hint */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="absolute bottom-8 flex flex-col items-center gap-3"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={introStarted ? { opacity: 1 } : undefined}
            transition={{ duration: 1.5, delay: 4 }}
            className="text-[0.65rem] uppercase tracking-[0.35em] text-phosphor/80"
          >
            [ Scroll to grow ]<span aria-hidden="true" className="cursor-block" />
          </motion.span>
          <span className="scroll-hint-line block h-10 w-px bg-gradient-to-b from-phosphor/70 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
