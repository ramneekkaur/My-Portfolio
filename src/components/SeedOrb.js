"use client";

import { motion } from "framer-motion";

export default function SeedOrb() {
  return (
    <motion.div
      className="seed-orb-wrapper"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2, ease: "easeOut" }}
    >
      <div className="seed-orb" />
    </motion.div>
  );
}