"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { mulberry32 } from "@/lib/random";
import { smoothPath } from "@/lib/paths";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

// Botanical "specimen plates" for the skill species, drawn like a plotter on
// an old scientific plate. Each species is generated procedurally and
// deterministically (same drawing on every visit), in a 200 × 120 viewBox.
//   base   — drawn when the section comes into view
//   growth — an extra generation that grows in while the card is hovered
//   nodes  — small dots at tips and junctions

const f = (n) => n.toFixed(1);

// Machine Learning — a branching tree: every layer learns finer detail.
function arbor(random) {
  const base = [];
  const growth = [];
  const nodes = [];

  function branch(x, y, angle, length, depth) {
    const x2 = x + Math.cos(angle) * length;
    const y2 = y + Math.sin(angle) * length;
    const bend = (random() - 0.5) * length * 0.3;
    const cx = (x + x2) / 2 - Math.sin(angle) * bend;
    const cy = (y + y2) / 2 + Math.cos(angle) * bend;
    (depth <= 4 ? base : growth).push(`M${f(x)} ${f(y)} Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}`);
    if (depth === 4) nodes.push([x2, y2]);
    if (depth < 5) {
      const spread = 0.38 + random() * 0.18;
      branch(x2, y2, angle - spread, length * 0.74, depth + 1);
      branch(x2, y2, angle + spread, length * 0.74, depth + 1);
    }
  }

  branch(100, 116, -Math.PI / 2, 29, 0);
  return { base, growth, nodes };
}

// LLM & RAG — a fern unrolling from a fiddlehead: language unfolding.
function filix(random) {
  const base = [];
  const growth = [];
  const centre = [126, 44];
  const startRadius = 22;

  // The stalk rises from the ground into the outer edge of the spiral
  const top = [centre[0] - startRadius, centre[1]];
  const stalk = (t) => {
    const a = [94, 116];
    const c = [86, 78];
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * top[0], u * u * a[1] + 2 * u * t * c[1] + t * t * top[1]];
  };
  const stalkPoints = Array.from({ length: 11 }, (_, i) => stalk(i / 10));

  // The fiddlehead: a logarithmic spiral curling inwards
  const spiral = [];
  for (let theta = 0; theta <= Math.PI * 4.2; theta += 0.2) {
    const r = startRadius * Math.exp(-0.2 * theta);
    spiral.push([centre[0] + Math.cos(Math.PI + theta) * r, centre[1] - Math.sin(Math.PI + theta) * r]);
  }
  base.push(smoothPath([...stalkPoints, ...spiral.slice(1)]));

  // Leaflets in alternating pairs along the stalk, smaller towards the top
  for (let t = 0.12, side = 1; t <= 0.92; t += 0.1, side *= -1) {
    const [x, y] = stalk(t);
    const [nx, ny] = stalk(t + 0.01);
    const angle = Math.atan2(ny - y, nx - x) + side * (Math.PI / 2 - 0.45);
    const length = 11 * (1 - t * 0.5) + random() * 2;
    const tip = [x + Math.cos(angle) * length, y + Math.sin(angle) * length];
    const mid = [x + Math.cos(angle - side * 0.35) * length * 0.55, y + Math.sin(angle - side * 0.35) * length * 0.55];
    (t <= 0.6 ? base : growth).push(smoothPath([[x, y], mid, tip]));
  }

  return { base, growth, nodes: [centre] };
}

// Data Engineering — a root system drawing nutrients from below.
function radix(random) {
  const base = ["M22 14 H178"];
  const growth = [];
  const nodes = [];

  function grow(x, y, angle, steps, depth) {
    const points = [[x, y]];
    for (let s = 0; s < steps; s++) {
      angle += (random() - 0.5) * 0.5;
      angle += (Math.PI / 2 - angle) * 0.15;
      x += Math.cos(angle) * 7;
      y += Math.sin(angle) * 7;
      points.push([x, y]);
      if (depth < 2 && s > 1 && random() < 0.3) {
        grow(x, y, angle + (random() < 0.5 ? -1 : 1) * (0.7 + random() * 0.4), Math.max(3, steps - s - 2), depth + 1);
      }
    }
    (depth <= 1 ? base : growth).push(smoothPath(points));
    if (depth === 1) nodes.push([x, y]);
  }

  [-22, 0, 20].forEach((dx, i) => grow(100 + dx, 14, Math.PI / 2 + (i - 1) * 0.5, 14, 0));
  return { base, growth, nodes };
}

// Software Engineering — a crystal lattice growing cell by cell from a seed.
function crystallus(random) {
  const base = [];
  const growth = [];
  const nodes = [];
  const size = 10;
  const centre = [100, 62];

  const hexPath = (q, r) => {
    const cx = centre[0] + size * Math.sqrt(3) * (q + r / 2);
    const cy = centre[1] + size * 1.5 * r;
    const corners = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${f(cx + Math.cos(a) * size)} ${f(cy + Math.sin(a) * size)}`;
    });
    return { d: `M${corners.join(" L")} Z`, cx, cy };
  };

  const ring = (k) => {
    if (k === 0) return [[0, 0]];
    const cells = [];
    const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    let [q, r] = [-k, k];
    for (const [dq, dr] of dirs) {
      for (let s = 0; s < k; s++) {
        cells.push([q, r]);
        q += dq;
        r += dr;
      }
    }
    return cells;
  };

  for (const [q, r] of [...ring(0), ...ring(1)]) {
    const cell = hexPath(q, r);
    base.push(cell.d);
    nodes.push([cell.cx, cell.cy]);
  }
  for (const [q, r] of ring(2)) {
    if (random() < 0.7) growth.push(hexPath(q, r).d);
  }

  return { base, growth, nodes: nodes.slice(0, 1) };
}

const SPECIMENS = {
  arbor: { name: "Arbor discens", draw: arbor, seed: 11 },
  filix: { name: "Filix linguae", draw: filix, seed: 23 },
  radix: { name: "Radix datorum", draw: radix, seed: 37 },
  crystallus: { name: "Crystallus codicis", draw: crystallus, seed: 41 },
};

const PLATES = Object.fromEntries(
  Object.entries(SPECIMENS).map(([key, specimen]) => [key, specimen.draw(mulberry32(specimen.seed))])
);

// Registration marks in the plate's corners, as on a printed scientific plate
const CORNERS = ["M4 12 V4 H12", "M188 4 H196 V12", "M196 108 V116 H188", "M12 116 H4 V108"];

export default function SkillSpecimen({ kind, index, active }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduceMotion = usePrefersReducedMotion();
  const plate = PLATES[kind];
  const drawn = reduceMotion || inView;

  if (!plate) return null;

  return (
    <figure ref={ref} className="mb-5">
      <svg viewBox="0 0 200 120" className="h-28 w-full" aria-hidden="true">
        {CORNERS.map((d) => (
          <path key={d} d={d} className="specimen-corner" />
        ))}

        {plate.base.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            className="specimen-line"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={drawn ? { pathLength: 1 } : undefined}
            transition={{ duration: 1.1, delay: reduceMotion ? 0 : 0.3 + i * 0.035, ease: "easeInOut" }}
          />
        ))}

        {plate.growth.map((d) => (
          <motion.path
            key={d}
            d={d}
            className="specimen-growth"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: active ? 1 : 0, opacity: active ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.9, ease: "easeOut" }}
          />
        ))}

        {plate.nodes.map(([x, y]) => (
          <motion.circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={1.4}
            className="specimen-node"
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={drawn ? { opacity: 1 } : undefined}
            transition={{ duration: 0.6, delay: reduceMotion ? 0 : 1.6 }}
          />
        ))}
      </svg>
      <figcaption className="mt-2 flex justify-between text-[0.58rem] uppercase tracking-[0.25em] text-gray-500">
        <span>Specimen {String(index + 1).padStart(2, "0")}</span>
        <span className="normal-case italic tracking-wider">{SPECIMENS[kind].name}</span>
      </figcaption>
    </figure>
  );
}
