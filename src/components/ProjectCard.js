"use client";

import { motion } from "framer-motion";

export default function ProjectCard({ title, type, description, status }) {
  return (
    <motion.article
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3 }}
      className="group rounded-3xl border border-white/10 bg-black/30 p-6 md:p-8 backdrop-blur-md hover:border-violet-300/40"
    >
      <div className="flex items-center justify-between gap-4 mb-8">
        <span className="text-xs uppercase tracking-[0.3em] text-violet-300">
          {type}
        </span>

        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
          {status}
        </span>
      </div>

      <div className="mb-8 h-40 rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-emerald-500/10 flex items-center justify-center">
        <div className="h-4 w-4 rounded-full bg-white shadow-[0_0_40px_rgba(255,255,255,0.9)] group-hover:scale-150 transition-transform duration-500" />
      </div>

      <h3 className="text-2xl font-semibold mb-4">
        {title}
      </h3>

      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>
    </motion.article>
  );
}