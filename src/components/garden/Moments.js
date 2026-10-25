"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { lockScroll, scrollToSection } from "@/lib/smoothScroll";
import { formatDay } from "@/lib/moments";
import { closeMoment, openMoment, setMomentsFilter, useMoments } from "@/lib/momentsState";

const SWIPE_PX = 40;

// "View all (n)": shows a hobby's posts in the Moments grid and scrolls to it
export function showMoments(interestId) {
  setMomentsFilter(interestId);
  scrollToSection("moments");
}

export function MomentsLink({ interestId, count, className = "btn-terminal mt-5" }) {
  if (!count) return null;
  return (
    <button type="button" onClick={() => showMoments(interestId)} className={className}>
      View all ({count}) ↓
    </button>
  );
}

function SeveralIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4">
      <rect x="5" y="1.5" width="9.5" height="9.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3.5 4.5v8.5a1 1 0 0 0 1 1H13" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

// Round covers along the top, like story highlights: All, then each hobby with posts
function Highlights({ posts, interests, filter }) {
  const items = [
    { id: "all", title: "All", cover: posts[0] },
    ...interests
      .map((interest) => ({ id: interest.id, title: interest.title, cover: posts.find((p) => p.interest === interest.id) }))
      .filter((item) => item.cover),
  ];

  return (
    <ul className="moments-highlights mt-12 flex gap-5 overflow-x-auto pb-3 md:justify-center md:gap-7">
      {items.map((item) => {
        const photo = item.cover.photos[0];
        const active = filter === item.id;
        return (
          <li key={item.id} className="shrink-0">
            <button
              type="button"
              onClick={() => setMomentsFilter(item.id)}
              aria-pressed={active}
              data-cursor="interactive"
              data-active={active}
              className="moments-highlight flex w-20 flex-col items-center gap-2 md:w-24"
            >
              <span className="moments-highlight-ring">
                <Image
                  src={photo.url}
                  alt=""
                  width={photo.width}
                  height={photo.height}
                  sizes="96px"
                  className="h-full w-full rounded-full object-cover"
                />
              </span>
              <span className="w-full truncate text-center text-[0.6rem] uppercase tracking-[0.2em] text-gray-400">
                {item.title}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Tile({ post, title }) {
  const photo = post.photos[0];
  return (
    <li>
      <button
        type="button"
        onClick={() => openMoment(post.id)}
        data-cursor="interactive"
        aria-label={`${title}${post.caption ? `: ${post.caption.slice(0, 80)}` : ""}`}
        className="moments-tile group relative block aspect-square w-full overflow-hidden rounded-[2px] border border-blossom/15"
      >
        <Image
          src={photo.url}
          alt=""
          fill
          sizes="(min-width: 1024px) 320px, 33vw"
          className="object-cover"
        />
        {post.photos.length > 1 && (
          <span className="absolute right-2 top-2 text-white drop-shadow">
            <SeveralIcon />
          </span>
        )}
        <span className="moments-tile-info pointer-events-none absolute inset-x-0 bottom-0 hidden p-3 text-left md:block">
          <span className="block text-[0.55rem] uppercase tracking-[0.3em] text-blossom">❀ {title}</span>
          {post.caption && <span className="mt-1 line-clamp-2 block text-xs text-gray-200">{post.caption}</span>}
        </span>
      </button>
    </li>
  );
}

// One post: swipe through its photos; caption, place and day beside them
function Viewer({ posts, index, titles }) {
  const post = posts[index];
  const [shown, setShown] = useState({ id: post.id, photo: 0 });
  const photoIndex = shown.id === post.id ? shown.photo : 0; // a new post starts at its first photo
  const photo = post.photos[photoIndex];
  const many = post.photos.length > 1;
  const closeRef = useRef(null);
  const swipeFrom = useRef(null);

  const showPhoto = (i) => setShown({ id: post.id, photo: Math.max(0, Math.min(post.photos.length - 1, i)) });
  const showPost = (step) => openMoment(posts[(index + step + posts.length) % posts.length].id);

  useEffect(() => {
    lockScroll(true);
    closeRef.current?.focus();
    return () => lockScroll(false);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") closeMoment();
      if (event.key === "ArrowRight") setShown({ id: post.id, photo: Math.min(post.photos.length - 1, photoIndex + 1) });
      if (event.key === "ArrowLeft") setShown({ id: post.id, photo: Math.max(0, photoIndex - 1) });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [post, photoIndex]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${titles[post.interest] ?? "Moment"}${post.place ? ` · ${post.place}` : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[96] flex items-center justify-center bg-space/95 p-3 backdrop-blur-md md:p-10"
      onClick={(event) => event.target === event.currentTarget && closeMoment()}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={closeMoment}
        aria-label="Close post"
        className="btn-terminal absolute right-3 top-3 z-10 px-3 py-2 md:right-6 md:top-6"
      >
        X
      </button>

      <motion.article
        key={post.id}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="moments-post flex max-h-full w-full max-w-5xl flex-col overflow-hidden md:h-[80vh] md:flex-row"
      >
        {/* Photos */}
        <div
          className="relative flex min-h-0 flex-1 items-center justify-center bg-black/40"
          onPointerDown={(event) => (swipeFrom.current = event.clientX)}
          onPointerUp={(event) => {
            if (swipeFrom.current === null) return;
            const dx = event.clientX - swipeFrom.current;
            swipeFrom.current = null;
            if (Math.abs(dx) > SWIPE_PX) showPhoto(photoIndex + (dx < 0 ? 1 : -1));
          }}
          style={{ touchAction: "pan-y" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={photo.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative h-[52vh] w-full md:h-full"
            >
              <Image
                src={photo.url}
                alt={post.caption ? post.caption.slice(0, 120) : `${titles[post.interest] ?? ""} photograph`}
                fill
                sizes="(min-width: 768px) 60vw, 100vw"
                className="select-none object-contain"
                draggable={false}
                priority
              />
            </motion.div>
          </AnimatePresence>

          {many && (
            <>
              <button
                type="button"
                onClick={() => showPhoto(photoIndex - 1)}
                disabled={photoIndex === 0}
                aria-label="Previous photo"
                className="moments-arrow left-3"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => showPhoto(photoIndex + 1)}
                disabled={photoIndex === post.photos.length - 1}
                aria-label="Next photo"
                className="moments-arrow right-3"
              >
                ›
              </button>
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden="true">
                {post.photos.map((p, i) => (
                  <span key={p.id} data-on={i === photoIndex} className="moments-dot" />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Caption, place and day */}
        <div data-tone="nature" className="panel flex w-full shrink-0 flex-col p-5 md:w-[22rem] md:p-7">
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-blossom">❀ {titles[post.interest] ?? "Moment"}</p>
          {post.place && <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-300">◎ {post.place}</p>}
          <div className="mt-4 max-h-[22vh] flex-1 overflow-y-auto pr-1 md:max-h-none">
            {post.caption && <p className="whitespace-pre-line text-sm leading-relaxed text-gray-200">{post.caption}</p>}
          </div>
          <p className="mt-4 text-[0.6rem] uppercase tracking-[0.3em] text-gray-500">
            {formatDay(post)}
            {many && ` · ${photoIndex + 1} / ${post.photos.length}`}
          </p>
          {posts.length > 1 && (
            <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-[0.6rem] uppercase tracking-[0.25em] text-gray-500">
              <button type="button" onClick={() => showPost(-1)} className="transition-colors hover:text-white">
                ← Prev post
              </button>
              <button type="button" onClick={() => showPost(1)} className="transition-colors hover:text-white">
                Next post →
              </button>
            </div>
          )}
        </div>
      </motion.article>
    </motion.div>
  );
}

// Moments: every hobby's posts as a profile grid, with highlights to filter
export default function Moments({ posts, interests }) {
  const { filter, open } = useMoments();
  const titles = Object.fromEntries(interests.map((interest) => [interest.id, interest.title]));
  const shown = filter === "all" ? posts : posts.filter((post) => post.interest === filter);

  // The viewer moves through the posts on show (or all of them, if the open
  // post isn't among them, e.g. opened from the planet)
  const list = shown.some((post) => post.id === open) ? shown : posts;
  const openIndex = list.findIndex((post) => post.id === open);

  if (posts.length === 0) {
    return (
      <div data-tone="nature" className="panel mt-12 p-10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
          &gt; No moments yet<span aria-hidden="true" className="cursor-block" />
        </p>
        <p className="mt-3 text-sm text-gray-500">The first blossoms are still being developed.</p>
      </div>
    );
  }

  return (
    <>
      <Highlights posts={posts} interests={interests} filter={filter} />

      <ul className="mt-8 grid grid-cols-3 gap-1 md:gap-3">
        {shown.map((post) => (
          <Tile key={post.id} post={post} title={titles[post.interest] ?? "Moment"} />
        ))}
      </ul>

      <AnimatePresence>
        {openIndex >= 0 && <Viewer key="viewer" posts={list} index={openIndex} titles={titles} />}
      </AnimatePresence>
    </>
  );
}
