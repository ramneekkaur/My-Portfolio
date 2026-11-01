"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Reveal from "@/components/Reveal";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/useMediaQuery";

// The system lives in a 100 × 70 box (the SVG's viewBox); orbits are tilted
// ellipses around the core. Inner orbits turn faster, like real planets.
const VIEW_W = 100;
const VIEW_H = 70;
const CENTRE = { x: 50, y: 35 };
const TILT = 0.6; // ellipse height as a share of its width

const KINDS = [
  { type: "course", label: "Courses", tag: "Course", hue: "electric" },
  { type: "seminar", label: "Seminars", tag: "Seminar", hue: "nebula" },
  { type: "project", label: "Projects", tag: "Project group", hue: "bloom" },
];
const kindOf = (type) => KINDS.find((kind) => kind.type === type);

// A planet's colour shows its status (its orbit shows its kind):
// amber while studying it, ice blue once completed
const statusHue = (module) => (module.status === "current" ? "ember" : "electric");

// Orbits from the outside in: the kind with the most planets gets the widest
// ring, so its names have room
const ORBITS = [
  { radius: 46, period: 140 },
  { radius: 31, period: 100 },
  { radius: 16, period: 70 },
];

// Where a planet is at time t: its spot on the ellipse, plus depth (0 behind
// the core → 1 in front)
function place(planet, t) {
  const angle = planet.start + (t / planet.period) * Math.PI * 2;
  const depth = (Math.sin(angle) + 1) / 2;
  return {
    x: CENTRE.x + Math.cos(angle) * planet.radius,
    y: CENTRE.y + Math.sin(angle) * planet.radius * TILT,
    depth,
  };
}

function StatusLight({ current }) {
  return <span aria-hidden="true" className={current ? "study-status-now" : "study-status-steady"} />;
}

function StudyPanel({ module, position, total, onStep }) {
  const kind = kindOf(module.type);
  const current = module.status === "current";
  return (
    <div data-tone="tech" className="panel study-panel relative p-6 pt-9 md:p-8 md:pt-10">
      <p className="panel-title">[ Module {String(position + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} ]</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={module.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="flex flex-wrap items-center gap-3 text-[0.6rem] uppercase tracking-[0.3em]">
            <span data-hue={kind.hue} className="study-tag">[ {kind.tag} ]</span>
            <span className={current ? "text-ember" : "text-gray-400"}>
              <StatusLight current={current} /> {current ? "Now studying" : "Completed"}
            </span>
          </p>
          <h3 className="mt-4 font-display text-xl font-bold uppercase tracking-wide md:text-2xl">{module.title}</h3>
          {module.subtitle && <p className="mt-2 text-xs leading-relaxed text-gray-500">{module.subtitle}</p>}
          <p className="mt-4 text-sm leading-relaxed text-gray-300">{module.writeup}</p>

          {module.phases?.length > 0 && (
            <ol className="mt-5 space-y-4 border-l border-white/10 pl-4">
              {module.phases.map((phase) => (
                <li key={phase.title}>
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gray-200">
                    <StatusLight current={phase.status === "current"} /> {phase.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-400">{phase.text}</p>
                </li>
              ))}
            </ol>
          )}

          {module.progress && (
            <div className="mt-5">
              <div className="study-progress" aria-hidden="true">
                <span className="study-progress-fill" style={{ width: `${(module.progress.done / module.progress.total) * 100}%` }} />
              </div>
              <p className="mt-2 text-[0.6rem] uppercase tracking-[0.25em] text-gray-500">
                {module.progress.done} of {module.progress.total} {module.progress.unit}
              </p>
            </div>
          )}

          {module.stats?.length > 0 && (
            <dl className="mt-5 grid grid-cols-3 gap-2">
              {module.stats.map((stat) => (
                <div key={stat.label} className="study-stat">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="font-display text-base font-bold text-gray-100 md:text-lg">{stat.value}</dd>
                  <dd className="mt-1 text-[0.55rem] uppercase leading-snug tracking-[0.15em] text-gray-500">{stat.label}</dd>
                </div>
              ))}
            </dl>
          )}
          {module.topics?.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {module.topics.map((topic) => (
                <li key={topic} className="rounded-[2px] border border-white/10 px-2.5 py-1 text-[0.65rem] tracking-wider text-gray-300">
                  {topic}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </AnimatePresence>

      {total > 1 && (
        <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4 text-[0.6rem] uppercase tracking-[0.25em] text-gray-500">
          <button type="button" onClick={() => onStep(-1)} className="transition-colors hover:text-white">
            ← Prev
          </button>
          <button type="button" onClick={() => onStep(1)} className="transition-colors hover:text-white">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// Studies as a small solar system: courses, seminars and projects each circle
// the university on their own orbit; current modules glow with a halo.
// Select a planet (or step through) to read what was worked on and learned.
export default function LearningOrbit({ modules }) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const reduceMotion = usePrefersReducedMotion();
  const systemRef = useRef(null);
  const planetRefs = useRef([]);
  const paused = useRef(false);

  // Current modules first, then completed, each in the order written
  const ordered = [...modules.filter((m) => m.status === "current"), ...modules.filter((m) => m.status !== "current")];
  const countOf = (kind) => modules.filter((m) => m.type === kind.type).length;
  const kinds = KINDS.filter((kind) => countOf(kind) > 0)
    .sort((a, b) => countOf(b) - countOf(a))
    // A middle ring has rings on both sides; its names face the inner one,
    // which is emptier than the outer
    .map((kind, i, all) => ({ ...kind, ...ORBITS[i], inward: i > 0 && i < all.length - 1 }));

  // Planets spaced evenly on their orbit, each orbit starting at its own angle
  const planets = ordered.map((module) => {
    const kind = kinds.find((k) => k.type === module.type);
    const siblings = ordered.filter((m) => m.type === module.type);
    const slot = siblings.indexOf(module);
    return {
      module,
      radius: kind.radius,
      inward: kind.inward,
      period: kind.period,
      hue: statusHue(module),
      start: (slot / siblings.length) * Math.PI * 2 + kinds.indexOf(kind) * 1.3 + 0.6,
    };
  });

  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(ordered[0]?.title ?? null);
  const [hovered, setHovered] = useState(null);
  const list = filter === "all" ? ordered : ordered.filter((m) => m.type === filter);
  const active = list.find((m) => m.title === selected) ?? list[0];

  const step = (direction) => {
    const index = list.indexOf(active);
    setSelected(list[(index + direction + list.length) % list.length].title);
  };
  const choose = (type) => {
    setFilter(type);
    const next = type === "all" ? ordered : ordered.filter((m) => m.type === type);
    if (!next.some((m) => m.title === selected)) setSelected(next[0]?.title ?? null);
  };

  // Move the planets (through refs, so React doesn't re-render every frame),
  // only while the system is on screen, and not while it's hovered
  useEffect(() => {
    const system = systemRef.current;
    let frame = 0;
    let visible = false;
    let last = null;
    let t = 0;

    const position = () => {
      planets.forEach((planet, i) => {
        const el = planetRefs.current[i];
        if (!el) return;
        const { x, y, depth } = place(planet, t);
        el.style.left = `${(x / VIEW_W) * 100}%`;
        el.style.top = `${(y / VIEW_H) * 100}%`;
        el.style.setProperty("--depth", depth.toFixed(3));
        el.style.zIndex = depth > 0.5 ? "30" : "10"; // in front of or behind the core
        // Near the sides, the name hangs inwards so it stays on screen
        el.dataset.edge = x < VIEW_W * 0.25 ? "left" : x > VIEW_W * 0.75 ? "right" : "";
        // …and on the outer side of the orbit (above at the back, below in
        // front), or the inner side for a middle ring
        el.dataset.side = depth > 0.5 !== planet.inward ? "below" : "above";
      });
    };

    const loop = (now) => {
      frame = 0;
      if (!visible) return;
      if (last !== null && !paused.current) t += Math.min((now - last) / 1000, 0.1);
      last = now;
      position();
      frame = requestAnimationFrame(loop);
    };

    position();
    if (reduceMotion) return undefined;
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      last = null;
      if (visible && !frame) frame = requestAnimationFrame(loop);
    });
    watcher.observe(system);
    return () => {
      cancelAnimationFrame(frame);
      watcher.disconnect();
    };
  }, [planets.length, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null;

  return (
    <div
      className="mt-16"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") step(1);
        if (event.key === "ArrowLeft") step(-1);
      }}
    >
      {/* Filters */}
      {kinds.length > 1 && (
        <div className="mb-10 flex flex-wrap justify-center gap-2 md:gap-3">
          {[{ type: "all", label: "All" }, ...kinds].map((kind) => (
            <button
              key={kind.type}
              type="button"
              onClick={() => choose(kind.type)}
              aria-pressed={filter === kind.type}
              className={`btn-terminal orbit-filter ${filter === kind.type ? "btn-terminal-primary" : ""}`}
            >
              {kind.type !== "all" && <span aria-hidden="true" data-hue={kind.hue} className="orbit-swatch" />}
              {kind.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-10 md:grid-cols-[1.25fr_1fr] md:items-start md:gap-12">
        {/* The system stays in view while a long module is read beside it */}
        <Reveal className="md:sticky md:top-24">
          <div
            ref={systemRef}
            onPointerEnter={(event) => event.pointerType === "mouse" && (paused.current = true)}
            onPointerLeave={() => (paused.current = false)}
            className="learning-orbit relative w-full"
            style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
            data-filter={filter}
          >
            <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
              {kinds.map((kind) => (
                <g key={kind.type} data-type={kind.type} className="orbit-ring" data-dim={filter !== "all" && filter !== kind.type}>
                  <ellipse cx={CENTRE.x} cy={CENTRE.y} rx={kind.radius} ry={kind.radius * TILT} data-hue={kind.hue} className="orbit-path" />
                </g>
              ))}
            </svg>

            {/* The university at the centre */}
            <div className="orbit-core absolute z-20" style={{ left: `${CENTRE.x}%`, top: `${(CENTRE.y / VIEW_H) * 100}%` }} aria-hidden="true">
              <span className="orbit-core-glow" />
              <span className="orbit-core-label">UPB</span>
            </div>

            {planets.map((planet, i) => {
              const { module } = planet;
              const isActive = module.title === active.title;
              const dim = filter !== "all" && filter !== module.type;
              const current = module.status === "current";
              return (
                <button
                  key={module.title}
                  ref={(el) => {
                    planetRefs.current[i] = el;
                  }}
                  type="button"
                  onClick={() => {
                    if (dim) choose(module.type);
                    setSelected(module.title);
                  }}
                  onPointerEnter={() => setHovered(module.title)}
                  onPointerLeave={() => setHovered((h) => (h === module.title ? null : h))}
                  onFocus={() => setHovered(module.title)}
                  onBlur={() => setHovered((h) => (h === module.title ? null : h))}
                  aria-label={`${kindOf(module.type).tag}: ${module.title}${current ? " (studying now)" : ""}`}
                  aria-pressed={isActive}
                  data-cursor="interactive"
                  data-dim={dim}
                  data-active={isActive}
                  data-current={current}
                  data-kind={module.type}
                  className="orbit-planet absolute"
                >
                  {current && <span aria-hidden="true" className="orbit-halo" data-hue={planet.hue} />}
                  <span data-hue={planet.hue} data-variant="open" className="project-planet" />
                  {/* Every name shows quietly; the selected or hovered one lights up */}
                  <span
                    aria-hidden="true"
                    data-state={isActive || hovered === module.title ? "lit" : "rest"}
                    data-hue={planet.hue}
                    className="orbit-planet-label"
                  >
                    {module.short ?? module.title}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-center text-[0.6rem] uppercase tracking-[0.3em] text-gray-500">
            <span className="text-ember">◉</span> now studying · <span className="text-electric">●</span> completed ·{" "}
            {isMobile ? "tap a planet" : "select a planet"}
          </p>
        </Reveal>

        {/* The module */}
        <Reveal>
          <StudyPanel module={active} position={list.indexOf(active)} total={list.length} onStep={step} />
        </Reveal>
      </div>
    </div>
  );
}
