"use client";

import { useEffect, useState } from "react";
import { onWarp } from "@/lib/warpState";

// Light streaks rushing out from the clicked star during a warp.
export default function WarpStreaks() {
  const [warp, setWarp] = useState(null);

  useEffect(
    () =>
      onWarp(({ x, y }) => {
        setWarp({ x, y, key: performance.now() });
      }),
    []
  );

  if (!warp) return null;

  return (
    <div
      key={warp.key}
      aria-hidden="true"
      className="warp-streaks pointer-events-none fixed inset-0 z-[94]"
      style={{ "--warp-x": `${warp.x}px`, "--warp-y": `${warp.y}px` }}
      onAnimationEnd={() => setWarp(null)}
    />
  );
}
