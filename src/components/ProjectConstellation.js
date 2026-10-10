"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { lockScroll } from "@/lib/smoothScroll";
import { useMediaQuery } from "@/lib/useMediaQuery";

// Desktop layout, in % of the constellation area: projects zig-zag across,
// with a faint companion star between each pair and at both ends.
function layoutConstellation(count) {
  const stars = Array.from({ length: count }, (_, i) => ({
    x: count === 1 ? 50 : 14 + (72 * i) / (count - 1),
    y: i % 2 === 0 ? 60 : 28,
  }));

  const companions = stars.slice(0, -1).map((star, i) => ({
    x: (star.x + stars[i + 1].x) / 2 + 3,
    y: i % 2 === 0 ? 82 : 10,
  }));
  const start = { x: 2, y: 36 };
  const end = { x: 98, y: count % 2 === 0 ? 70 : 38 };

  const lines = [[start, stars[0]]];
  stars.forEach((star, i) => {
    if (companions[i]) lines.push([star, companions[i]], [companions[i], stars[i + 1]]);
  });
  lines.push([stars[stars.length - 1], end]);

  return { stars, companions: [start, ...companions, end], lines };
}

// The planet a star becomes. Shared (layoutId) between the star and the
// detail panel, so opening a project zooms the planet into the panel.
function Planet({ project, className = "", variant }) {
  return (
    <motion.span layoutId={`planet-${project.id}`} className={`block ${className}`}>
      <span data-hue={project.hue} data-variant={variant} className="project-planet" />
    </motion.span>
  );
}

function ProjectDetail({ project, onClose }) {
  return (
    <motion.div
      key="project-detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[96] flex items-center justify-center p-4 md:p-10"
    >
      <div className="absolute inset-0 bg-space/80 backdrop-blur-md" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`project-${project.id}-title`}
        data-lenis-prevent
        className="relative max-h-full w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-space/90 p-7 md:p-12"
      >
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Close project"
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition-colors hover:border-white/30"
        >
          <span className="absolute h-px w-4 rotate-45 bg-white" />
          <span className="absolute h-px w-4 -rotate-45 bg-white" />
        </button>

        <div className="flex items-center gap-6 pr-12">
          <Planet project={project} variant="open" className="relative h-20 w-20 shrink-0 md:h-28 md:w-28" />
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-nebula">{project.type}</p>
            <h3 id={`project-${project.id}-title`} className="mt-2 text-3xl font-semibold md:text-4xl">
              {project.title}
            </h3>
            {project.status && (
              <span className="mt-3 inline-block rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
                {project.status}
              </span>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          <p className="mt-8 text-lg leading-relaxed text-gray-300">{project.description}</p>

          {project.highlights && (
            <dl className="mt-10 grid gap-6 sm:grid-cols-2">
              {project.highlights.map((highlight) => (
                <div key={highlight.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <dt className="sr-only">{highlight.label}</dt>
                  <dd className="glow-text text-4xl font-light">{highlight.value}</dd>
                  <dd className="mt-2 text-sm text-gray-400">{highlight.label}</dd>
                </div>
              ))}
            </dl>
          )}

          <ul className="mt-10 flex flex-wrap gap-2">
            {project.tech.map((tech) => (
              <li key={tech} className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300">
                {tech}
              </li>
            ))}
          </ul>

          {project.links?.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-4">
              {project.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-electric"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function DesktopConstellation({ projects, openId, onOpen }) {
  const { stars, companions, lines } = layoutConstellation(projects.length);

  return (
    <div className="relative mt-16 h-[32rem]">
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
        {lines.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={`${a.x}%`}
            y1={`${a.y}%`}
            x2={`${b.x}%`}
            y2={`${b.y}%`}
            className="stroke-white/15"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.4, delay: i * 0.18, ease: "easeInOut" }}
          />
        ))}
        {companions.map((star, i) => (
          <circle key={i} cx={`${star.x}%`} cy={`${star.y}%`} r="1.5" className="fill-white/40" />
        ))}
      </svg>

      {projects.map((project, i) => (
        <button
          key={project.id}
          type="button"
          onClick={(event) => onOpen(project.id, event.currentTarget)}
          aria-haspopup="dialog"
          data-hue={project.hue}
          data-cursor="interactive"
          style={{ left: `${stars[i].x}%`, top: `${stars[i].y}%` }}
          className="project-star group absolute flex w-56 -translate-x-1/2 -translate-y-12 flex-col items-center text-center outline-none"
        >
          <span className="relative flex h-24 w-24 items-center justify-center">
            {openId !== project.id && <Planet project={project} variant="star" className="absolute inset-0" />}
            <span aria-hidden="true" className="project-orbit" />
            <span aria-hidden="true" className="project-star-core" />
          </span>
          <span className="mt-3 text-[0.6rem] uppercase tracking-[0.3em] text-nebula/80">{project.type}</span>
          <span className="mt-2 text-xl font-semibold">{project.title}</span>
          <span className="project-star-summary mt-2 text-sm leading-relaxed text-gray-400">{project.summary}</span>
        </button>
      ))}
    </div>
  );
}

function MobileConstellation({ projects, openId, onOpen }) {
  return (
    <ol className="relative ml-6 mt-14 space-y-12 border-l border-white/10">
      {projects.map((project) => (
        <li key={project.id} className="relative pl-10">
          <button
            type="button"
            onClick={(event) => onOpen(project.id, event.currentTarget)}
            aria-haspopup="dialog"
            data-hue={project.hue}
            className="project-star relative block w-full text-left outline-none"
          >
            <span className="absolute -left-16 top-0 flex h-12 w-12 items-center justify-center">
              {openId !== project.id && <Planet project={project} variant="compact" className="absolute inset-0" />}
            </span>
            <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-nebula/80">{project.type}</span>
            <span className="mt-2 block text-xl font-semibold">{project.title}</span>
            <span className="mt-2 block text-sm leading-relaxed text-gray-400">{project.summary}</span>
            <span className="mt-3 block text-[0.6rem] uppercase tracking-[0.3em] text-electric">Explore →</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

// Constellations of Work: every project is a star. Hover turns it into a
// glowing planet; clicking zooms the planet into the project's details.
export default function ProjectConstellation({ projects }) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [openId, setOpenId] = useState(null);
  const trigger = useRef(null);
  const openProject = projects.find((project) => project.id === openId);

  const onOpen = (id, element) => {
    trigger.current = element;
    setOpenId(id);
  };

  useEffect(() => {
    if (!openId) return;

    lockScroll(true);
    const onKey = (event) => event.key === "Escape" && setOpenId(null);
    window.addEventListener("keydown", onKey);
    const returnFocusTo = trigger.current;

    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
      returnFocusTo?.focus();
    };
  }, [openId]);

  const Layout = isMobile ? MobileConstellation : DesktopConstellation;

  return (
    <>
      <Layout projects={projects} openId={openId} onOpen={onOpen} />
      <p className="mt-10 text-center text-[0.65rem] uppercase tracking-[0.35em] text-gray-500">
        {projects.length} projects · {isMobile ? "tap a planet to explore" : "select a star to explore"}
      </p>
      <AnimatePresence>
        {openProject && <ProjectDetail project={openProject} onClose={() => setOpenId(null)} />}
      </AnimatePresence>
    </>
  );
}
