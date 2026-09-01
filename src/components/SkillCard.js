"use client";

import { motion } from "framer-motion";

export default function SkillCard({ title, description }) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm hover:border-blue-300/40 hover:bg-blue-300/[0.06]"
    >
      <div className="mb-5 h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_20px_rgba(147,197,253,0.9)]" />

      <h3 className="text-xl font-semibold text-white mb-3">
        {title}
      </h3>

      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}