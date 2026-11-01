"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/useMediaQuery";

const INTERACTIVE = "a, button, [role='button'], [data-cursor='interactive']";
const TEXT_INPUT = "input, textarea, select, [contenteditable='true']";
const MAX_PARTICLES = 24;
const PARTICLE_INTERVAL = 45; // ms between pollen particles while moving

// Which "realm" the pointer is over, from data-realm on the page sections:
// space (default), tech (blue pulse) or nature (green glow + pollen).
function readTarget(element) {
  return {
    realm: element?.closest("[data-realm]")?.dataset.realm ?? "space",
    interactive: Boolean(element?.closest(INTERACTIVE)),
    typing: Boolean(element?.closest(TEXT_INPUT)),
  };
}

function sameState(a, b) {
  return (
    a.realm === b.realm &&
    a.interactive === b.interactive &&
    a.typing === b.typing &&
    a.visible === b.visible
  );
}

// A tiny drifting speck of pollen that fades away.
function spawnPollen(layer, x, y) {
  if (layer.childElementCount >= MAX_PARTICLES) return;

  const particle = document.createElement("span");
  particle.className = "cursor-pollen";
  layer.appendChild(particle);

  const angle = Math.random() * Math.PI * 2;
  const distance = 10 + Math.random() * 22;
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance - 12; // pollen drifts gently upwards

  particle.animate(
    [
      { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 0.9 },
      { transform: `translate(${x + dx}px, ${y + dy}px) scale(0.2)`, opacity: 0 },
    ],
    { duration: 900 + Math.random() * 600, easing: "cubic-bezier(0.2, 0.6, 0.3, 1)" }
  ).onfinish = () => particle.remove();
}

function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });
  const pollenRef = useRef(null);
  const [state, setState] = useState({
    realm: "space",
    interactive: false,
    typing: false,
    visible: false,
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");

    let current = { realm: "space", interactive: false, typing: false, visible: false };
    let pointer = null;
    let lastPollen = 0;

    const update = (next) => {
      if (sameState(current, next)) return;
      current = next;
      setState(next);
    };

    const onMove = (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      x.set(pointer.x);
      y.set(pointer.y);
      update({ ...readTarget(event.target), visible: true });

      if (current.realm === "nature" && !current.typing && event.timeStamp - lastPollen > PARTICLE_INTERVAL) {
        lastPollen = event.timeStamp;
        spawnPollen(pollenRef.current, pointer.x, pointer.y);
      }
    };

    // Scrolling moves new content under a still pointer.
    const onScroll = () => {
      if (!pointer) return;
      update({ ...readTarget(document.elementFromPoint(pointer.x, pointer.y)), visible: current.visible });
    };

    const onLeave = () => update({ ...current, visible: false });

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    root.addEventListener("pointerleave", onLeave);

    return () => {
      root.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [x, y]);

  return (
    <div
      aria-hidden="true"
      className="cosmic-cursor pointer-events-none fixed inset-0 z-[100]"
      data-realm={state.realm}
      data-interactive={state.interactive}
      data-visible={state.visible && !state.typing}
    >
      <div ref={pollenRef} className="absolute inset-0" />
      <motion.div className="absolute left-0 top-0" style={{ x: springX, y: springY }}>
        <span className="cursor-aura" />
        <span className="cursor-ring" />
        <span className="cursor-star" />
      </motion.div>
    </div>
  );
}

// A small glowing star that replaces the pointer on mouse/trackpad devices.
// Touch screens and visitors who prefer reduced motion keep the native cursor.
export default function CosmicCursor() {
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduceMotion = usePrefersReducedMotion();

  if (!finePointer || reduceMotion) return null;
  return <Cursor />;
}
