"use client";

import { motion } from "framer-motion";

// Gentle fade-and-rise when the block scrolls into view.
export default function Reveal({ children, className, ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 70 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2 }}
      viewport={{ once: true, amount: 0.3 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
