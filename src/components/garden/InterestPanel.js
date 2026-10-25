"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { openMoment, setMomentsFilter, useMoments } from "@/lib/momentsState";
import { showMoments } from "./Moments";

const PREVIEW_COUNT = 3;

// The story of the selected interest: a side panel on desktop, a bottom sheet
// on phones, with its latest moments. ← → move between interests, Esc closes.
export default function InterestPanel({ interests, posts, selected, onSelect, onClose }) {
  const interest = selected === null ? null : interests[selected];
  const closeRef = useRef(null);
  const { open } = useMoments();
  const viewing = open !== null; // a post is open on top: the keys are its
  const own = interest ? posts.filter((post) => post.interest === interest.id) : [];

  useEffect(() => {
    if (selected === null || viewing) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onSelect((selected + 1) % interests.length);
      if (event.key === "ArrowLeft") onSelect((selected - 1 + interests.length) % interests.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, viewing, interests.length, onSelect, onClose]);

  return (
    <AnimatePresence>
      {interest && (
        <motion.aside
          key="interest-panel"
          role="dialog"
          aria-label={interest.title}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          // On phones it sits above the sound switch in the bottom-right corner
          className="absolute bottom-20 left-4 right-4 z-40 md:bottom-auto md:left-auto md:right-10 md:top-[22%] md:w-[24rem]"
        >
          <div data-tone="nature" className="panel garden-panel p-6 pt-9 md:p-8 md:pt-10">
          <p className="panel-title">
            [ Interest {String(selected + 1).padStart(2, "0")} / {String(interests.length).padStart(2, "0")} ]
          </p>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn-terminal absolute right-4 top-4 px-3 py-2"
          >
            X
          </button>

          <motion.div key={interest.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <p className="pr-14 text-[0.6rem] uppercase tracking-[0.3em] text-blossom">❀ Blossom</p>
            <h2 className="mt-2 pr-14 font-display text-xl font-bold uppercase tracking-wide md:text-2xl">
              {interest.title}
            </h2>
            <p className="mt-2 text-sm text-blossom-light/80">{interest.summary}</p>
            <p className="mt-5 text-sm leading-relaxed text-gray-300">{interest.story}</p>

            {own.length > 0 && (
              <div className="mt-6">
                <ul className="grid grid-cols-3 gap-2">
                  {own.slice(0, PREVIEW_COUNT).map((post) => (
                    <li key={post.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setMomentsFilter(interest.id);
                          openMoment(post.id);
                        }}
                        aria-label={`Open ${post.caption ? post.caption.slice(0, 60) : "this moment"}`}
                        className="moments-tile relative block aspect-square w-full overflow-hidden rounded-[2px] border border-blossom/20"
                      >
                        <Image src={post.photos[0].url} alt="" fill sizes="120px" className="object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    showMoments(interest.id);
                  }}
                  className="btn-terminal btn-terminal-primary mt-4"
                >
                  View all ({own.length}) ↓
                </button>
              </div>
            )}
          </motion.div>

          <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4 text-[0.6rem] uppercase tracking-[0.25em] text-gray-500">
            <button
              type="button"
              onClick={() => onSelect((selected - 1 + interests.length) % interests.length)}
              className="transition-colors hover:text-white"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => onSelect((selected + 1) % interests.length)}
              className="transition-colors hover:text-white"
            >
              Next →
            </button>
          </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
