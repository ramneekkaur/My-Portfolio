"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useIntroStarted } from "@/lib/introState";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

// How long after the dust starts gathering the bars part — just as the seed
// finishes forming (SeedBloom's intro takes 3.2s).
const OPEN_AFTER_MS = 3400;

// Cinema letterbox bars framing the opening shot. They slide away once the
// seed has formed, or as soon as the visitor starts scrolling.
export default function Letterbox() {
  const introStarted = useIntroStarted();
  const reduceMotion = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!introStarted) return;

    const openBars = () => setOpen(true);
    const timer = setTimeout(openBars, OPEN_AFTER_MS);
    window.addEventListener("scroll", openBars, { passive: true, once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", openBars);
    };
  }, [introStarted]);

  if (reduceMotion) return null;

  const transition = { duration: 1.8, ease: [0.65, 0, 0.35, 1] };

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80]">
      <motion.div
        className="letterbox-bar top-0 origin-top"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: open ? 0 : 1 }}
        transition={transition}
      />
      <motion.div
        className="letterbox-bar bottom-0 origin-bottom"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: open ? 0 : 1 }}
        transition={transition}
      />
    </div>
  );
}
