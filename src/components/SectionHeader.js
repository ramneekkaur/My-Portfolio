"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SectionIcon from "@/components/SectionIcon";
import Typewriter from "@/components/Typewriter";

// Section header, mission-control style: a bracketed tag saying what the
// section is ([ 01 · SKILLS ]), then the poetic title typed out like a
// terminal line (> NEURAL ECOSYSTEM█). Both come from lib/chapters.js.
export default function SectionHeader({ chapter, children }) {
  const nature = chapter.realm === "nature";
  const [seen, setSeen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      onViewportEnter={() => setSeen(true)}
      data-seen={seen}
      className="section-header max-w-3xl mx-auto text-center space-y-6"
    >
      <p
        className={`inline-flex items-center gap-3 rounded-[2px] border px-4 py-2 text-xs md:text-sm uppercase tracking-[0.25em] ${
          nature ? "border-bloom/35 text-bloom" : "border-phosphor/35 text-phosphor"
        }`}
      >
        <span aria-hidden="true" className="opacity-60">[</span>
        <SectionIcon name={chapter.icon} />
        <span>
          <span className="text-white/45">{chapter.number}</span> · {chapter.label}
        </span>
        <span aria-hidden="true" className="opacity-60">]</span>
      </p>

      <h2 className="font-display text-3xl font-bold uppercase tracking-wide md:text-5xl glow-text">
        <span className="sr-only">{chapter.label}: </span>
        <span aria-hidden="true" className="mr-3 text-phosphor-dim">&gt;</span>
        <Typewriter text={chapter.title.toUpperCase()} />
      </h2>

      {children && (
        <p className="text-gray-400 text-base md:text-lg leading-relaxed">
          {children}
        </p>
      )}
    </motion.div>
  );
}
