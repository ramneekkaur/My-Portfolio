"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mulberry32 } from "@/lib/random";
import { startWarp } from "@/lib/warpState";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

// A small line-drawn preview of the blossoming planet (no WebGL here).
const random = mulberry32(77);
const BRANCHES = Array.from({ length: 6 }, (_, i) => {
  const y = -38 + i * 15 + (random() - 0.5) * 6;
  const bend = (random() - 0.5) * 30;
  return `M-48 ${y.toFixed(1)} Q0 ${(y + bend).toFixed(1)} 48 ${(y - bend * 0.4).toFixed(1)}`;
});
const BLOSSOMS = Array.from({ length: 26 }, () => {
  const angle = random() * Math.PI * 2;
  const r = Math.sqrt(random()) * 44;
  return [Math.cos(angle) * r, Math.sin(angle) * r, 1 + random() * 1.6];
});

function PlanetPreview() {
  return (
    <svg viewBox="-60 -60 120 120" className="h-36 w-36 shrink-0 md:h-44 md:w-44" aria-hidden="true">
      <defs>
        <radialGradient id="portal-planet" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.7" stopColor="#0b1f17" />
          <stop offset="1" stopColor="var(--color-leaf)" />
        </radialGradient>
        <clipPath id="portal-clip">
          <circle r="48" />
        </clipPath>
      </defs>
      <circle r="56" className="portal-atmosphere" />
      <circle r="48" fill="url(#portal-planet)" />
      <g clipPath="url(#portal-clip)">
        <g className="portal-surface">
          {[0, 96].map((shift) => (
            <g key={shift} transform={`translate(${shift} 0)`}>
              {BRANCHES.map((d) => (
                <path key={d} d={d} className="portal-branch" />
              ))}
              {BLOSSOMS.map(([x, y, r], i) => (
                <circle key={i} cx={x} cy={y} r={r} className="portal-blossom" />
              ))}
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

// Invitation from the home page into the Garden World (/garden): a soft pink
// bloom opens from the button, the camera warps through the stars, and the
// new page takes over. A real link, so it also works without JavaScript.
export default function GardenPortal() {
  const router = useRouter();
  const reduceMotion = usePrefersReducedMotion();
  const [bloom, setBloom] = useState(null);

  async function enter(event) {
    if (reduceMotion || event.metaKey || event.ctrlKey || event.shiftKey) return; // normal navigation
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    setBloom({ x, y });
    await startWarp(x, y);
    router.push("/garden");
  }

  return (
    <div data-tone="nature" className="panel mt-14 flex flex-col items-center gap-8 p-8 pt-10 md:flex-row md:p-10 md:pt-12">
      <p className="panel-title">[ Beyond the code · open the garden world ]</p>
      <PlanetPreview />
      <div className="text-center md:text-left">
        <h3 className="font-display text-xl font-bold uppercase tracking-wide md:text-2xl">
          Everything that grows beyond the code
        </h3>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-gray-400">
          Nature, travelling, technology, space, photography and science fiction — each one a blossom on a small
          living planet. Step inside to explore them, and wander through my photography.
        </p>
        <Link href="/garden" onClick={enter} data-cursor="interactive" className="btn-terminal btn-terminal-primary mt-6">
          Enter the garden ❀
        </Link>
      </div>

      {bloom && (
        <span
          aria-hidden="true"
          className="portal-bloom pointer-events-none fixed z-[95]"
          style={{ left: bloom.x, top: bloom.y }}
        />
      )}
    </div>
  );
}
