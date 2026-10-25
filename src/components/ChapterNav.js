"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CHAPTERS } from "@/lib/chapters";
import { useIntroStarted } from "@/lib/introState";
import { lockScroll, scrollToSection } from "@/lib/smoothScroll";

// Desktop rail: the chapters drawn as a small constellation.
const STAR_SPACING = 40;
const STAR_X = [6, 18, 8, 20, 10, 16, 7]; // gentle zig-zag, like a real constellation
const RAIL_WIDTH = 26;
const RAIL_HEIGHT = (CHAPTERS.length - 1) * STAR_SPACING;

const starPoint = (i) => ({ x: STAR_X[i % STAR_X.length], y: i * STAR_SPACING });

// The chapter currently crossing the middle of the screen.
function useActiveChapter() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(CHAPTERS.findIndex((chapter) => chapter.id === entry.target.id));
          }
        });
      },
      { rootMargin: "-49% 0px -50% 0px" }
    );

    CHAPTERS.forEach((chapter) => {
      const section = document.getElementById(chapter.id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return active;
}

function ConstellationRail({ active, visible }) {
  return (
    <motion.nav
      aria-label="Chapters"
      initial={{ opacity: 0 }}
      animate={visible ? { opacity: 1 } : undefined}
      transition={{ duration: 1.5, delay: 5 }}
      className="chapter-rail fixed right-6 top-1/2 z-[85] hidden -translate-y-1/2 md:block"
    >
      <svg
        aria-hidden="true"
        width={RAIL_WIDTH}
        height={RAIL_HEIGHT}
        className="absolute left-0 top-0 overflow-visible"
      >
        {CHAPTERS.slice(1).map((chapter, i) => {
          const from = starPoint(i);
          const to = starPoint(i + 1);
          const lit = i + 1 <= active;
          return (
            <line
              key={chapter.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              strokeWidth={1}
              className={`transition-colors duration-700 ${
                lit
                  ? chapter.realm === "nature"
                    ? "stroke-bloom/60"
                    : "stroke-electric/60"
                  : "stroke-white/15"
              }`}
            />
          );
        })}
      </svg>

      <ol className="relative" style={{ width: RAIL_WIDTH, height: RAIL_HEIGHT }}>
        {CHAPTERS.map((chapter, i) => {
          const { x, y } = starPoint(i);
          return (
            <li key={chapter.id} className="absolute" style={{ left: x, top: y }}>
              <a
                href={`#${chapter.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection(chapter.id);
                }}
                aria-current={i === active ? "true" : undefined}
                data-tone={chapter.realm}
                className="chapter-star group absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none"
              >
                <span className="chapter-star-dot" />
                <span className="chapter-star-label">
                  <span className="text-gray-500">{chapter.number}</span> {chapter.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </motion.nav>
  );
}

function StarMapMenu({ active, visible }) {
  const [open, setOpen] = useState(false);
  const openButtonRef = useRef(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      // Return focus to the menu button after closing.
      if (wasOpen.current) openButtonRef.current?.focus();
      return;
    }

    wasOpen.current = true;
    lockScroll(true);
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);

    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const goTo = (id) => {
    lockScroll(false);
    setOpen(false);
    scrollToSection(id);
  };

  return (
    <div className="md:hidden">
      <motion.button
        ref={openButtonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="star-map"
        aria-label="Open chapters"
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : undefined}
        transition={{ duration: 1.5, delay: 5 }}
        className="fixed right-5 top-5 z-[85] flex h-11 w-11 items-center justify-center rounded-[2px] border border-phosphor/30 bg-space/60 text-phosphor backdrop-blur-md"
      >
        {/* A tiny three-star constellation */}
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20">
          <path d="M3 14 L9 6 L17 11" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" />
          <circle cx="3" cy="14" r="1.6" fill="currentColor" />
          <circle cx="9" cy="6" r="2" fill="currentColor" />
          <circle cx="17" cy="11" r="1.6" fill="currentColor" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="star-map"
            role="dialog"
            aria-modal="true"
            aria-label="Chapters"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[96] flex flex-col justify-center bg-space/95 px-10 backdrop-blur-xl"
          >
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              aria-label="Close chapters"
              className="btn-terminal absolute right-5 top-5 px-3 py-2"
            >
              X
            </button>

            <p className="term-label mb-10">Star_map</p>

            <ol className="relative ml-1 space-y-6 border-l border-white/10">
              {CHAPTERS.map((chapter, i) => (
                <motion.li
                  key={chapter.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 + i * 0.07 }}
                  className="relative pl-8"
                >
                  <span
                    data-tone={chapter.realm}
                    data-active={i === active}
                    className="star-map-dot absolute -left-[4.5px] top-1/2 -translate-y-1/2"
                  />
                  <a
                    href={`#${chapter.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      goTo(chapter.id);
                    }}
                    aria-current={i === active ? "true" : undefined}
                    className={`flex items-baseline gap-4 transition-colors ${
                      i === active ? "text-white" : "text-gray-400"
                    }`}
                  >
                    <span className="text-xs tracking-[0.3em] text-gray-500">{chapter.number}</span>
                    <span>
                      <span className="block font-display text-lg font-bold uppercase leading-tight tracking-wide">{chapter.label}</span>
                      <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.3em] text-gray-500">
                        {chapter.title}
                      </span>
                    </span>
                  </a>
                </motion.li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Chapter navigation: a constellation on the right edge on desktop, and a
// full-screen "star map" on phones. Clicking glides through the whole story.
export default function ChapterNav() {
  const active = useActiveChapter();
  const visible = useIntroStarted();

  return (
    <>
      <ConstellationRail active={active} visible={visible} />
      <StarMapMenu active={active} visible={visible} />
    </>
  );
}
