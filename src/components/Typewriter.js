"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

const CHARACTER_MS = 35;

// Types its text out once it scrolls into view, like a terminal printing a
// line, ending in a blinking block cursor. An invisible copy of the full text
// holds the space (no layout jump); screen readers get the full text at once.
export default function Typewriter({ text, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = usePrefersReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const timer = setInterval(() => {
      setCount((current) => {
        if (current >= text.length) {
          clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, CHARACTER_MS);
    return () => clearInterval(timer);
  }, [inView, reduceMotion, text]);

  const shown = reduceMotion ? text : text.slice(0, count);

  return (
    <span ref={ref} className={`relative inline-block ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="invisible">
        {text}
        <span className="cursor-block" />
      </span>
      <span aria-hidden="true" className="absolute inset-0">
        {shown}
        <span className="cursor-block" />
      </span>
    </span>
  );
}
