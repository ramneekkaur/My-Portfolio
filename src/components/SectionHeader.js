"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SectionIcon from "@/components/SectionIcon";

// Section header: a clear tag saying what the section is ("01 · Skills"),
// then the poetic title ("Neural Ecosystem"). Both come from lib/chapters.js.
export default function SectionHeader({ chapter, children }) {
  const nature = chapter.realm === "nature";
  const [seen, setSeen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1 }}
      viewport={{ once: true, amount: 0.4 }}
      onViewportEnter={() => setSeen(true)}
      data-seen={seen}
      className="section-header max-w-3xl mx-auto text-center space-y-6"
    >
      <p
        className={`inline-flex items-center gap-3 rounded-full border px-5 py-2 text-xs md:text-sm uppercase tracking-[0.3em] ${
          nature ? "border-bloom/30 text-bloom" : "border-electric/30 text-electric"
        }`}
      >
        <SectionIcon name={chapter.icon} />
        <span>
          <span className="text-white/50">{chapter.number}</span> · {chapter.label}
        </span>
      </p>

      <h2 className="text-4xl md:text-6xl font-semibold glow-text">
        <span className="sr-only">{chapter.label}: </span>
        {chapter.title}
      </h2>

      {children && (
        <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
          {children}
        </p>
      )}
    </motion.div>
  );
}
