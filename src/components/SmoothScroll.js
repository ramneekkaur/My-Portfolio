"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { MotionConfig } from "framer-motion";
import { scrollState } from "@/lib/scrollState";
import { registerLenis } from "@/lib/smoothScroll";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

export default function SmoothScroll({ children }) {
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    // Reduced motion: keep native scrolling, only track progress.
    if (reduceMotion) {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scrollState.progress = max > 0 ? window.scrollY / max : 0;
        scrollState.velocity = 0;
      };

      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    // Slow, floating scroll — lower lerp = more glide.
    const lenis = new Lenis({ autoRaf: true, lerp: 0.07 });
    registerLenis(lenis);
    scrollState.progress = lenis.progress || 0;

    lenis.on("scroll", ({ progress, velocity }) => {
      scrollState.progress = progress;
      scrollState.velocity = velocity;
    });

    return () => {
      registerLenis(null);
      lenis.destroy();
    };
  }, [reduceMotion]);

  // reducedMotion="user" makes every framer-motion animation respect the OS setting.
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
