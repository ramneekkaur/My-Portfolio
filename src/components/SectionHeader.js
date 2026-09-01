"use client";

import { motion } from "framer-motion";

export default function SectionHeader({ eyebrow, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1 }}
      viewport={{ once: true, amount: 0.4 }}
      className="max-w-3xl mx-auto text-center space-y-6"
    >
      <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-blue-300">
        {eyebrow}
      </p>

      <h2 className="text-4xl md:text-6xl font-semibold glow-text">
        {title}
      </h2>

      {children && (
        <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
          {children}
        </p>
      )}
    </motion.div>
  );
}